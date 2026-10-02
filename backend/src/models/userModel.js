const db = require('../config/db');

const USER_SELECT = `
  SELECT u.*,
         COALESCE(u.phone, p.phone) AS user_phone,
         p.phone AS patient_phone,
         p.email AS patient_email,
         p.blood_group,
         p.address,
         p.age,
         p.gender,
         h.name AS hospital_name,
         d.name AS doctor_name,
         p.name AS patient_name
  FROM users u
  LEFT JOIN hospitals h ON h.hospital_id = u.hospital_id
  LEFT JOIN doctors d ON d.doctor_id = u.doctor_id
  LEFT JOIN patients p ON p.patient_id = u.patient_id`;

exports.findByEmail = async (email) =>
  (await db.query(`${USER_SELECT} WHERE LOWER(COALESCE(u.email, '')) = LOWER($1)`, [email])).rows[0];

exports.findByPhone = async (phone) => {
  const clean = String(phone || '').replace(/\D/g, '');
  return (await db.query(`
    ${USER_SELECT}
    WHERE COALESCE(u.phone, '') = $1
       OR COALESCE(p.phone, '') = $1
       OR REGEXP_REPLACE(COALESCE(u.phone, ''), '[^0-9]', '', 'g') = $2
       OR REGEXP_REPLACE(COALESCE(p.phone, ''), '[^0-9]', '', 'g') = $2
  `, [phone, clean])).rows[0];
};

exports.findByEmailOrPhone = async (identifier) => {
  const trimmed = String(identifier || '').trim();
  const cleanDigits = trimmed.replace(/\D/g, '');
  const res = await db.query(`
    ${USER_SELECT}
    WHERE LOWER(COALESCE(u.email, '')) = LOWER($1)
       OR LOWER(COALESCE(p.email, '')) = LOWER($1)
       OR COALESCE(u.phone, '') = $1
       OR COALESCE(p.phone, '') = $1
       OR (LENGTH($2) >= 6 AND (
            REGEXP_REPLACE(COALESCE(u.phone, ''), '[^0-9]', '', 'g') = $2
         OR REGEXP_REPLACE(COALESCE(p.phone, ''), '[^0-9]', '', 'g') = $2
       ))
    LIMIT 1
  `, [trimmed, cleanDigits]);
  return res.rows[0];
};

exports.findById = async (id) =>
  (await db.query(`${USER_SELECT} WHERE u.user_id = $1`, [id])).rows[0];

exports.findAll = async () =>
  (await db.query(`
    SELECT u.user_id, u.name, u.email, u.phone, u.role, u.hospital_id, u.status, u.created_at, h.name AS hospital_name
    FROM users u
    LEFT JOIN hospitals h ON h.hospital_id = u.hospital_id
    ORDER BY u.user_id
  `)).rows;

exports.create = async ({ name, email = null, phone = null, password_hash, role, hospital_id = null, doctor_id = null, patient_id = null, status = 'approved' }) =>
  (await db.query(
    `INSERT INTO users (name, email, phone, password_hash, role, hospital_id, doctor_id, patient_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING user_id, name, email, phone, role, hospital_id, doctor_id, patient_id, status, created_at`,
    [name, email || null, phone || null, password_hash, role, hospital_id, doctor_id, patient_id, status]
  )).rows[0];

exports.updateStatus = async (id, status) =>
  (await db.query('UPDATE users SET status = $2 WHERE user_id = $1 RETURNING *', [id, status])).rows[0];

exports.updatePassword = async (id, hash) =>
  db.query('UPDATE users SET password_hash = $2 WHERE user_id = $1', [id, hash]);

