// Input validation. Each validate* function returns the cleaned value or throws AppError(400).
const AppError = require('./AppError');
const { isValidDate, isValidTime } = require('./dates');

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
const PRIORITIES = [1, 2, 3];
const ROLES = ['admin', 'doctor', 'receptionist'];

const str = (v) => (v === undefined || v === null ? '' : String(v).trim());
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function finish(errors, value) {
  if (Object.keys(errors).length) throw new AppError(400, 'Please correct the highlighted fields.', errors);
  return value;
}

function validatePatient(body, { isUpdate = false } = {}) {
  const errors = {};
  const v = {};

  v.patient_id = str(body.patient_id).toUpperCase();
  if (!isUpdate) {
    if (!v.patient_id) errors.patient_id = 'Patient ID is required.';
    else if (!/^[A-Z0-9-]{3,20}$/.test(v.patient_id)) errors.patient_id = 'Use 3-20 letters, numbers or hyphens (example: P1006).';
  }

  v.name = str(body.name);
  if (!v.name) errors.name = 'Name is required.';
  else if (v.name.length > 100) errors.name = 'Name must be 100 characters or fewer.';

  const ageRaw = str(body.age);
  if (ageRaw === '') {
    v.age = 25; // Default age if not provided during quick signup
  } else {
    v.age = Number(ageRaw);
    if (!Number.isInteger(v.age) || v.age < 0 || v.age > 120) errors.age = 'Age must be a whole number between 0 and 120.';
  }

  v.gender = str(body.gender) || 'Other';
  if (!GENDERS.includes(v.gender)) v.gender = 'Other';

  v.phone = str(body.phone);
  if (v.phone && (!/^\+?[0-9\s-]{7,15}$/.test(v.phone) || v.phone.replace(/\D/g, '').length < 7)) {
    errors.phone = 'Enter a valid phone number (7-15 digits).';
  }
  if (!v.phone) v.phone = null;

  v.email = str(body.email);
  if (v.email && !EMAIL_RE.test(v.email)) errors.email = 'Enter a valid email address.';
  if (!v.email) v.email = null;

  if (!v.phone && !v.email) {
    errors.contact = 'Please provide at least a phone number or an email address.';
  }

  v.hospital_id = str(body.hospital_id) || null;
  v.address = str(body.address) || null;

  v.blood_group = str(body.blood_group);
  if (v.blood_group && !BLOOD_GROUPS.includes(v.blood_group)) errors.blood_group = 'Choose a blood group from the list.';
  if (!v.blood_group) v.blood_group = null;

  return finish(errors, v);
}

function validateDoctor(body, { isUpdate = false } = {}) {
  const errors = {};
  const v = {};
  v.doctor_id = str(body.doctor_id).toUpperCase();
  if (!isUpdate) {
    if (!v.doctor_id) errors.doctor_id = 'Doctor ID is required.';
    else if (!/^[A-Z0-9-]{2,20}$/.test(v.doctor_id)) errors.doctor_id = 'Use 2-20 letters, numbers or hyphens (example: D004).';
  }
  v.name = str(body.name);
  if (!v.name) errors.name = 'Name is required.';
  v.specialization = str(body.specialization);
  if (!v.specialization) errors.specialization = 'Specialization is required.';
  v.phone = str(body.phone);
  if (v.phone && (!/^\+?[0-9\s-]{7,15}$/.test(v.phone))) errors.phone = 'Enter a valid phone number.';
  if (!v.phone) v.phone = null;
  v.email = str(body.email);
  if (v.email && !EMAIL_RE.test(v.email)) errors.email = 'Enter a valid email address.';
  if (!v.email) v.email = null;
  return finish(errors, v);
}

function validateAppointment(body) {
  const errors = {};
  const v = {};
  v.patient_id = str(body.patient_id).toUpperCase();
  if (!v.patient_id) errors.patient_id = 'Choose a patient.';
  v.doctor_id = str(body.doctor_id).toUpperCase();
  if (!v.doctor_id) errors.doctor_id = 'Choose a doctor.';
  v.appointment_date = str(body.appointment_date);
  if (!isValidDate(v.appointment_date)) errors.appointment_date = 'Enter a valid date.';
  v.appointment_time = str(body.appointment_time);
  if (!isValidTime(v.appointment_time)) errors.appointment_time = 'Enter a valid time.';
  v.priority = body.priority === undefined || body.priority === '' ? 3 : Number(body.priority);
  if (!PRIORITIES.includes(v.priority)) errors.priority = 'Priority must be 1 (Critical), 2 (Emergency) or 3 (Normal).';
  v.status = str(body.status) || 'Pending';
  if (!STATUSES.includes(v.status)) errors.status = 'Status must be Pending, Confirmed, Completed or Cancelled.';
  return finish(errors, v);
}

function validateHistory(body) {
  const errors = {};
  const v = {};
  v.doctor_id = str(body.doctor_id).toUpperCase();
  if (!v.doctor_id) errors.doctor_id = 'Choose a doctor.';
  v.visit_date = str(body.visit_date);
  if (!isValidDate(v.visit_date)) errors.visit_date = 'Enter a valid visit date.';
  v.diagnosis = str(body.diagnosis);
  if (!v.diagnosis) errors.diagnosis = 'Diagnosis is required.';
  v.treatment = str(body.treatment);
  if (!v.treatment) errors.treatment = 'Treatment is required.';
  v.notes = str(body.notes) || null;
  return finish(errors, v);
}

function validatePrescription(body) {
  const errors = {};
  const v = {};
  v.doctor_id = str(body.doctor_id).toUpperCase();
  if (!v.doctor_id) errors.doctor_id = 'Choose a doctor.';
  v.medicine = str(body.medicine);
  if (!v.medicine) errors.medicine = 'Medicine is required.';
  v.dosage = str(body.dosage);
  if (!v.dosage) errors.dosage = 'Dosage is required.';
  v.duration = str(body.duration);
  if (!v.duration) errors.duration = 'Duration is required.';
  v.instructions = str(body.instructions) || null;
  return finish(errors, v);
}

function validateUser(body) {
  const errors = {};
  const v = {};
  v.name = str(body.name);
  if (!v.name) errors.name = 'Name is required.';
  v.email = str(body.email).toLowerCase();
  if (!EMAIL_RE.test(v.email)) errors.email = 'Enter a valid email address.';
  v.role = str(body.role);
  if (!ROLES.includes(v.role)) errors.role = 'Choose admin, doctor or receptionist.';
  v.password = String(body.password || '');
  if (v.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  return finish(errors, v);
}

module.exports = {
  GENDERS, BLOOD_GROUPS, STATUSES, PRIORITIES, ROLES,
  validatePatient, validateDoctor, validateAppointment, validateHistory, validatePrescription, validateUser,
};
