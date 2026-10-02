const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const auth = require('../controllers/authController');
const patients = require('../controllers/patientController');
const doctors = require('../controllers/doctorController');
const hospitals = require('../controllers/hospitalController');
const admin = require('../controllers/adminController');
const appts = require('../controllers/appointmentController');
const emergency = require('../controllers/emergencyController');
const records = require('../controllers/recordController');
const misc = require('../controllers/miscController');

const ALL = ['admin', 'hospital', 'doctor', 'patient', 'receptionist'];
const STAFF = ['admin', 'hospital', 'doctor', 'receptionist'];
const CLINICAL = ['admin', 'hospital', 'doctor'];

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait a few minutes and try again.' },
});

// ---- Public endpoints ----
router.post('/auth/login', loginLimiter, auth.login);
router.post('/auth/register-hospital', auth.registerHospital);
router.post('/auth/register-doctor', auth.registerDoctor);
router.post('/auth/register-patient', auth.registerPatient);
router.get('/hospitals/public', hospitals.listPublic);

// ---- Authenticated User Info ----
router.get('/auth/me', authenticate, auth.me);
router.post('/auth/change-password', authenticate, auth.changePassword);

// Everything below requires a valid JWT.
router.use(authenticate);

// ---- Admin Specific Endpoints ----
router.get('/admin/doctor-stats', authorize('admin'), admin.getDoctorStats);
router.get('/admin/approvals', authorize('admin'), admin.getPendingApprovals);
router.put('/admin/approvals/:type/:id', authorize('admin'), admin.setApprovalStatus);
router.get('/users', authorize('admin'), auth.listUsers);
router.post('/users', authorize('admin'), auth.createUser);
router.put('/hospitals/:id/status', authorize('admin'), hospitals.updateStatus);

// ---- Hospital Management ----
router.get('/hospitals', authorize('admin', 'hospital'), hospitals.list);
router.get('/hospitals/:id', authorize('admin', 'hospital'), hospitals.get);
router.get('/hospitals/:id/doctors', authorize(...ALL), hospitals.listDoctors);
router.post('/hospitals/:id/doctors', authorize('admin', 'hospital'), hospitals.createDoctor);

// ---- Dashboard & reports ----
router.get('/dashboard', authorize(...ALL), misc.dashboard);
router.get('/reports', authorize('admin', 'hospital'), misc.reports);

// ---- Patients ----
router.get('/patients', authorize(...ALL), patients.list);
router.get('/patients/next-id', authorize(...STAFF), patients.nextId);
router.get('/patients/:id', authorize(...ALL), patients.get);
router.post('/patients', authorize(...STAFF), patients.create);
router.put('/patients/:id', authorize(...STAFF), patients.update);
router.put('/patients/:id/transfer', authorize(...ALL), patients.transferHospital);
router.delete('/patients/:id', authorize('admin', 'hospital'), patients.remove);

// ---- Medical history ----
router.get('/patients/:id/history', authorize(...ALL), records.getHistory);
router.post('/patients/:id/history', authorize(...CLINICAL), records.addHistory);
router.delete('/history/:id', authorize(...CLINICAL), records.deleteHistory);

// ---- Prescriptions ----
router.get('/prescriptions', authorize(...ALL), records.listAllPrescriptions);
router.get('/patients/:id/prescriptions', authorize(...ALL), records.getPrescriptions);
router.post('/patients/:id/prescriptions', authorize(...CLINICAL), records.addPrescription);
router.delete('/prescriptions/:id', authorize(...CLINICAL), records.deletePrescription);

// ---- Doctors ----
router.get('/doctors', authorize(...ALL), doctors.list);
router.get('/doctors/:id', authorize(...ALL), doctors.get);
router.post('/doctors', authorize('admin', 'hospital'), doctors.create);
router.put('/doctors/:id', authorize('admin', 'hospital'), doctors.update);
router.delete('/doctors/:id', authorize('admin', 'hospital'), doctors.remove);

// ---- Appointments (FIFO queue for normal ones) ----
router.get('/appointments', authorize(...ALL), appts.list);
router.get('/appointments/queue', authorize(...ALL), appts.queue);
router.post('/appointments/queue/next', authorize(...STAFF), appts.serveNext);
router.post('/appointments', authorize(...ALL), appts.create);
router.put('/appointments/:id', authorize(...STAFF), appts.update);
router.delete('/appointments/:id', authorize('admin', 'hospital', 'receptionist'), appts.remove);

// ---- Emergency priority queue ----
router.get('/emergency', authorize(...ALL), emergency.queue);
router.post('/emergency', authorize(...ALL), emergency.add);
router.post('/emergency/process-next', authorize(...STAFF), emergency.processNext);

// ---- DSA demonstration ----
const d = misc.dsa;
router.get('/dsa/info', authorize(...ALL), d.info);
router.get('/dsa/state', authorize(...ALL), d.state);
router.post('/dsa/reset', authorize(...ALL), d.reset);
router.post('/dsa/hashmap/load-patients', authorize(...ALL), d.hashLoad);
router.post('/dsa/hashmap/set', authorize(...ALL), d.hashSet);
router.post('/dsa/hashmap/collisions', authorize(...ALL), d.hashCollide);
router.get('/dsa/hashmap/get/:key', authorize(...ALL), d.hashGet);
router.delete('/dsa/hashmap/:key', authorize(...ALL), d.hashDelete);
router.post('/dsa/queue/enqueue', authorize(...ALL), d.queueEnqueue);
router.post('/dsa/queue/dequeue', authorize(...ALL), d.queueDequeue);
router.get('/dsa/queue/peek', authorize(...ALL), d.queuePeek);
router.post('/dsa/priority-queue/insert', authorize(...ALL), d.pqInsert);
router.get('/dsa/priority-queue/peek', authorize(...ALL), d.pqPeek);
router.post('/dsa/priority-queue/extract', authorize(...ALL), d.pqExtract);
router.post('/dsa/priority-queue/load-emergency', authorize(...ALL), d.pqLoad);
router.post('/dsa/heap/insert', authorize(...ALL), d.heapInsert);
router.post('/dsa/heap/extract', authorize(...ALL), d.heapExtract);
router.get('/dsa/heap/peek', authorize(...ALL), d.heapPeek);
router.post('/dsa/heap/heapify', authorize(...ALL), d.heapHeapify);
router.post('/dsa/linked-list/add', authorize(...ALL), d.listAdd);
router.post('/dsa/linked-list/delete', authorize(...ALL), d.listDelete);
router.post('/dsa/linked-list/search', authorize(...ALL), d.listSearch);
router.post('/dsa/linked-list/display', authorize(...ALL), d.listDisplay);
router.post('/dsa/linked-list/load-patient', authorize(...ALL), d.listLoad);
router.post('/dsa/search', authorize(...ALL), d.search);
router.post('/dsa/sort', authorize(...ALL), d.sort);

module.exports = router;
