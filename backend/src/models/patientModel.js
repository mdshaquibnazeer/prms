const db = require('../config/db');

// Patient columns plus two values derived from appointments (used for sorting by Appointment Date / Priority).
const ENRICHED_SELECT = `
  SELECT p.*,
    (SELECT MIN(a.appointment_date) FROM appointments a
       WHERE a.patient_id = p.patient_id AND a.status IN ('Pending','Confirmed')
         AND a.appointment_date >= CURRENT_DATE) AS next_appointment_date,
    LEAST(
      (SELECT MIN(a.priority) FROM appointments a
         WHERE a.patient_id = p.patient_id AND a.status IN ('Pending','Confirmed')),
      (SELECT MIN(e.priority) FROM emergency_queue e
         WHERE e.patient_id = p.patient_id AND e.status = 'Waiting')
    ) AS top_priority
  FROM patients p`;

exports.findAllEnriched = async () => (await db.query(`${ENRICHED_SELECT} ORDER BY p.created_at, p.patient_id`)).rows;
exports.findEnrichedById = async (id) => (await db.query(`${ENRICHED_SELECT} WHERE p.patient_id = $1`, [id])).rows[0];
exports.exists = async (id) => (await db.query('SELECT 1 FROM patients WHERE patient_id = $1', [id])).rowCount > 0;

exports.create = async (p) =>
  (await db.query(
    `INSERT INTO patients (patient_id, name, age, gender, phone, email, address, blood_group)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [p.patient_id, p.name, p.age, p.gender, p.phone, p.email, p.address, p.blood_group]
  )).rows[0];

exports.update = async (id, p) =>
  (await db.query(
    `UPDATE patients SET name=$2, age=$3, gender=$4, phone=$5, email=$6, address=$7, blood_group=$8, updated_at=NOW()
     WHERE patient_id=$1 RETURNING *`,
    [id, p.name, p.age, p.gender, p.phone, p.email, p.address, p.blood_group]
  )).rows[0];

exports.remove = async (id) => (await db.query('DELETE FROM patients WHERE patient_id=$1', [id])).rowCount > 0;

exports.lastIds = async () => (await db.query('SELECT patient_id FROM patients')).rows.map((r) => r.patient_id);
exports.recent = async (limit = 5) =>
  (await db.query('SELECT patient_id, name, age, gender, blood_group, created_at FROM patients ORDER BY created_at DESC, patient_id DESC LIMIT $1', [limit])).rows;
exports.count = async () => (await db.query('SELECT COUNT(*)::int AS n FROM patients')).rows[0].n;
