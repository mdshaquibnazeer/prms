const db = require('../config/db');

exports.findByEmail = async (email) => (await db.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1)', [email])).rows[0];
exports.findById = async (id) => (await db.query('SELECT * FROM users WHERE user_id=$1', [id])).rows[0];
exports.findAll = async () => (await db.query('SELECT user_id, name, email, role, created_at FROM users ORDER BY user_id')).rows;
exports.create = async ({ name, email, password_hash, role }) =>
  (await db.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING user_id, name, email, role, created_at',
    [name, email, password_hash, role]
  )).rows[0];
exports.updatePassword = async (id, hash) => db.query('UPDATE users SET password_hash=$2 WHERE user_id=$1', [id, hash]);
