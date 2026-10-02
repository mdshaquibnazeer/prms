/**
 * dsaDemoService.js - powers the "DSA Demonstration" page.
 *
 * Every operation runs on the REAL classes from src/dsa. Each logged-in user gets their own
 * set of demo structures (kept in memory) so students can experiment without affecting each other.
 * Hash Map / Linked List demos can also be loaded with real data from PostgreSQL.
 */
const patientModel = require('../models/patientModel');
const historyModel = require('../models/historyModel');
const AppError = require('../utils/AppError');
const patientService = require('./patientService');
const {
  HashMap, Queue, MinHeap, PriorityQueue, LinkedList,
  mergeSort, isSorted, linearSearch, linearSearchAll, binarySearch, binarySearchAll,
} = require('../dsa');

const PRIORITY_LABEL = { 1: 'Critical', 2: 'Emergency', 3: 'Normal' };
const sessions = new Map(); // userId -> { hashMap, queue, pq, heap, list }

function freshSession() {
  const queue = new Queue();
  ['Patient A', 'Patient B', 'Patient C'].forEach((n) => queue.enqueue(n));
  const pq = new PriorityQueue();
  pq.enqueue('Sara', 3); pq.enqueue('Rahul', 1); pq.enqueue('Aman', 2);
  const heap = new MinHeap();
  [5, 3, 8, 1, 9, 2].forEach((n) => heap.insert(n));
  const list = new LinkedList();
  list.append({ id: 1, date: '2026-06-10', diagnosis: 'Cold', treatment: 'Rest and fluids' });
  list.append({ id: 2, date: '2026-08-10', diagnosis: 'Fever', treatment: 'Paracetamol' });
  list.append({ id: 3, date: '2026-09-20', diagnosis: 'Migraine', treatment: 'Pain relief' });
  return {
    hashMap: new HashMap(7, { autoResize: false }), // small + no resize so collisions are visible
    queue, pq, heap, list, nextVisitId: 4,
  };
}

function session(userId) {
  if (!sessions.has(userId)) sessions.set(userId, freshSession());
  return sessions.get(userId);
}

function reset(userId, which) {
  const fresh = freshSession();
  const s = session(userId);
  if (!which || which === 'all') sessions.set(userId, fresh);
  else if (which in fresh) s[which] = fresh[which];
  return getState(userId);
}

const needStr = (v, label) => {
  const s = String(v ?? '').trim();
  if (!s) throw new AppError(400, `${label} is required.`);
  return s;
};

// ---- state snapshots for the UI ------------------------------------------
function hashMapState(s) {
  return { stats: s.hashMap.getStats(), buckets: s.hashMap.getBuckets() };
}
function queueState(s) {
  return { items: s.queue.toArray(), size: s.queue.size(), front: s.queue.peek() ?? null, back: s.queue.tail ? s.queue.tail.value : null };
}
function pqState(s) {
  return {
    size: s.pq.size(),
    order: s.pq.toSortedArray().map((e) => ({ name: e.item, priority: e.priority, label: PRIORITY_LABEL[e.priority] })),
    heapArray: s.pq.toHeapArray().map((e) => ({ name: e.item, priority: e.priority })),
  };
}
function heapState(s) {
  return { size: s.heap.size(), array: s.heap.toArray(), min: s.heap.peek() ?? null };
}
function listState(s) {
  const d = s.list.describe((v) => v.diagnosis);
  return { size: d.size, headPosition: d.headPosition, nodes: d.nodes.map((n) => ({ position: n.position, ...n.data, isHead: n.isHead, isTail: n.isTail, nextPosition: n.nextPosition })) };
}
function getState(userId) {
  const s = session(userId);
  return { hashMap: hashMapState(s), queue: queueState(s), priorityQueue: pqState(s), heap: heapState(s), linkedList: listState(s) };
}

