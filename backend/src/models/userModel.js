const db = require('../config/db');

exports.findByEmail = async (email) =>
  (await db.query(`
    SELECT u.*, h.name AS hospital_name, d.name AS doctor_name, p.name AS patient_name
    FROM users u
    LEFT JOIN hospitals h ON h.hospital_id = u.hospital_id
    LEFT JOIN doctors d ON d.doctor_id = u.doctor_id
    LEFT JOIN patients p ON p.patient_id = u.patient_id
    WHERE LOWER(u.email) = LOWER($1)
  `, [email])).rows[0];

exports.findById = async (id) =>
  (await db.query(`
    SELECT u.*, h.name AS hospital_name, d.name AS doctor_name, p.name AS patient_name
    FROM users u
    LEFT JOIN hospitals h ON h.hospital_id = u.hospital_id
    LEFT JOIN doctors d ON d.doctor_id = u.doctor_id
    LEFT JOIN patients p ON p.patient_id = u.patient_id
    WHERE u.user_id = $1
  `, [id])).rows[0];

exports.findAll = async () =>
  (await db.query(`
    SELECT u.user_id, u.name, u.email, u.role, u.hospital_id, u.status, u.created_at, h.name AS hospital_name
    FROM users u
    LEFT JOIN hospitals h ON h.hospital_id = u.hospital_id
    ORDER BY u.user_id
  `)).rows;

exports.create = async ({ name, email, password_hash, role, hospital_id = null, doctor_id = null, patient_id = null, status = 'approved' }) =>
  (await db.query(
    `INSERT INTO users (name, email, password_hash, role, hospital_id, doctor_id, patient_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING user_id, name, email, role, hospital_id, doctor_id, patient_id, status, created_at`,
    [name, email, password_hash, role, hospital_id, doctor_id, patient_id, status]
  )).rows[0];

exports.updateStatus = async (id, status) =>
  (await db.query('UPDATE users SET status = $2 WHERE user_id = $1 RETURNING *', [id, status])).rows[0];

exports.updatePassword = async (id, hash) =>
  db.query('UPDATE users SET password_hash = $2 WHERE user_id = $1', [id, hash]);
