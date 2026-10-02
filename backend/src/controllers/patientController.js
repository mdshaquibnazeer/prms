const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const patientService = require('../services/patientService');
const { validatePatient } = require('../utils/validators');

exports.list = asyncHandler(async (req, res) => {
  const { data, meta } = await patientService.list(req.query);
  res.json({ success: true, data, meta });
});

exports.nextId = asyncHandler(async (req, res) => {
  res.json({ success: true, patient_id: await patientService.nextId() });
});

exports.get = asyncHandler(async (req, res) => {
  const { patient, lookup } = await patientService.getById(req.params.id);
  res.json({ success: true, data: patient, meta: { lookup } });
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
