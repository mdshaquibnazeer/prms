const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');

exports.login = asyncHandler(async (req, res) => {
  const { email, password, role, hospital_id } = req.body;
  const { token, user } = await authService.login(email, password, { role, hospital_id });
  res.json({ success: true, token, user });
});

exports.registerHospital = asyncHandler(async (req, res) => {
  const result = await authService.registerHospital(req.body);
  res.status(result.isPending ? 202 : 201).json({
    success: true,
    message: result.message,
    data: result,
  });
});

exports.registerDoctor = asyncHandler(async (req, res) => {
  const result = await authService.registerDoctor(req.body);
  res.status(201).json({
    success: true,
    message: result.message,
    data: result,
  });
});

exports.registerPatient = asyncHandler(async (req, res) => {
  const result = await authService.registerPatient(req.body);
  res.status(201).json({
    success: true,
    message: result.message,
    token: result.token,
    user: result.user,
    patient: result.patient,
  });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) throw new AppError(401, 'Your account no longer exists.');
  res.json({ success: true, user: authService.publicUser(user) });
});

exports.changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.json({ success: true, message: 'Password changed successfully.' });
});

exports.listUsers = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await userModel.findAll() });
});

exports.createUser = asyncHandler(async (req, res) => {
  const user = await authService.createUser(req.body);
  res.status(201).json({ success: true, message: 'User created.', data: user });
});
