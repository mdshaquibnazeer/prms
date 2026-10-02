const db = require('../config/db');

exports.findAll = async (status = null) => {
  if (status) {
    return (await db.query('SELECT * FROM hospitals WHERE status = $1 ORDER BY hospital_id', [status])).rows;
  }
  return (await db.query('SELECT * FROM hospitals ORDER BY hospital_id')).rows;
};

exports.findById = async (id) =>
  (await db.query('SELECT * FROM hospitals WHERE hospital_id = $1', [id])).rows[0];

exports.findByEmail = async (email) =>
  (await db.query('SELECT * FROM hospitals WHERE LOWER(email) = LOWER($1)', [email])).rows[0];

exports.count = async () =>
  (await db.query('SELECT COUNT(*)::int AS n FROM hospitals')).rows[0].n;

exports.create = async ({ hospital_id, name, email, phone, address, city, status = 'approved' }) =>
  (await db.query(
    `INSERT INTO hospitals (hospital_id, name, email, phone, address, city, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [hospital_id, name, email, phone, address, city, status]
  )).rows[0];

exports.updateStatus = async (id, status) =>
  (await db.query('UPDATE hospitals SET status = $2 WHERE hospital_id = $1 RETURNING *', [id, status])).rows[0];

exports.nextId = async () => {
  const r = await db.query("SELECT MAX(SUBSTRING(hospital_id, 2)::int) AS m FROM hospitals WHERE hospital_id ~ '^H[0-9]+$'");
  const next = (r.rows[0].m || 0) + 1;
  return `H${String(next).padStart(3, '0')}`;
};
