const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboardService');
const reportService = require('../services/reportService');
const dsaInfo = require('../services/dsaInfo');
const demo = require('../services/dsaDemoService');
const patientService = require('../services/patientService');

exports.dashboard = asyncHandler(async (req, res) => res.json({ success: true, data: await dashboardService.getDashboard() }));
exports.reports = asyncHandler(async (req, res) => res.json({ success: true, data: await reportService.getReports(req.query) }));

// ---- DSA demonstration ----
const uid = (req) => req.user.id;
const wrap = (fn) => asyncHandler(async (req, res) => res.json({ success: true, ...(await fn(req)) }));

exports.dsa = {
  info: asyncHandler(async (req, res) => res.json({ success: true, data: { ...dsaInfo, patientIndex: patientService.getIndexStats() } })),
  state: wrap((req) => ({ state: demo.getState(uid(req)) })),
  reset: wrap((req) => ({ state: demo.reset(uid(req), req.body.which) })),

  hashLoad: wrap((req) => demo.hashMapLoadPatients(uid(req))),
  hashSet: wrap((req) => demo.hashMapSet(uid(req), req.body.key, req.body.value)),
  hashGet: wrap((req) => demo.hashMapGet(uid(req), req.params.key)),
  hashDelete: wrap((req) => demo.hashMapDelete(uid(req), req.params.key)),
  hashCollide: wrap((req) => demo.hashMapCollisions(uid(req), req.body.key)),

  queueEnqueue: wrap((req) => demo.queueEnqueue(uid(req), req.body.name)),
  queueDequeue: wrap((req) => demo.queueDequeue(uid(req))),
  queuePeek: wrap((req) => demo.queuePeek(uid(req))),

  pqInsert: wrap((req) => demo.pqInsert(uid(req), req.body.name, req.body.priority)),
  pqPeek: wrap((req) => demo.pqPeek(uid(req))),
  pqExtract: wrap((req) => demo.pqExtract(uid(req))),
  pqLoad: wrap((req) => demo.pqLoadEmergency(uid(req))),

  heapInsert: wrap((req) => demo.heapInsert(uid(req), req.body.value)),
  heapExtract: wrap((req) => demo.heapExtract(uid(req))),
  heapPeek: wrap((req) => demo.heapPeek(uid(req))),
  heapHeapify: wrap((req) => demo.heapHeapify(uid(req), req.body.values)),

  listAdd: wrap((req) => demo.listAdd(uid(req), req.body)),
  listDelete: wrap((req) => demo.listDelete(uid(req), req.body.diagnosis)),
  listSearch: wrap((req) => demo.listSearch(uid(req), req.body.diagnosis)),
  listDisplay: wrap((req) => demo.listDisplay(uid(req))),
  listLoad: wrap((req) => demo.listLoadPatient(uid(req), req.body.patient_id)),

  search: asyncHandler(async (req, res) => res.json({ success: true, data: await demo.runSearch(req.body) })),
  sort: asyncHandler(async (req, res) => res.json({ success: true, data: await demo.runSort(req.body) })),
};
