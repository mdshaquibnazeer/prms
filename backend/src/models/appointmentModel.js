const db = require('../config/db');

const BASE = `
  SELECT a.appointment_id, a.patient_id, p.name AS patient_name, a.doctor_id, d.name AS doctor_name,
         a.appointment_date, to_char(a.appointment_time, 'HH24:MI') AS appointment_time,
         a.priority, a.status, a.created_at
  FROM appointments a
  JOIN patients p ON p.patient_id = a.patient_id
  JOIN doctors  d ON d.doctor_id  = a.doctor_id`;

/** filters: { scope: 'today'|'upcoming'|'all', status, patient_id, doctor_id, today } */
exports.findAll = async ({ scope = 'all', status, patient_id, doctor_id, today }) => {
  const where = [];
  const params = [];
  if (scope === 'today') { params.push(today); where.push(`a.appointment_date = $${params.length}`); }
  if (scope === 'upcoming') { params.push(today); where.push(`a.appointment_date > $${params.length}`); }
  if (status) { params.push(status); where.push(`a.status = $${params.length}`); }
  if (patient_id) { params.push(patient_id); where.push(`a.patient_id = $${params.length}`); }
  if (doctor_id) { params.push(doctor_id); where.push(`a.doctor_id = $${params.length}`); }
  const sql = `${BASE} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY a.appointment_date, a.appointment_time, a.appointment_id`;
  return (await db.query(sql, params)).rows;
};

exports.findById = async (id) => (await db.query(`${BASE} WHERE a.appointment_id = $1`, [id])).rows[0];

exports.create = async (a, client = db) => {
  const r = await client.query(
    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, priority, status)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING appointment_id`,
    [a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time, a.priority, a.status]
  );
  return r.rows[0].appointment_id;
};

exports.update = async (id, a) =>
  (await db.query(
    `UPDATE appointments SET patient_id=$2, doctor_id=$3, appointment_date=$4, appointment_time=$5, priority=$6, status=$7
     WHERE appointment_id=$1 RETURNING appointment_id`,
    [id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time, a.priority, a.status]
  )).rows[0];

exports.remove = async (id) => (await db.query('DELETE FROM appointments WHERE appointment_id=$1', [id])).rowCount > 0;

exports.setStatus = async (id, status, client = db) =>
  client.query('UPDATE appointments SET status=$2 WHERE appointment_id=$1', [id, status]);

/** Is the doctor already booked at this date/time (ignoring cancelled and the appointment being edited)? */
exports.doctorBusy = async (doctor_id, date, time, ignoreId = null) =>
  (await db.query(
    `SELECT 1 FROM appointments
     WHERE doctor_id=$1 AND appointment_date=$2 AND appointment_time=$3::time
       AND status <> 'Cancelled' AND priority = 3 AND appointment_id <> COALESCE($4, -1)`,
    [doctor_id, date, time, ignoreId]
  )).rowCount > 0;

/** Today's normal (priority 3) open appointments in order of booking = the FIFO queue input. */
exports.normalQueueRows = async (today) =>
  (await db.query(
    `${BASE} WHERE a.priority = 3 AND a.status IN ('Pending','Confirmed') AND a.appointment_date = $1
     ORDER BY a.created_at, a.appointment_id`, [today]
  )).rows;

exports.countOn = async (date) => (await db.query('SELECT COUNT(*)::int AS n FROM appointments WHERE appointment_date=$1', [date])).rows[0].n;
exports.recent = async (limit = 5) => (await db.query(`${BASE} ORDER BY a.created_at DESC, a.appointment_id DESC LIMIT $1`, [limit])).rows;
