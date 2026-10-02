const asyncHandler = require('../utils/asyncHandler');
const appointmentService = require('../services/appointmentService');
const { validateAppointment, STATUSES } = require('../utils/validators');
const AppError = require('../utils/AppError');

exports.list = asyncHandler(async (req, res) => {
  const { scope, status, patient_id, doctor_id } = req.query;
  if (scope && !['today', 'upcoming', 'all'].includes(scope)) throw new AppError(400, 'Scope must be today, upcoming or all.');
  if (status && !STATUSES.includes(status)) throw new AppError(400, 'Invalid status filter.');
  const data = await appointmentService.list({ scope, status, patient_id: patient_id && String(patient_id).toUpperCase(), doctor_id: doctor_id && String(doctor_id).toUpperCase() });
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const a = await appointmentService.create(validateAppointment(req.body));
  res.status(201).json({ success: true, message: 'Appointment booked.', data: a });
});

exports.update = asyncHandler(async (req, res) => {
  const a = await appointmentService.update(req.params.id, validateAppointment(req.body));
  res.json({ success: true, message: 'Appointment updated.', data: a });
});

exports.remove = asyncHandler(async (req, res) => {
  await appointmentService.remove(req.params.id);
  res.json({ success: true, message: 'Appointment deleted.' });
});

exports.queue = asyncHandler(async (req, res) => res.json({ success: true, data: await appointmentService.getNormalQueue() }));

exports.serveNext = asyncHandler(async (req, res) => {
  const { served, remaining } = await appointmentService.serveNext();
  res.json({ success: true, message: `${served.patient_name} was called in and the appointment is marked Completed.`, data: { served, remaining } });
});
