const patientModel = require('../models/patientModel');
const doctorModel = require('../models/doctorModel');
const appointmentModel = require('../models/appointmentModel');
const emergencyModel = require('../models/emergencyModel');
const emergencyService = require('./emergencyService');
const { todayStr } = require('../utils/dates');

async function getDashboard() {
  const [totalPatients, todaysAppointments, emergencyCases, totalDoctors, recentAppointments, recentPatients, queue] = await Promise.all([
    patientModel.count(),
    appointmentModel.countOn(todayStr()),
    emergencyModel.countWaitingEmergencies(),
    doctorModel.count(),
    appointmentModel.recent(5),
    patientModel.recent(5),
    emergencyService.getQueue(),
  ]);
  return {
    stats: { totalPatients, todaysAppointments, emergencyCases, totalDoctors },
    recentAppointments,
    recentPatients,
    emergencyPreview: queue.items.slice(0, 4),
    emergencyWaiting: queue.size,
  };
}

module.exports = { getDashboard };
