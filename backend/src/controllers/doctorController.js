const asyncHandler = require('../utils/asyncHandler');
const doctorModel = require('../models/doctorModel');
const AppError = require('../utils/AppError');
const { validateDoctor } = require('../utils/validators');

exports.list = asyncHandler(async (req, res) => res.json({ success: true, data: await doctorModel.findAll() }));

exports.get = asyncHandler(async (req, res) => {
  const d = await doctorModel.findById(String(req.params.id).toUpperCase());
  if (!d) throw new AppError(404, 'Doctor not found.');
  res.json({ success: true, data: d });
});

exports.create = asyncHandler(async (req, res) => {
  const v = validateDoctor(req.body);
  if (await doctorModel.findById(v.doctor_id)) throw new AppError(409, `Doctor ID ${v.doctor_id} already exists.`, { doctor_id: 'This Doctor ID is already in use.' });
  res.status(201).json({ success: true, message: 'Doctor added successfully.', data: await doctorModel.create(v) });
});

exports.update = asyncHandler(async (req, res) => {
  const id = String(req.params.id).toUpperCase();
  const d = await doctorModel.update(id, validateDoctor(req.body, { isUpdate: true }));
  if (!d) throw new AppError(404, 'Doctor not found.');
  res.json({ success: true, message: 'Doctor updated successfully.', data: d });
});

exports.remove = asyncHandler(async (req, res) => {
  const id = String(req.params.id).toUpperCase();
  try {
    if (!(await doctorModel.remove(id))) throw new AppError(404, 'Doctor not found.');
  } catch (err) {
    if (err.code === '23503') throw new AppError(409, 'This doctor has appointments, history or prescriptions and cannot be deleted.');
    throw err;
  }
  res.json({ success: true, message: 'Doctor deleted.' });
});
