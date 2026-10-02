/**
 * historyService.js - a patient's medical history as a LINKED LIST.
 * Rows are fetched from PostgreSQL, merge-sorted by visit date and appended
 * node by node into a LinkedList (each node = one visit, with a `next` pointer).
 */
const historyModel = require('../models/historyModel');
const doctorModel = require('../models/doctorModel');
const patientService = require('./patientService');
const AppError = require('../utils/AppError');
const { LinkedList, mergeSort } = require('../dsa');

async function getForPatient(patientId) {
  const id = String(patientId).toUpperCase();
  if (!(await patientService.exists(id))) throw new AppError(404, 'Patient not found.');
  const rows = await historyModel.findByPatient(id);
  const sorted = mergeSort(rows, (a, b) => (a.visit_date < b.visit_date ? -1 : a.visit_date > b.visit_date ? 1 : a.history_id - b.history_id));
  const list = new LinkedList();
  sorted.forEach((r) => list.append(r)); // O(1) per append thanks to the tail pointer
  const described = list.describe((d) => d.diagnosis);
  return {
    size: described.size,
    headHistoryId: list.head ? list.head.data.history_id : null,
    visits: described.nodes.map((n) => ({
      ...n.data,
      position: n.position,
      isHead: n.isHead,
      isTail: n.isTail,
      nextHistoryId: n.nextPosition ? described.nodes[n.nextPosition - 1].data.history_id : null,
    })),
  };
}

async function add(patientId, data) {
  const id = String(patientId).toUpperCase();
  if (!(await patientService.exists(id))) throw new AppError(404, 'Patient not found.');
  if (!(await doctorModel.findById(data.doctor_id))) throw new AppError(404, 'Doctor not found.', { doctor_id: 'No doctor with this ID.' });
  const newId = await historyModel.create(id, data);
  return historyModel.findById(newId);
}

async function remove(historyId) {
  if (!(await historyModel.remove(historyId))) throw new AppError(404, 'Medical history record not found.');
}

module.exports = { getForPatient, add, remove };
