const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/userModel');
const hospitalModel = require('../models/hospitalModel');
const doctorModel = require('../models/doctorModel');
const patientModel = require('../models/patientModel');
const patientService = require('./patientService');
const AppError = require('../utils/AppError');

const publicUser = (u) => ({
  id: u.user_id,
  name: u.name,
  email: u.email,
  role: u.role,
  hospital_id: u.hospital_id || null,
  hospital_name: u.hospital_name || null,
  doctor_id: u.doctor_id || null,
  doctor_name: u.doctor_name || null,
  patient_id: u.patient_id || null,
  patient_name: u.patient_name || null,
  status: u.status || 'approved',
});

async function login(email, password, { role = null, hospital_id = null } = {}) {
  if (!email || !password) throw new AppError(400, 'Email and password are required.');
  const user = await userModel.findByEmail(String(email).trim());
  const ok = user && (await bcrypt.compare(String(password), user.password_hash));
  if (!ok) throw new AppError(401, 'Invalid email or password.');

  // If user role is pending approval
  if (user.status === 'pending') {
    throw new AppError(403, 'Your registration is pending Admin approval. Please contact the administrator.');
  }
  if (user.status === 'rejected') {
    throw new AppError(403, 'Your account registration was declined by the administrator.');
  }

  // Doctor specific hospital restriction
  if (user.role === 'doctor') {
    if (!hospital_id) {
      throw new AppError(400, 'Please select your hospital to log in.');
    }
    if (user.hospital_id !== hospital_id) {
      throw new AppError(401, 'Doctor is not associated with the selected hospital.');
    }
  }

  const u = publicUser(user);
  const token = jwt.sign(u, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  return { token, user: u };
}

async function registerHospital({ name, email, password, phone, address, city }) {
  if (!name || !email || !password) throw new AppError(400, 'Name, email, and password are required.');
  if (await userModel.findByEmail(email)) throw new AppError(409, 'An account with this email already exists.');

  const totalHospitals = await hospitalModel.count();
  // 10 initial hospitals are auto-approved; beyond 10 requires Admin approval
  const status = totalHospitals < 10 ? 'approved' : 'pending';
  const hospital_id = await hospitalModel.nextId();

  const hospital = await hospitalModel.create({
    hospital_id,
    name,
    email,
    phone,
    address,
    city,
    status,
  });

  const password_hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    name: `${name} Admin`,
    email,
    password_hash,
    role: 'hospital',
    hospital_id,
    status,
  });

  return {
    hospital,
    user: publicUser(user),
    isPending: status === 'pending',
    message: status === 'pending'
      ? 'Hospital registration submitted! Since the 10 initial hospital slots are filled, your registration is pending Admin approval.'
      : 'Hospital registered successfully! You can now log in.',
  };
}

async function registerDoctor({ name, specialization, phone, email, password, hospital_id }) {
  if (!name || !specialization || !email || !password || !hospital_id) {
    throw new AppError(400, 'All fields including hospital selection are required.');
  }
  const hospital = await hospitalModel.findById(hospital_id);
  if (!hospital || hospital.status !== 'approved') {
    throw new AppError(404, 'Selected hospital is not active or approved.');
  }

  const doctorCount = await doctorModel.countByHospital(hospital_id);
  if (doctorCount >= 10) {
    throw new AppError(400, `Hospital "${hospital.name}" has reached the maximum limit of 10 registered doctors.`);
  }

  if (await userModel.findByEmail(email)) throw new AppError(409, 'An account with this email already exists.');

  const doctor_id = await doctorModel.nextId();
  const doctor = await doctorModel.create({
    doctor_id,
    hospital_id,
    name,
    specialization,
    phone,
    email,
    status: 'approved',
  });

  const password_hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    name,
    email,
    password_hash,
    role: 'doctor',
    hospital_id,
    doctor_id,
    status: 'approved',
  });

  return { doctor, user: publicUser(user), message: 'Doctor registered successfully!' };
}

async function registerPatient({ name, email, password, phone, age, gender, address, blood_group, hospital_id = null }) {
  if (!name || !email || !password || !phone || age === undefined || !gender) {
    throw new AppError(400, 'Name, email, password, phone, age, and gender are required.');
  }
  if (await userModel.findByEmail(email)) throw new AppError(409, 'An account with this email already exists.');

  const patient_id = await patientModel.nextId();
  const patient = await patientModel.create({
    patient_id,
    hospital_id: hospital_id || null,
    name,
    age: Number(age),
    gender,
    phone,
    email,
    address,
    blood_group,
  });

  const password_hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    name,
    email,
    password_hash,
    role: 'patient',
    hospital_id: hospital_id || null,
    patient_id,
    status: 'approved',
  });

  await patientService.refreshIndex();
  const u = publicUser(user);
  const token = jwt.sign(u, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  return { token, user: u, patient, message: 'Welcome! Account created successfully.' };
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) throw new AppError(400, 'Current and new password are required.');
  if (String(newPassword).length < 8) throw new AppError(400, 'New password must be at least 8 characters.', { newPassword: 'Use at least 8 characters.' });
  const user = await userModel.findById(userId);
  if (!user || !(await bcrypt.compare(String(currentPassword), user.password_hash))) {
    throw new AppError(400, 'Current password is incorrect.', { currentPassword: 'Current password is incorrect.' });
  }
  await userModel.updatePassword(userId, await bcrypt.hash(String(newPassword), 10));
}

module.exports = {
  login,
  registerHospital,
  registerDoctor,
  registerPatient,
  changePassword,
  publicUser,
};