// ---- Hash Map ---------------------------------------------------------------
async function hashMapLoadPatients(userId) {
  const s = session(userId);
  const rows = await patientModel.findAllEnriched();
  s.hashMap.clear();
  rows.forEach((r) => s.hashMap.set(r.patient_id, r.name));
  return { result: { message: `Loaded ${rows.length} patients from PostgreSQL into the Hash Map (Patient ID -> name).`, complexity: 'n inserts, each average O(1)' }, state: hashMapState(s) };
}
function hashMapSet(userId, key, value) {
  const s = session(userId);
  const k = needStr(key, 'Patient ID').toUpperCase();
  const v = needStr(value, 'Patient name');
  const before = s.hashMap.hash(k);
  const isNew = s.hashMap.set(k, v);
  const chain = s.hashMap.getBuckets()[before].chain.length;
  return {
    result: {
      message: isNew ? `Inserted ${k} -> ${v} into bucket ${before}.` : `${k} already existed, so its value was updated.`,
      bucketIndex: before, collision: isNew && chain > 1,
      collisionNote: isNew && chain > 1 ? `Collision! Bucket ${before} already held another key, so ${k} was chained after it (separate chaining).` : null,
      complexity: 'Average O(1)',
    },
    state: hashMapState(s),
  };
}
function hashMapGet(userId, key) {
  const s = session(userId);
  const k = needStr(key, 'Patient ID').toUpperCase();
  const r = s.hashMap.lookup(k);
  return {
    result: {
      found: r.found, value: r.value ?? null, bucketIndex: r.bucketIndex, comparisons: r.comparisons,
      message: r.found ? `Patient Found: ${k} -> ${r.value} (bucket ${r.bucketIndex}, ${r.comparisons} comparison${r.comparisons === 1 ? '' : 's'}).` : `Patient ${k} not found (checked bucket ${r.bucketIndex}, ${r.comparisons} comparison${r.comparisons === 1 ? '' : 's'}).`,
      explanation: 'Hash Map stores patient records using Patient ID as the key for fast average-case lookup.',
      complexity: 'Average Search = O(1)',
    },
    state: hashMapState(s),
  };
}
function hashMapDelete(userId, key) {
  const s = session(userId);
  const k = needStr(key, 'Patient ID').toUpperCase();
  const ok = s.hashMap.delete(k);
  return { result: { found: ok, message: ok ? `Deleted ${k}.` : `${k} was not in the Hash Map.`, complexity: 'Average O(1)' }, state: hashMapState(s) };
}
/** Insert keys that really collide with `seedKey` so the chaining is easy to demonstrate. */
function hashMapCollisions(userId, seedKey) {
  const s = session(userId);
  const base = String(seedKey || 'P1001').toUpperCase();
  const target = s.hashMap.hash(base);
  const found = [];
  for (let n = 1002; n < 9999 && found.length < 3; n++) {
    const k = `P${n}`;
    if (k !== base && s.hashMap.hash(k) === target && !s.hashMap.has(k)) found.push(k);
  }
  s.hashMap.set(base, `Demo ${base}`);
  found.forEach((k) => s.hashMap.set(k, `Demo ${k}`));
  return { result: { message: `Inserted ${[base, ...found].join(', ')}. All of them hash to bucket ${target}, so they form one chain.`, bucketIndex: target, complexity: 'Chain walk: O(chain length)' }, state: hashMapState(s) };
}

// ---- Queue ----------------------------------------------------------------
function queueEnqueue(userId, name) {
  const s = session(userId);
  const n = needStr(name, 'Patient name');
  s.queue.enqueue(n);
  return { result: { message: `${n} joined the back of the queue.`, complexity: 'Enqueue = O(1)', principle: 'FIFO' }, state: queueState(s) };
}
function queueDequeue(userId) {
  const s = session(userId);
  if (s.queue.isEmpty()) return { result: { message: 'Queue is empty - nothing to dequeue.', empty: true, complexity: 'Dequeue = O(1)' }, state: queueState(s) };
  const v = s.queue.dequeue();
  return { result: { message: `${v} was at the front and has been removed (First In, First Out).`, value: v, complexity: 'Dequeue = O(1)', principle: 'FIFO' }, state: queueState(s) };
}
function queuePeek(userId) {
  const s = session(userId);
  const v = s.queue.peek();
  return { result: { message: v === undefined ? 'Queue is empty.' : `Front of the queue is ${v} (not removed).`, value: v ?? null, complexity: 'Peek = O(1)' }, state: queueState(s) };
}

