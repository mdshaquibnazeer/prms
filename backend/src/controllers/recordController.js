const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const historyService = require('../services/historyService');
const prescriptionService = require('../services/prescriptionService');
const { validateHistory, validatePrescription } = require('../utils/validators');

exports.getHistory = asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'admin') {
    throw new AppError(403, 'Medical history contains confidential clinical details and is not accessible to Admin.');
  }
  res.json({ success: true, data: await historyService.getForPatient(req.params.id) });
});

exports.addHistory = asyncHandler(async (req, res) => {
  const r = await historyService.add(req.params.id, validateHistory(req.body));
  res.status(201).json({ success: true, message: 'Medical history added.', data: r });
});

exports.deleteHistory = asyncHandler(async (req, res) => {
  await historyService.remove(req.params.id);
  res.json({ success: true, message: 'Medical history record deleted.' });
});

exports.getPrescriptions = asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'admin') {
    throw new AppError(403, 'Prescriptions contain confidential clinical details and are not accessible to Admin.');
  }
  res.json({ success: true, data: await prescriptionService.listForPatient(req.params.id) });
});

exports.listAllPrescriptions = asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'admin') {
    throw new AppError(403, 'Prescriptions contain confidential clinical details and are not accessible to Admin.');
  }
  res.json({ success: true, data: await prescriptionService.listAll() });
});

exports.addPrescription = asyncHandler(async (req, res) => {
  const r = await prescriptionService.add(req.params.id, validatePrescription(req.body));
  res.status(201).json({ success: true, message: 'Prescription added.', data: r });
});

exports.deletePrescription = asyncHandler(async (req, res) => {
  await prescriptionService.remove(req.params.id);
  res.json({ success: true, message: 'Prescription deleted.' });
});
