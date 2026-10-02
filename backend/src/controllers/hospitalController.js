const asyncHandler = require('../utils/asyncHandler');
const hospitalModel = require('../models/hospitalModel');
const doctorModel = require('../models/doctorModel');
const authService = require('../services/authService');
const AppError = require('../utils/AppError');

exports.listPublic = asyncHandler(async (req, res) => {
  const hospitals = await hospitalModel.findAll('approved');
  res.json({
    success: true,
    data: hospitals.map(h => ({
      hospital_id: h.hospital_id,
      name: h.name,
      city: h.city,
      address: h.address,
      phone: h.phone,
    })),
  });
});

exports.list = asyncHandler(async (req, res) => {
  let hospitals;
  if (req.user.role === 'admin') {
    hospitals = await hospitalModel.findAll();
  } else if (req.user.role === 'hospital') {
    const h = await hospitalModel.findById(req.user.hospital_id);
    hospitals = h ? [h] : [];
  } else {
    hospitals = await hospitalModel.findAll('approved');
  }
  res.json({ success: true, data: hospitals });
});

exports.get = asyncHandler(async (req, res) => {
  const h = await hospitalModel.findById(req.params.id);
  if (!h) throw new AppError(404, 'Hospital not found.');
  res.json({ success: true, data: h });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'pending', 'rejected'].includes(status)) {
    throw new AppError(400, 'Status must be approved, pending, or rejected.');
  }
  const updated = await hospitalModel.updateStatus(req.params.id, status);
  if (!updated) throw new AppError(404, 'Hospital not found.');
  res.json({ success: true, message: `Hospital status updated to ${status}.`, data: updated });
});

exports.listDoctors = asyncHandler(async (req, res) => {
  const hospital_id = req.params.id;
  const doctors = await doctorModel.findByHospital(hospital_id);
  res.json({ success: true, data: doctors });
});

exports.createDoctor = asyncHandler(async (req, res) => {
  const hospital_id = req.params.id;
  // If user is a hospital admin, verify they are adding to their own hospital
  if (req.user.role === 'hospital' && req.user.hospital_id !== hospital_id) {
    throw new AppError(403, 'You can only add doctors to your own hospital.');
  }
  const result = await authService.registerDoctor({ ...req.body, hospital_id });
  res.status(201).json({ success: true, message: result.message, data: result.doctor });
});
