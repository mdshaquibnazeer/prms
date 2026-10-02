const db = require('../config/db');

exports.findAll = async () => (await db.query('SELECT * FROM doctors ORDER BY doctor_id')).rows;
exports.findById = async (id) => (await db.query('SELECT * FROM doctors WHERE doctor_id=$1', [id])).rows[0];
exports.create = async (d) =>
  (await db.query(
    'INSERT INTO doctors (doctor_id, name, specialization, phone, email) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [d.doctor_id, d.name, d.specialization, d.phone, d.email]
  )).rows[0];
exports.update = async (id, d) =>
  (await db.query(
    'UPDATE doctors SET name=$2, specialization=$3, phone=$4, email=$5 WHERE doctor_id=$1 RETURNING *',
    [id, d.name, d.specialization, d.phone, d.email]
  )).rows[0];
exports.remove = async (id) => (await db.query('DELETE FROM doctors WHERE doctor_id=$1', [id])).rowCount > 0;
exports.count = async () => (await db.query('SELECT COUNT(*)::int AS n FROM doctors')).rows[0].n;
