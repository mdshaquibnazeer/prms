const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const patientModel = require('../models/patientModel');
const notificationModel = require('../models/notificationModel');
const patientService = require('../services/patientService');
const { validatePatient } = require('../utils/validators');

exports.list = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  // Doctors can ONLY see patients they have treated or who are allotted to them
  if (req.user && req.user.role === 'doctor') {
    const doctorPatientIds = await patientModel.getPatientIdsForDoctor(req.user.doctor_id);
    query.allowedIds = doctorPatientIds;
  }

  const { data, meta } = await patientService.list(query);

  // If admin, ensure hospital name is clearly stated or 'No Hospital'
  const sanitized = data.map((p) => ({
    ...p,
    hospital_name: p.hospital_name || 'No Hospital',
  }));

  res.json({ success: true, data: sanitized, meta });
});

exports.nextId = asyncHandler(async (req, res) => {
  res.json({ success: true, patient_id: await patientService.nextId() });
});

exports.get = asyncHandler(async (req, res) => {
  // Doctors can only view allotted/treated patients
  if (req.user && req.user.role === 'doctor') {
    const doctorPatientIds = await patientModel.getPatientIdsForDoctor(req.user.doctor_id);
    if (!doctorPatientIds.includes(req.params.id)) {
      throw new AppError(403, 'Access denied. You can only view patients who are allotted to or treated by you.');
    }
  }

  const { patient, lookup } = await patientService.getById(req.params.id);
  const data = {
    ...patient,
    hospital_name: patient.hospital_name || 'No Hospital',
  };

  res.json({ success: true, data, meta: { lookup } });
});

exports.create = asyncHandler(async (req, res) => {
  const patient = await patientService.create(validatePatient(req.body));
  res.status(201).json({ success: true, message: 'Patient added successfully.', data: patient });
});

exports.update = asyncHandler(async (req, res) => {
  const patient = await patientService.update(req.params.id, validatePatient(req.body, { isUpdate: true }));
  res.json({ success: true, message: 'Patient updated successfully.', data: patient });
});

exports.remove = asyncHandler(async (req, res) => {
  await patientService.remove(req.params.id);
  res.json({ success: true, message: 'Patient deleted.' });
});

exports.transferHospital = asyncHandler(async (req, res) => {
  const { hospital_id } = req.body;
  if (!hospital_id) throw new AppError(400, 'Hospital ID is required.');
  const patient = await patientService.transferHospital(req.params.id, hospital_id);
  res.json({ success: true, message: 'Patient care transferred to hospital successfully.', data: patient });
});

// Hospital sends notification to patient if linked or visited
exports.notifyPatient = asyncHandler(async (req, res) => {
  const { title, message } = req.body;
  const patientId = req.params.id;
  const hospitalId = req.user.hospital_id;

  if (!title || !message) throw new AppError(400, 'Notification title and message are required.');

  // If sent by hospital, verify linkage or past visit
  if (req.user.role === 'hospital') {
    const isLinked = await patientModel.isPatientLinkedToHospital(patientId, hospitalId);
    if (!isLinked) {
      throw new AppError(403, 'Hospital can only send notifications to patients who are linked or have had visits at this hospital.');
    }
  }

  const notification = await notificationModel.create({
    patient_id: patientId,
    hospital_id: hospitalId || null,
    sender_name: req.user.name || 'Hospital Administration',
    title,
    message,
  });

  res.status(201).json({ success: true, message: 'Notification delivered to patient.', data: notification });
});

exports.getNotifications = asyncHandler(async (req, res) => {
  const patientId = req.user.role === 'patient' ? req.user.patient_id : req.params.id;
  const notifications = await notificationModel.findByPatient(patientId);
  res.json({ success: true, data: notifications });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const updated = await notificationModel.markRead(req.params.notificationId);
  res.json({ success: true, data: updated });
});
