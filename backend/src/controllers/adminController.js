const asyncHandler = require('../utils/asyncHandler');
const doctorModel = require('../models/doctorModel');
const hospitalModel = require('../models/hospitalModel');
const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');

exports.getDoctorStats = asyncHandler(async (req, res) => {
  const stats = await doctorModel.getDoctorStats();
  res.json({ success: true, data: stats });
});

exports.getPendingApprovals = asyncHandler(async (req, res) => {
  const pendingHospitals = await hospitalModel.findAll('pending');
  res.json({
    success: true,
    data: {
      hospitals: pendingHospitals,
    },
  });
});

exports.setApprovalStatus = asyncHandler(async (req, res) => {
  const { type, id } = req.params; // type: 'hospital' or 'doctor'
  const { status } = req.body; // 'approved' or 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    throw new AppError(400, 'Status must be approved or rejected.');
  }

  if (type === 'hospital') {
    const updated = await hospitalModel.updateStatus(id, status);
    if (!updated) throw new AppError(404, 'Hospital not found.');
    // Also update any hospital user
    const hospital = await hospitalModel.findById(id);
    if (hospital) {
      const u = await userModel.findByEmail(hospital.email);
      if (u) await userModel.updateStatus(u.user_id, status);
    }
    return res.json({ success: true, message: `Hospital ${id} status updated to ${status}.`, data: updated });
  }

  if (type === 'doctor') {
    const updated = await doctorModel.updateStatus(id, status);
    if (!updated) throw new AppError(404, 'Doctor not found.');
    return res.json({ success: true, message: `Doctor ${id} status updated to ${status}.`, data: updated });
  }

  throw new AppError(400, 'Invalid approval type. Expected "hospital" or "doctor".');
});
