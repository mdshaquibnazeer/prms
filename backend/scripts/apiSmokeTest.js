/**
 * End-to-end API smoke test. Start the backend first (npm run dev), then in another terminal:
 *     npm run test:api
 * It uses the demo accounts from seed.sql. It removes the test patient it creates, but it also
 * processes the demo emergency queue and serves one normal appointment, so run
 * `npm run db:setup` afterwards to restore the demo data.
 * Run it on a freshly seeded database (npm run db:setup) for predictable results.
 */
const BASE = process.env.API_URL || 'http://localhost:5000/api';
let passed = 0;
let failed = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = {};
  try { json = await res.json(); } catch (e) { /* no body */ }
  return { status: res.status, ...json };
}

function check(name, condition, extra = '') {
  if (condition) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name} ${extra}`); }
}

(async () => {
  console.log(`Testing ${BASE}\n`);

  console.log('Authentication');
  const health = await call('GET', '/health');
  check('health endpoint reports database connected', health.database === 'connected');
  const bad = await call('POST', '/auth/login', { body: { email: 'admin@hospital.com', password: 'wrong' } });
  check('invalid login -> 401 with friendly message', bad.status === 401 && /Invalid email or password/.test(bad.message));
  const noToken = await call('GET', '/patients');
  check('no token -> 401', noToken.status === 401);
  const admin = await call('POST', '/auth/login', { body: { email: 'admin@hospital.com', password: 'Admin@123' } });
  const doctor = await call('POST', '/auth/login', { body: { email: 'doctor@hospital.com', password: 'Doctor@123' } });
  const recep = await call('POST', '/auth/login', { body: { email: 'reception@hospital.com', password: 'Reception@123' } });
  check('admin / doctor / receptionist can log in', !!(admin.token && doctor.token && recep.token));
  const A = admin.token; const D = doctor.token; const R = recep.token;

  console.log('\nRole-based access (enforced by the backend)');
  check('receptionist cannot read medical history (403)', (await call('GET', '/patients/P1001/history', { token: R })).status === 403);
  check('receptionist cannot read prescriptions (403)', (await call('GET', '/patients/P1001/prescriptions', { token: R })).status === 403);
  check('doctor cannot open reports (403)', (await call('GET', '/reports', { token: D })).status === 403);
  check('receptionist cannot delete a patient (403)', (await call('DELETE', '/patients/P1001', { token: R })).status === 403);
  check('doctor cannot add a doctor (403)', (await call('POST', '/doctors', { token: D, body: { doctor_id: 'D999', name: 'X', specialization: 'Y' } })).status === 403);
  check('admin can open reports', (await call('GET', '/reports', { token: A })).status === 200);

  console.log('\nPatients: CRUD, validation, duplicates');
  const nextId = (await call('GET', '/patients/next-id', { token: A })).patient_id;
  check('next-id suggests P1006', nextId === 'P1006', `(got ${nextId})`);
  const invalid = await call('POST', '/patients', { token: R, body: { patient_id: '', name: '', age: 200, gender: 'x', phone: 'abc' } });
  check('invalid patient -> 400 with field errors', invalid.status === 400 && invalid.errors && invalid.errors.name && invalid.errors.age && invalid.errors.phone);
  const created = await call('POST', '/patients', { token: R, body: { patient_id: 'p1006', name: 'Test Patient', age: 40, gender: 'Female', phone: '9876543210', email: 'test@example.com', blood_group: 'O-' } });
  check('create patient (receptionist) -> 201, ID upper-cased', created.status === 201 && created.data.patient_id === 'P1006');
  const dup = await call('POST', '/patients', { token: R, body: { patient_id: 'P1006', name: 'Dup', age: 20, gender: 'Male', phone: '9876543210' } });
  check('duplicate Patient ID -> 409', dup.status === 409);
  const got = await call('GET', '/patients/P1006', { token: R });
  check('get patient via Hash Map lookup', got.status === 200 && got.meta.lookup.algorithm === 'Hash Map');
  check('patient not found -> 404', (await call('GET', '/patients/P9999', { token: R })).status === 404);
  const upd = await call('PUT', '/patients/P1006', { token: D, body: { name: 'Test Patient Updated', age: 41, gender: 'Female', phone: '9876543210', blood_group: 'O-' } });
  check('update patient', upd.status === 200 && upd.data.name === 'Test Patient Updated' && upd.data.age === 41);

  console.log('\nSearching and sorting on the patient list');
  const hash = await call('GET', '/patients?search=P1002&by=id&algorithm=hash', { token: A });
  check('Hash Map search by ID', hash.data.length === 1 && hash.meta.search.algorithm === 'Hash Map');
  const lin = await call('GET', '/patients?search=ar&by=name&algorithm=linear', { token: A });
  check('Linear search (partial name "ar" -> Sharma, Sara, Arjun)', lin.data.length === 3 && lin.meta.search.comparisons === lin.meta.total);
  const bin = await call('GET', '/patients?search=Sara Ali&by=name&algorithm=binary', { token: A });
  check('Binary search (exact name, sorted first)', bin.data.length === 1 && bin.data[0].patient_id === 'P1003' && bin.meta.search.sortComparisons > 0);
  check('hash search by name is rejected with 400', (await call('GET', '/patients?search=Sara&by=name&algorithm=hash', { token: A })).status === 400);
  const byAge = await call('GET', '/patients?sort=age&order=asc', { token: A });
  const ages = byAge.data.map((p) => p.age);
  check('Merge Sort by age ascending', ages.every((a, i) => i === 0 || ages[i - 1] <= a), JSON.stringify(ages));
  const byName = await call('GET', '/patients?sort=name&order=desc', { token: A });
  const names = byName.data.map((p) => p.name.toLowerCase());
  check('Merge Sort by name descending', names.every((n, i) => i === 0 || names[i - 1] >= n));
  const byPri = await call('GET', '/patients?sort=priority', { token: A });
  check('Merge Sort by priority (most urgent first)', byPri.data[0].patient_id === 'P1001', `(first: ${byPri.data[0].patient_id})`);
  check('Merge Sort by appointment date works', (await call('GET', '/patients?sort=appointment_date', { token: A })).status === 200);

  console.log('\nMedical history (linked list) and prescriptions');
  const hist = await call('GET', '/patients/P1001/history', { token: D });
  const dates = hist.data.visits.map((v) => v.visit_date);
  check('history is chronological', hist.data.size === 3 && dates.every((d, i) => i === 0 || dates[i - 1] <= d));
  check('linked nodes: head, tail and next pointers', hist.data.visits[0].isHead && hist.data.visits[2].isTail && hist.data.visits[0].nextHistoryId === hist.data.visits[1].history_id && hist.data.visits[2].nextHistoryId === null);
  const addH = await call('POST', '/patients/P1006/history', { token: D, body: { doctor_id: 'D003', visit_date: '2026-09-01', diagnosis: 'Test', treatment: 'Test rx' } });
  check('add history', addH.status === 201);
  check('invalid history date -> 400', (await call('POST', '/patients/P1006/history', { token: D, body: { doctor_id: 'D003', visit_date: '2026-13-45', diagnosis: 'x', treatment: 'y' } })).status === 400);
  check('history for unknown doctor -> 404', (await call('POST', '/patients/P1006/history', { token: D, body: { doctor_id: 'D404', visit_date: '2026-09-01', diagnosis: 'x', treatment: 'y' } })).status === 404);
  const addRx = await call('POST', '/patients/P1006/prescriptions', { token: D, body: { doctor_id: 'D003', medicine: 'Test', dosage: '1', duration: '1 day' } });
  check('add prescription', addRx.status === 201);
  check('delete history', (await call('DELETE', `/history/${addH.data.history_id}`, { token: D })).status === 200);
  check('delete prescription', (await call('DELETE', `/prescriptions/${addRx.data.prescription_id}`, { token: D })).status === 200);

  console.log('\nAppointments and the FIFO queue');
  const today = new Date(); const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  check('past date rejected', (await call('POST', '/appointments', { token: R, body: { patient_id: 'P1006', doctor_id: 'D001', appointment_date: '2020-01-01', appointment_time: '10:00' } })).status === 400);
  check('unknown doctor -> 404', (await call('POST', '/appointments', { token: R, body: { patient_id: 'P1006', doctor_id: 'D404', appointment_date: todayStr, appointment_time: '10:00' } })).status === 404);
  check('invalid priority -> 400', (await call('POST', '/appointments', { token: R, body: { patient_id: 'P1006', doctor_id: 'D001', appointment_date: todayStr, appointment_time: '10:00', priority: 9 } })).status === 400);
  const q0 = await call('GET', '/appointments/queue', { token: R });
  const a1 = await call('POST', '/appointments', { token: R, body: { patient_id: 'P1006', doctor_id: 'D001', appointment_date: todayStr, appointment_time: '15:00', priority: 3 } });
  check('create appointment', a1.status === 201 && a1.data.status === 'Pending');
  check('double booking of a doctor slot -> 409', (await call('POST', '/appointments', { token: R, body: { patient_id: 'P1001', doctor_id: 'D001', appointment_date: todayStr, appointment_time: '15:00', priority: 3 } })).status === 409);
  const q1 = await call('GET', '/appointments/queue', { token: R });
  check('new normal appointment joins the BACK of the FIFO queue', q1.data.size === q0.data.size + 1 && q1.data.items[q1.data.items.length - 1].appointment_id === a1.data.appointment_id);
  const served = await call('POST', '/appointments/queue/next', { token: R });
  check('dequeue serves the FRONT (first booked) appointment', served.status === 200 && served.data.served.appointment_id === q0.data.items[0].appointment_id);
  const upA = await call('PUT', `/appointments/${a1.data.appointment_id}`, { token: R, body: { patient_id: 'P1006', doctor_id: 'D001', appointment_date: todayStr, appointment_time: '15:30', priority: 3, status: 'Confirmed' } });
  check('update appointment', upA.status === 200 && upA.data.status === 'Confirmed');
  check('delete appointment (receptionist)', (await call('DELETE', `/appointments/${a1.data.appointment_id}`, { token: R })).status === 200);

  console.log('\nEmergency priority queue (binary heap)');
  const e0 = await call('GET', '/emergency', { token: R });
  const order = e0.data.items.map((i) => i.priority);
  check('queue is ordered by priority, not arrival', e0.data.items[0].patient_id === 'P1001' && order.every((p, i) => i === 0 || order[i - 1] <= p), JSON.stringify(order));
  const addE = await call('POST', '/emergency', { token: R, body: { patient_id: 'P1006', priority: 1, reason: 'Test critical' } });
  check('add emergency patient', addE.status === 201);
  check('same patient twice -> 409', (await call('POST', '/emergency', { token: R, body: { patient_id: 'P1006', priority: 2 } })).status === 409);
  const e1 = await call('GET', '/emergency', { token: R });
  check('FIFO among equal priority (P1001 before the later Critical P1006)', e1.data.items[0].patient_id === 'P1001' && e1.data.items[1].patient_id === 'P1006');
  const p1 = await call('POST', '/emergency/process-next', { token: R });
  check('process next removes the highest priority patient', p1.status === 200 && p1.data.processed.patient_id === 'P1001' && /is now being processed/.test(p1.message));
  const p2 = await call('POST', '/emergency/process-next', { token: R });
  check('then the next Critical (P1006)', p2.data.processed.patient_id === 'P1006');
  const p3 = await call('POST', '/emergency/process-next', { token: R });
  check('then Emergency (P1002)', p3.data.processed.patient_id === 'P1002');
  const p4 = await call('POST', '/emergency/process-next', { token: R });
  check('then Normal (P1003)', p4.data.processed.patient_id === 'P1003');
  const p5 = await call('POST', '/emergency/process-next', { token: R });
  check('empty queue -> 404 "No emergency patients waiting."', p5.status === 404 && /No emergency patients waiting/.test(p5.message));

  console.log('\nDashboard, doctors, reports');
  const dash = await call('GET', '/dashboard', { token: R });
  check('dashboard returns real numbers', dash.status === 200 && dash.data.stats.totalDoctors === 3 && dash.data.stats.totalPatients >= 5);
  const doc = await call('POST', '/doctors', { token: A, body: { doctor_id: 'D099', name: 'Dr. Test', specialization: 'Testing' } });
  check('admin adds doctor', doc.status === 201);
  check('duplicate doctor -> 409', (await call('POST', '/doctors', { token: A, body: { doctor_id: 'D099', name: 'x', specialization: 'y' } })).status === 409);
  check('admin updates doctor', (await call('PUT', '/doctors/D099', { token: A, body: { name: 'Dr. Test 2', specialization: 'Testing' } })).status === 200);
  check('admin deletes doctor', (await call('DELETE', '/doctors/D099', { token: A })).status === 200);
  const rep = await call('GET', '/reports?doctor_id=D001', { token: A });
  check('reports with doctor filter', rep.status === 200 && rep.data.doctorWiseAppointments.length === 1);
  check('invalid report date -> 400', (await call('GET', '/reports?from=nope', { token: A })).status === 400);

  console.log('\nDSA demonstration endpoints');
  await call('POST', '/dsa/reset', { token: A, body: {} });
  const hs = await call('POST', '/dsa/hashmap/set', { token: A, body: { key: 'P1001', value: 'Rahul Sharma' } });
  check('hash map set', hs.status === 200 && hs.state.stats.size === 1);
  const hg = await call('GET', '/dsa/hashmap/get/P1001', { token: A });
  check('hash map get -> Patient Found', hg.result.found === true && /O\(1\)/.test(hg.result.complexity));
  const hc = await call('POST', '/dsa/hashmap/collisions', { token: A, body: { key: 'P1001' } });
  check('hash map collisions chain in one bucket', hc.state.stats.longestChain >= 3 && hc.state.stats.collidingEntries >= 2);
  check('hash map delete', (await call('DELETE', '/dsa/hashmap/P1001', { token: A })).result.found === true);
  const hl = await call('POST', '/dsa/hashmap/load-patients', { token: A });
  check('hash map loads real patients from PostgreSQL', hl.state.stats.size >= 5);
  const qd = await call('POST', '/dsa/queue/dequeue', { token: A });
  check('queue dequeue returns Patient A first (FIFO)', qd.result.value === 'Patient A');
  const pqe = await call('POST', '/dsa/priority-queue/extract', { token: A });
  check('priority queue extracts Rahul (priority 1) first', pqe.result.message.includes('Rahul'));
  const hi = await call('POST', '/dsa/heap/insert', { token: A, body: { value: 0 } });
  check('heap insert 0 becomes the min', hi.state.min === 0);
  const hx = await call('POST', '/dsa/heap/extract', { token: A });
  check('heap extract returns 0', hx.result.value === 0);
  const la = await call('POST', '/dsa/linked-list/add', { token: A, body: { date: '2026-09-25', diagnosis: 'Cough', treatment: 'Syrup' } });
  check('linked list add', la.state.size === 4);
  check('linked list search', (await call('POST', '/dsa/linked-list/search', { token: A, body: { diagnosis: 'Cough' } })).result.position === 4);
  check('linked list delete', (await call('POST', '/dsa/linked-list/delete', { token: A, body: { diagnosis: 'Cough' } })).state.size === 3);
  const lin2 = await call('POST', '/dsa/search', { token: A, body: { dataset: 'numbers', algorithm: 'linear', numbers: '40,10,30,20', query: '30' } });
  check('demo linear search on numbers (3 comparisons)', lin2.data.found && lin2.data.comparisons === 4);
  const binNo = await call('POST', '/dsa/search', { token: A, body: { dataset: 'numbers', algorithm: 'binary', numbers: '40,10,30,20', query: '30' } });
  check('binary search refuses unsorted data', binNo.data.needsSort === true);
  const binYes = await call('POST', '/dsa/search', { token: A, body: { dataset: 'numbers', algorithm: 'binary', numbers: '40,10,30,20', query: '30', sortFirst: true } });
  check('binary search works after merge sort', binYes.data.found && binYes.data.sortComparisons > 0);
  const srt = await call('POST', '/dsa/sort', { token: A, body: { dataset: 'patients', field: 'name', order: 'asc' } });
  check('demo merge sort (before/after)', srt.data.before.length === srt.data.after.length && srt.data.comparisons > 0);

  // cleanup the test patient (cascades to its appointments/history/emergency rows)
  check('admin deletes test patient', (await call('DELETE', '/patients/P1006', { token: A })).status === 200);
  check('deleted patient is gone from the Hash Map index', (await call('GET', '/patients/P1006', { token: A })).status === 404);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('Test run crashed:', e.message, '\nIs the backend running? (npm run dev)'); process.exit(1); });
