const db = require('../config/db');

const BASE = `
  SELECT r.prescription_id, r.patient_id, p.name AS patient_name, r.doctor_id, d.name AS doctor_name,
         r.medicine, r.dosage, r.duration, r.instructions, r.created_at
  FROM prescriptions r
  JOIN patients p ON p.patient_id = r.patient_id
  JOIN doctors  d ON d.doctor_id  = r.doctor_id`;

exports.findByPatient = async (patientId) => (await db.query(`${BASE} WHERE r.patient_id=$1 ORDER BY r.created_at DESC, r.prescription_id DESC`, [patientId])).rows;
exports.findAll = async () => (await db.query(`${BASE} ORDER BY r.created_at DESC, r.prescription_id DESC`)).rows;
exports.findById = async (id) => (await db.query(`${BASE} WHERE r.prescription_id=$1`, [id])).rows[0];
exports.create = async (patientId, r) =>
  (await db.query(
    `INSERT INTO prescriptions (patient_id, doctor_id, medicine, dosage, duration, instructions)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING prescription_id`,
    [patientId, r.doctor_id, r.medicine, r.dosage, r.duration, r.instructions]
  )).rows[0].prescription_id;
exports.remove = async (id) => (await db.query('DELETE FROM prescriptions WHERE prescription_id=$1', [id])).rowCount > 0;
