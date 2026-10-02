const db = require('../config/db');

exports.findAll = async () =>
  (await db.query(`
    SELECT d.*, h.name AS hospital_name, h.city AS hospital_city
    FROM doctors d
    LEFT JOIN hospitals h ON h.hospital_id = d.hospital_id
    ORDER BY d.doctor_id
  `)).rows;

exports.findById = async (id) =>
  (await db.query(`
    SELECT d.*, h.name AS hospital_name, h.city AS hospital_city
    FROM doctors d
    LEFT JOIN hospitals h ON h.hospital_id = d.hospital_id
    WHERE d.doctor_id = $1
  `, [id])).rows[0];

exports.findByHospital = async (hospital_id) =>
  (await db.query('SELECT * FROM doctors WHERE hospital_id = $1 ORDER BY doctor_id', [hospital_id])).rows;

exports.countByHospital = async (hospital_id) =>
  (await db.query('SELECT COUNT(*)::int AS n FROM doctors WHERE hospital_id = $1', [hospital_id])).rows[0].n;

exports.create = async (d) =>
  (await db.query(
    `INSERT INTO doctors (doctor_id, hospital_id, name, specialization, phone, email, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [d.doctor_id, d.hospital_id || null, d.name, d.specialization, d.phone, d.email, d.status || 'approved']
  )).rows[0];

exports.update = async (id, d) =>
  (await db.query(
    `UPDATE doctors SET hospital_id=$2, name=$3, specialization=$4, phone=$5, email=$6, status=$7
     WHERE doctor_id=$1 RETURNING *`,
    [id, d.hospital_id, d.name, d.specialization, d.phone, d.email, d.status || 'approved']
  )).rows[0];

exports.updateStatus = async (id, status) =>
  (await db.query('UPDATE doctors SET status=$2 WHERE doctor_id=$1 RETURNING *', [id, status])).rows[0];

exports.remove = async (id) =>
  (await db.query('DELETE FROM doctors WHERE doctor_id=$1', [id])).rowCount > 0;

exports.count = async () =>
  (await db.query('SELECT COUNT(*)::int AS n FROM doctors')).rows[0].n;

exports.nextId = async () => {
  const r = await db.query("SELECT MAX(SUBSTRING(doctor_id, 2)::int) AS m FROM doctors WHERE doctor_id ~ '^D[0-9]+$'");
  const next = (r.rows[0].m || 0) + 1;
  return `D${String(next).padStart(3, '0')}`;
};

/** Get statistics for each doctor across hospitals for the Admin Dashboard */
exports.getDoctorStats = async () => {
  const query = `
    SELECT
      d.doctor_id,
      d.name AS doctor_name,
      d.specialization,
      d.email,
      d.phone,
      d.status,
      h.hospital_id,
      COALESCE(h.name, 'Independent / Unassigned') AS hospital_name,
      COALESCE(h.city, '-') AS hospital_city,
      COUNT(DISTINCT a.appointment_id)::int AS total_appointments,
      COUNT(DISTINCT a.patient_id)::int AS total_patients_treated,
      COUNT(DISTINCT CASE WHEN a.status = 'Completed' THEN a.appointment_id END)::int AS completed_appointments,
      COUNT(DISTINCT mh.history_id)::int AS medical_records_logged
    FROM doctors d
    LEFT JOIN hospitals h ON h.hospital_id = d.hospital_id
    LEFT JOIN appointments a ON a.doctor_id = d.doctor_id
    LEFT JOIN medical_history mh ON mh.doctor_id = d.doctor_id
    GROUP BY d.doctor_id, d.name, d.specialization, d.email, d.phone, d.status, h.hospital_id, h.name, h.city
    ORDER BY d.doctor_id
  `;
  return (await db.query(query)).rows;
};
