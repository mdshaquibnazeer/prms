const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');

const publicUser = (u) => ({ id: u.user_id, name: u.name, email: u.email, role: u.role });

async function login(email, password) {
  if (!email || !password) throw new AppError(400, 'Email and password are required.');
  const user = await userModel.findByEmail(String(email).trim());
  // Same message for "no such user" and "wrong password" so attackers cannot probe for accounts.
  const ok = user && (await bcrypt.compare(String(password), user.password_hash));
  if (!ok) throw new AppError(401, 'Invalid email or password.');
  const u = publicUser(user);
  const token = jwt.sign(u, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  return { token, user: u };
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

async function createUser({ name, email, password, role }) {
  if (await userModel.findByEmail(email)) throw new AppError(409, 'A user with this email already exists.', { email: 'Email already in use.' });
  return userModel.create({ name, email, password_hash: await bcrypt.hash(password, 10), role });
}

module.exports = { login, changePassword, createUser, publicUser };
