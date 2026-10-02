const db = require('../config/db');
const AppError = require('../utils/AppError');
const { isValidDate } = require('../utils/dates');

const AGE_GROUPS = [
  { label: '0-17', min: 0, max: 17 },
  { label: '18-30', min: 18, max: 30 },
  { label: '31-45', min: 31, max: 45 },
  { label: '46-60', min: 46, max: 60 },
  { label: '61+', min: 61, max: 200 },
];

/** filters: { from, to, doctor_id } apply to appointment-based numbers. */
async function getReports({ from, to, doctor_id } = {}) {
  if (from && !isValidDate(from)) throw new AppError(400, 'Invalid "from" date.');
  if (to && !isValidDate(to)) throw new AppError(400, 'Invalid "to" date.');
  if (from && to && from > to) throw new AppError(400, '"From" date must not be after "To" date.');

  const where = [];
  const params = [];
  if (from) { params.push(from); where.push(`a.appointment_date >= $${params.length}`); }
  if (to) { params.push(to); where.push(`a.appointment_date <= $${params.length}`); }
  if (doctor_id) { params.push(String(doctor_id).toUpperCase()); where.push(`a.doctor_id = $${params.length}`); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [totalPatients, gender, ages, status, doctorWise, emergencyAppts, queueCases] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS n FROM patients'),
    db.query('SELECT gender AS label, COUNT(*)::int AS value FROM patients GROUP BY gender ORDER BY gender'),
    db.query('SELECT age FROM patients'),
    db.query(`SELECT a.status AS label, COUNT(*)::int AS value FROM appointments a ${w} GROUP BY a.status ORDER BY a.status`, params),
    db.query(
      `SELECT d.doctor_id, d.name AS label, COUNT(a.appointment_id)::int AS value
       FROM doctors d LEFT JOIN appointments a ON a.doctor_id = d.doctor_id
       ${where.length ? 'AND ' + where.join(' AND ') : ''}
       GROUP BY d.doctor_id, d.name ORDER BY d.doctor_id`, params
    ),
    db.query(
      `SELECT CASE a.priority WHEN 1 THEN 'Critical' WHEN 2 THEN 'Emergency' ELSE 'Normal' END AS label, COUNT(*)::int AS value
       FROM appointments a ${w} GROUP BY a.priority ORDER BY a.priority`, params
    ),
    db.query(
      `SELECT CASE priority WHEN 1 THEN 'Critical' WHEN 2 THEN 'Emergency' ELSE 'Normal' END AS label, COUNT(*)::int AS value
       FROM emergency_queue GROUP BY priority ORDER BY priority`
    ),
  ]);

  const patientsByAge = AGE_GROUPS.map((g) => ({
    label: g.label,
    value: ages.rows.filter((r) => r.age >= g.min && r.age <= g.max).length,
  }));

  const appointmentTotal = status.rows.reduce((s, r) => s + r.value, 0);
  // Doctor-wise: when a doctor filter is active only that doctor's row is relevant.
  const doctorRows = doctor_id ? doctorWise.rows.filter((r) => r.doctor_id === String(doctor_id).toUpperCase()) : doctorWise.rows;

  return {
    filters: { from: from || null, to: to || null, doctor_id: doctor_id ? String(doctor_id).toUpperCase() : null },
    totalPatients: totalPatients.rows[0].n,
    totalAppointments: appointmentTotal,
    patientsByAge,
    patientsByGender: gender.rows,
    appointmentsByStatus: status.rows,
    emergencyCases: {
      appointmentsByPriority: emergencyAppts.rows,
      queueEntriesByPriority: queueCases.rows,
    },
    doctorWiseAppointments: doctorRows,
  };
}

module.exports = { getReports };
