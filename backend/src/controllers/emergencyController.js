const asyncHandler = require('../utils/asyncHandler');
const emergencyService = require('../services/emergencyService');

exports.queue = asyncHandler(async (req, res) => res.json({ success: true, data: await emergencyService.getQueue() }));

exports.add = asyncHandler(async (req, res) => {
  const r = await emergencyService.add(req.body);
  res.status(201).json({ success: true, message: 'Patient added to the emergency queue.', data: r });
});

exports.processNext = asyncHandler(async (req, res) => {
  const r = await emergencyService.processNext();
  res.json({ success: true, message: r.message, data: r });
});
