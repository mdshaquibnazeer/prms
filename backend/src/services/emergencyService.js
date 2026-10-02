/**
 * emergencyService.js - the emergency queue.
 *
 * PostgreSQL stores the waiting patients (emergency_queue table).
 * On every request the waiting rows are loaded into a PriorityQueue (binary min-heap),
 * so the most urgent patient (lowest priority number, then earliest arrival) comes out first.
 * "Process next" removes the heap root AND marks that row Processed in the database.
 */
const { pool } = require('../config/db');
const emergencyModel = require('../models/emergencyModel');
const appointmentModel = require('../models/appointmentModel');
const patientService = require('./patientService');
const AppError = require('../utils/AppError');
const { PriorityQueue } = require('../dsa');

const PRIORITY_LABEL = { 1: 'Critical', 2: 'Emergency', 3: 'Normal' };

const decorate = (row, rank) => ({
  ...row,
  rank,
  priority_label: PRIORITY_LABEL[row.priority],
  waiting_minutes: Math.max(0, Math.floor((Date.now() - new Date(row.arrived_at).getTime()) / 60000)),
});

/** Build the priority queue from the waiting rows. O(n) using heapify. */
function buildQueue(rows) {
  return PriorityQueue.fromArray(rows, (r) => r.priority);
}

async function getQueue() {
  const rows = await emergencyModel.findWaiting();
  const pq = buildQueue(rows);
  const ordered = pq.toSortedArray().map((e, i) => decorate(e.item, i + 1));
  const recent = (await emergencyModel.findRecentProcessed(5)).map((r) => decorate(r, null));
  return {
    items: ordered,
    size: pq.size(),
    next: ordered[0] || null,
    recentlyProcessed: recent,
    structure: { type: 'Priority Queue backed by a Binary Min-Heap', heapArray: pq.toHeapArray().map((e) => ({ name: e.item.patient_name, priority: e.priority })) },
  };
}

async function add({ patient_id, priority, reason }) {
  const id = String(patient_id || '').toUpperCase();
  const p = Number(priority);
  if (!id) throw new AppError(400, 'Choose a patient.', { patient_id: 'Patient is required.' });
  if (![1, 2, 3].includes(p)) throw new AppError(400, 'Priority must be 1 (Critical), 2 (Emergency) or 3 (Normal).', { priority: 'Invalid priority.' });
  if (!(await patientService.exists(id))) throw new AppError(404, 'Patient not found.', { patient_id: 'No patient with this ID.' });
  if (await emergencyModel.isWaiting(id)) throw new AppError(409, 'This patient is already waiting in the queue.');
  const queueId = await emergencyModel.create({ patient_id: id, priority: p, reason: String(reason || '').trim().slice(0, 200) });
  await patientService.refreshIndex();
  return { queue_id: queueId };
}

/** Remove the highest-priority patient from the queue (extractMin) and mark them processed. */
async function processNext() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Lock the waiting rows so two receptionists cannot process the same patient.
    await client.query("SELECT queue_id FROM emergency_queue WHERE status='Waiting' FOR UPDATE");
    const rows = await emergencyModel.findWaiting(client);
    if (rows.length === 0) throw new AppError(404, 'No emergency patients waiting.');
    const pq = buildQueue(rows);
    const top = pq.dequeue(); // extractMin on the heap: O(log n)
    await emergencyModel.markProcessed(top.item.queue_id, client);
    if (top.item.appointment_id) await appointmentModel.setStatus(top.item.appointment_id, 'Completed', client);
    await client.query('COMMIT');
    await patientService.refreshIndex();
    return {
      processed: decorate(top.item, 1),
      remaining: pq.size(),
      message: `Patient ${top.item.patient_name} is now being processed.`,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getQueue, add, processNext, PRIORITY_LABEL };
