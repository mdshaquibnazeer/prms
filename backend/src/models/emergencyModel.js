const db = require('../config/db');

const BASE = `
  SELECT e.queue_id, e.patient_id, p.name AS patient_name, p.age, p.gender, e.appointment_id,
         e.priority, e.reason, e.status, e.arrived_at, e.processed_at
  FROM emergency_queue e JOIN patients p ON p.patient_id = e.patient_id`;

/** Waiting rows in arrival order (the order is the tie-breaker inside the priority queue). */
exports.findWaiting = async (client = db) =>
  (await client.query(`${BASE} WHERE e.status='Waiting' ORDER BY e.arrived_at, e.queue_id`)).rows;
exports.findRecentProcessed = async (limit = 5) =>
  (await db.query(`${BASE} WHERE e.status='Processed' ORDER BY e.processed_at DESC LIMIT $1`, [limit])).rows;
exports.isWaiting = async (patientId) =>
  (await db.query("SELECT 1 FROM emergency_queue WHERE patient_id=$1 AND status='Waiting'", [patientId])).rowCount > 0;
exports.create = async ({ patient_id, appointment_id = null, priority, reason }, client = db) =>
  (await client.query(
    'INSERT INTO emergency_queue (patient_id, appointment_id, priority, reason) VALUES ($1,$2,$3,$4) RETURNING queue_id',
    [patient_id, appointment_id, priority, reason || null]
  )).rows[0].queue_id;
exports.markProcessed = async (id, client = db) =>
  (await client.query(
    "UPDATE emergency_queue SET status='Processed', processed_at=NOW() WHERE queue_id=$1 AND status='Waiting' RETURNING queue_id",
    [id]
  )).rowCount > 0;
exports.countWaitingEmergencies = async () =>
  (await db.query("SELECT COUNT(*)::int AS n FROM emergency_queue WHERE status='Waiting' AND priority IN (1,2)")).rows[0].n;
