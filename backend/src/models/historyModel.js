const db = require('../config/db');

const BASE = `
  SELECT h.history_id, h.patient_id, h.doctor_id, d.name AS doctor_name,
         h.visit_date, h.diagnosis, h.treatment, h.notes, h.created_at,
         COALESCE(hosp.name, 'Hospital Network Care') AS hospital_name
  FROM medical_history h
  JOIN doctors d ON d.doctor_id = h.doctor_id
  LEFT JOIN hospitals hosp ON hosp.hospital_id = d.hospital_id`;

exports.findByPatient = async (patientId) => (await db.query(`${BASE} WHERE h.patient_id=$1`, [patientId])).rows;
exports.findById = async (id) => (await db.query(`${BASE} WHERE h.history_id=$1`, [id])).rows[0];
exports.create = async (patientId, h) =>
  (await db.query(
    `INSERT INTO medical_history (patient_id, doctor_id, visit_date, diagnosis, treatment, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING history_id`,
    [patientId, h.doctor_id, h.visit_date, h.diagnosis, h.treatment, h.notes]
  )).rows[0].history_id;
exports.remove = async (id) => (await db.query('DELETE FROM medical_history WHERE history_id=$1', [id])).rowCount > 0;
