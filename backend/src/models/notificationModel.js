const db = require('../config/db');

exports.create = async ({ patient_id, hospital_id = null, sender_name, title, message }) =>
  (await db.query(
    `INSERT INTO patient_notifications (patient_id, hospital_id, sender_name, title, message)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [patient_id, hospital_id, sender_name, title, message]
  )).rows[0];

exports.findByPatient = async (patient_id) =>
  (await db.query(
    `SELECT n.*, h.name AS hospital_name, h.city AS hospital_city
     FROM patient_notifications n
     LEFT JOIN hospitals h ON h.hospital_id = n.hospital_id
     WHERE n.patient_id = $1
     ORDER BY n.created_at DESC`,
    [patient_id]
  )).rows;

exports.markRead = async (notification_id) =>
  (await db.query('UPDATE patient_notifications SET is_read = true WHERE notification_id = $1 RETURNING *', [notification_id])).rows[0];