// ---- Priority Queue -----------------------------------------------------------
function pqInsert(userId, name, priority) {
  const s = session(userId);
  const n = needStr(name, 'Patient name');
  const p = Number(priority);
  if (![1, 2, 3].includes(p)) throw new AppError(400, 'Priority must be 1 (Critical), 2 (Emergency) or 3 (Normal).');
  s.pq.enqueue(n, p);
  return { result: { message: `${n} inserted with priority ${p} (${PRIORITY_LABEL[p]}). The heap re-ordered itself.`, complexity: 'Insert = O(log n)', swaps: s.pq.heap.lastSwaps.length }, state: pqState(s) };
}
function pqPeek(userId) {
  const s = session(userId);
  const e = s.pq.peek();
  return { result: { message: e ? `Most urgent: ${e.item} (priority ${e.priority} - ${PRIORITY_LABEL[e.priority]}).` : 'Priority queue is empty.', complexity: 'Peek = O(1)' }, state: pqState(s) };
}
function pqExtract(userId) {
  const s = session(userId);
  const e = s.pq.dequeue();
  return { result: { message: e ? `Extracted ${e.item} (priority ${e.priority} - ${PRIORITY_LABEL[e.priority]}). Lower number = higher urgency.` : 'Priority queue is empty.', complexity: 'Extract = O(log n)', empty: !e }, state: pqState(s) };
}
async function pqLoadEmergency(userId) {
  const emergencyModel = require('../models/emergencyModel');
  const s = session(userId);
  const rows = await emergencyModel.findWaiting();
  s.pq = new PriorityQueue();
  rows.forEach((r) => s.pq.enqueue(r.patient_name, r.priority));
  return { result: { message: `Loaded ${rows.length} waiting emergency patient(s) from PostgreSQL (your changes here do NOT affect the real queue).`, complexity: 'n inserts, O(n log n)' }, state: pqState(s) };
}

// ---- Heap -----------------------------------------------------------------
function heapInsert(userId, value) {
  const s = session(userId);
  const v = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isFinite(v)) throw new AppError(400, 'Enter a number to insert.');
  s.heap.insert(v);
  return { result: { message: `Inserted ${v}, then sifted it up (${s.heap.lastSwaps.length} swap${s.heap.lastSwaps.length === 1 ? '' : 's'}).`, swaps: s.heap.lastSwaps, complexity: 'Insert = O(log n)' }, state: heapState(s) };
}
function heapExtract(userId) {
  const s = session(userId);
  const v = s.heap.extractMin();
  return { result: { message: v === undefined ? 'Heap is empty.' : `Extracted the minimum ${v}, moved the last item to the root and sifted it down (${s.heap.lastSwaps.length} swap${s.heap.lastSwaps.length === 1 ? '' : 's'}).`, swaps: s.heap.lastSwaps, value: v ?? null, complexity: 'Extract = O(log n)' }, state: heapState(s) };
}
function heapPeek(userId) {
  const s = session(userId);
  const v = s.heap.peek();
  return { result: { message: v === undefined ? 'Heap is empty.' : `The minimum is ${v} (the root).`, value: v ?? null, complexity: 'Peek = O(1)' }, state: heapState(s) };
}
function heapHeapify(userId, values) {
  const s = session(userId);
  const nums = String(values || '').split(/[\s,]+/).filter(Boolean).map(Number);
  if (nums.length === 0 || nums.some((n) => !Number.isFinite(n))) throw new AppError(400, 'Enter numbers separated by commas, e.g. 9, 4, 7, 1.');
  s.heap.heapify(nums);
  return { result: { message: `Built a heap from [${nums.join(', ')}] with heapify.`, swaps: s.heap.lastSwaps, complexity: 'Heapify = O(n)' }, state: heapState(s) };
}

