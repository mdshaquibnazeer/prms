const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');
const { validateUser } = require('../utils/validators');

exports.login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body.email, req.body.password);
  res.json({ success: true, token, user });
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
  const user = await authService.createUser(validateUser(req.body));
  res.status(201).json({ success: true, message: 'User created.', data: user });
});
