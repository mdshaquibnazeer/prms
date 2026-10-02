const prescriptionModel = require('../models/prescriptionModel');
const doctorModel = require('../models/doctorModel');
const patientService = require('./patientService');
const AppError = require('../utils/AppError');

async function listForPatient(patientId) {
  const id = String(patientId).toUpperCase();
  if (!(await patientService.exists(id))) throw new AppError(404, 'Patient not found.');
  return prescriptionModel.findByPatient(id);
}

const listAll = () => prescriptionModel.findAll();

async function add(patientId, data) {
  const id = String(patientId).toUpperCase();
  if (!(await patientService.exists(id))) throw new AppError(404, 'Patient not found.');
  if (!(await doctorModel.findById(data.doctor_id))) throw new AppError(404, 'Doctor not found.', { doctor_id: 'No doctor with this ID.' });
  const newId = await prescriptionModel.create(id, data);
  return prescriptionModel.findById(newId);
}

async function remove(prescriptionId) {
  if (!(await prescriptionModel.remove(prescriptionId))) throw new AppError(404, 'Prescription not found.');
}

module.exports = { listForPatient, listAll, add, remove };