// ---- Linked List -------------------------------------------------------------
function listAdd(userId, { date, diagnosis, treatment }) {
  const s = session(userId);
  const d = needStr(date, 'Date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new AppError(400, 'Date must look like 2026-09-20.');
  const visit = { id: s.nextVisitId++, date: d, diagnosis: needStr(diagnosis, 'Diagnosis'), treatment: needStr(treatment, 'Treatment') };
  s.list.append(visit);
  return { result: { message: `Added a new node for ${visit.diagnosis} at the end of the list (tail.next = new node).`, complexity: 'Append = O(1) (tail pointer maintained)' }, state: listState(s) };
}
function listDelete(userId, diagnosis) {
  const s = session(userId);
  const q = needStr(diagnosis, 'Diagnosis to delete').toLowerCase();
  const removed = s.list.delete((v) => v.diagnosis.toLowerCase() === q);
  return { result: { message: removed ? `Deleted the visit "${removed.diagnosis}" by re-linking the previous node to the next one.` : `No visit with diagnosis "${diagnosis}" was found.`, found: !!removed, complexity: 'Delete = O(n) (find the node first)' }, state: listState(s) };
}
function listSearch(userId, diagnosis) {
  const s = session(userId);
  const q = needStr(diagnosis, 'Diagnosis to search').toLowerCase();
  const r = s.list.search((v) => v.diagnosis.toLowerCase().includes(q));
  return { result: { message: r ? `Found "${r.data.diagnosis}" at node ${r.position} after ${r.comparisons} step(s) from the head.` : `"${diagnosis}" is not in the list (walked all ${s.list.size()} nodes).`, found: !!r, position: r ? r.position : null, complexity: 'Search = O(n)' }, state: listState(s) };
}
function listDisplay(userId) {
  const s = session(userId);
  const order = s.list.display().map((v) => `${v.date}: ${v.diagnosis}`);
  return { result: { message: order.length ? `Traversed head -> tail: ${order.join('  ->  ')}` : 'The list is empty.', complexity: 'Display = O(n)' }, state: listState(s) };
}
async function listLoadPatient(userId, patientId) {
  const s = session(userId);
  const id = needStr(patientId, 'Patient ID').toUpperCase();
  if (!(await patientService.exists(id))) throw new AppError(404, 'Patient not found.');
  const rows = mergeSort(await historyModel.findByPatient(id), (a, b) => (a.visit_date < b.visit_date ? -1 : a.visit_date > b.visit_date ? 1 : 0));
  s.list = new LinkedList();
  rows.forEach((r) => s.list.append({ id: r.history_id, date: r.visit_date, diagnosis: r.diagnosis, treatment: r.treatment }));
  s.nextVisitId = 1000;
  return { result: { message: `Loaded ${rows.length} visit(s) of ${id} from PostgreSQL into a linked list (your edits here do NOT change the database).`, complexity: 'n appends, O(n)' }, state: listState(s) };
}

// ---- Searching --------------------------------------------------------------
const PATIENT_FIELDS = {
  patient_id: { get: (p) => p.patient_id, numeric: false },
  name: { get: (p) => p.name, numeric: false },
  age: { get: (p) => p.age, numeric: true },
};
const norm = (v, numeric) => (numeric ? Number(v) : String(v).toLowerCase());
const cmpVals = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function parseNumbers(text) {
  const nums = String(text || '').split(/[\s,]+/).filter(Boolean).map(Number);
  if (nums.length === 0 || nums.some((n) => !Number.isFinite(n))) throw new AppError(400, 'Enter numbers separated by commas, e.g. 40, 10, 30, 20.');
  if (nums.length > 500) throw new AppError(400, 'Please use at most 500 numbers.');
  return nums;
}

async function datasetFor({ dataset, field, numbers }) {
  if (dataset === 'numbers') {
    const nums = parseNumbers(numbers);
    return { items: nums, getKey: (x) => x, numeric: true, label: (x) => String(x), field: 'number' };
  }
  const f = PATIENT_FIELDS[field] || PATIENT_FIELDS.patient_id;
  const rows = await patientModel.findAllEnriched();
  return { items: rows, getKey: (p) => norm(f.get(p), f.numeric), numeric: f.numeric, label: (p) => `${p.patient_id} ${p.name} (${p.age})`, field: PATIENT_FIELDS[field] ? field : 'patient_id' };
}

async function runSearch({ dataset = 'patients', field, algorithm = 'linear', query, numbers, sortFirst = false }) {
  const d = await datasetFor({ dataset, field, numbers });
  const qRaw = String(query ?? '').trim();
  if (!qRaw) throw new AppError(400, 'Enter a value to search for.');
  const target = d.numeric ? Number(qRaw) : qRaw.toLowerCase();
  if (d.numeric && !Number.isFinite(target)) throw new AppError(400, 'This field is numeric - enter a number to search for.');
  const input = d.items.map(d.label);

  if (algorithm === 'hash') {
    if (dataset !== 'patients' || d.field !== 'patient_id') throw new AppError(400, 'The Hash Map search works on Patient ID. Choose dataset "Patients" and field "Patient ID".');
    const map = new HashMap(16);
    d.items.forEach((p) => map.set(p.patient_id, p));
    const r = map.lookup(qRaw.toUpperCase());
    return { algorithm: 'Hash Map', complexity: 'Average O(1)', input: { dataset, field: d.field, query: qRaw, size: d.items.length }, dataBefore: input, found: r.found, results: r.found ? [d.label(r.value)] : [], comparisons: r.comparisons, notes: [`Built the Hash Map from ${d.items.length} records, then looked up bucket ${r.bucketIndex}.`] };
  }

  if (algorithm === 'linear') {
    const r = dataset === 'numbers' ? linearSearchAll(d.items, (x) => x === target) : linearSearchAll(d.items, (p) => d.getKey(p) === target);
    return { algorithm: 'Linear Search', complexity: 'O(n)', input: { dataset, field: d.field, query: qRaw, size: d.items.length }, dataBefore: input, found: r.found, results: r.indexes.map((i) => ({ index: i, value: input[i] })), comparisons: r.comparisons, notes: ['Checked every element from the start - works on unsorted data.'] };
  }

  if (algorithm === 'binary') {
    const sortedAlready = isSorted(d.items, (a, b) => cmpVals(d.getKey(a), d.getKey(b)));
    if (!sortedAlready && !sortFirst) {
      return { algorithm: 'Binary Search', complexity: 'O(log n)', input: { dataset, field: d.field, query: qRaw, size: d.items.length }, dataBefore: input, needsSort: true, found: false, results: [], comparisons: 0, notes: ['Binary Search only works on SORTED data and this data is not sorted by the chosen field.', 'Tick "Sort first with Merge Sort" and search again.'] };
    }
    let data = d.items;
    const notes = [];
    let sortComparisons = 0;
    if (!sortedAlready) {
      const st = { comparisons: 0 };
      data = mergeSort(d.items, (a, b) => cmpVals(d.getKey(a), d.getKey(b)), st);
      sortComparisons = st.comparisons;
      notes.push(`Data was not sorted, so it was sorted with Merge Sort first (${st.comparisons} comparisons).`);
    } else notes.push('Data is already sorted by this field.');
    const r = binarySearchAll(data, target, d.getKey);
    return { algorithm: 'Binary Search', complexity: 'O(log n)', input: { dataset, field: d.field, query: qRaw, size: data.length }, dataBefore: input, dataSorted: data.map(d.label), found: r.found, results: r.indexes.map((i) => ({ index: i, value: d.label(data[i]) })), comparisons: r.comparisons, sortComparisons, steps: r.steps, notes };
  }
  throw new AppError(400, 'Unknown algorithm.');
}

// ---- Sorting ----------------------------------------------------------------
async function runSort({ dataset = 'patients', field = 'patient_id', order = 'asc', numbers }) {
  const d = await datasetFor({ dataset, field, numbers });
  const dir = order === 'desc' ? -1 : 1;
  const stats = { comparisons: 0 };
  const sorted = mergeSort(d.items, (a, b) => cmpVals(d.getKey(a), d.getKey(b)) * dir, stats);
  return {
    algorithm: 'Merge Sort', complexity: 'O(n log n)', field: d.field, order: dir === 1 ? 'asc' : 'desc', size: d.items.length,
    before: d.items.map(d.label), after: sorted.map(d.label), comparisons: stats.comparisons,
    note: 'Implemented manually in dsa/Sorting.js - Array.sort() is not used.',
  };
}

module.exports = {
  getState, reset,
  hashMapLoadPatients, hashMapSet, hashMapGet, hashMapDelete, hashMapCollisions,
  queueEnqueue, queueDequeue, queuePeek,
  pqInsert, pqPeek, pqExtract, pqLoadEmergency,
  heapInsert, heapExtract, heapPeek, heapHeapify,
  listAdd, listDelete, listSearch, listDisplay, listLoadPatient,
  runSearch, runSort,
};
