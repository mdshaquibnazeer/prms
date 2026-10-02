/**
 * appointmentService.js
 *  - CRUD for appointments with validation
 *  - Normal appointment flow uses the custom FIFO Queue (dsa/Queue.js)
 *  - Critical / Emergency appointments booked for today are also placed on the emergency queue
 */
const { pool } = require('../config/db');
const appointmentModel = require('../models/appointmentModel');
const doctorModel = require('../models/doctorModel');
const emergencyModel = require('../models/emergencyModel');
const patientService = require('./patientService');
const AppError = require('../utils/AppError');
const { todayStr } = require('../utils/dates');
const { Queue } = require('../dsa');

async function checkReferences(a, ignoreId = null) {
  if (!(await patientService.exists(a.patient_id))) throw new AppError(404, 'Patient not found.', { patient_id: 'No patient with this ID.' });
  if (!(await doctorModel.findById(a.doctor_id))) throw new AppError(404, 'Doctor not found.', { doctor_id: 'No doctor with this ID.' });
  if (a.priority === 3 && a.status !== 'Cancelled' && (await appointmentModel.doctorBusy(a.doctor_id, a.appointment_date, a.appointment_time, ignoreId))) {
    throw new AppError(409, 'This doctor already has a normal appointment at that date and time.', { appointment_time: 'Pick a different time.' });
  }
}

async function list(filters) {
  return appointmentModel.findAll({ ...filters, today: todayStr() });
}

async function create(a) {
  if (a.appointment_date < todayStr()) throw new AppError(400, 'Appointment date cannot be in the past.', { appointment_date: 'Choose today or a later date.' });
  await checkReferences(a);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = await appointmentModel.create(a, client);
    // Critical/Emergency appointments for today go straight to the priority queue.
    if (a.priority < 3 && a.appointment_date === todayStr() && !(await emergencyModel.isWaiting(a.patient_id))) {
      await emergencyModel.create({ patient_id: a.patient_id, appointment_id: id, priority: a.priority, reason: 'Booked as an urgent appointment' }, client);
    }
    await client.query('COMMIT');
    await patientService.refreshIndex();
    return appointmentModel.findById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function update(id, a) {
  const existing = await appointmentModel.findById(id);
  if (!existing) throw new AppError(404, 'Appointment not found.');
  const dateChanged = a.appointment_date !== existing.appointment_date;
  if (dateChanged && a.appointment_date < todayStr()) throw new AppError(400, 'Appointment date cannot be in the past.', { appointment_date: 'Choose today or a later date.' });
  await checkReferences(a, Number(id));
  await appointmentModel.update(id, a);
  await patientService.refreshIndex();
  return appointmentModel.findById(id);
}

async function remove(id) {
  if (!(await appointmentModel.remove(id))) throw new AppError(404, 'Appointment not found.');
  await patientService.refreshIndex();
}

/** Build the FIFO queue of today's normal appointments (first booked = first served). */
async function loadNormalQueue() {
  const rows = await appointmentModel.normalQueueRows(todayStr());
  const queue = new Queue();
  rows.forEach((r) => queue.enqueue(r)); // enqueue in booking order
  return queue;
}

async function getNormalQueue() {
  const queue = await loadNormalQueue();
  const items = queue.toArray().map((r, i) => ({ ...r, position: i + 1 }));
  return { items, size: queue.size(), front: queue.peek() || null, principle: 'FIFO', complexity: { enqueue: 'O(1)', dequeue: 'O(1)', peek: 'O(1)' } };
}

/** Dequeue the front appointment and mark it Completed. */
async function serveNext() {
  const queue = await loadNormalQueue();
  if (queue.isEmpty()) throw new AppError(404, 'No normal appointments are waiting today.');
  const served = queue.dequeue();
  await appointmentModel.setStatus(served.appointment_id, 'Completed');
  await patientService.refreshIndex();
  return { served, remaining: queue.size() };
}

module.exports = { list, create, update, remove, getNormalQueue, serveNext };
