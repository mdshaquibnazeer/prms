/**
 * patientService.js - patient business logic + DSA layer.
 *
 *  PostgreSQL (permanent storage)
 *       |  rows are loaded...
 *       v
 *  HashMap  (in-memory index: Patient ID -> patient record)   <- fast lookup / duplicate check
 *       |
 *  linearSearch / binarySearch / mergeSort run on the in-memory records
 *
 * The HashMap is an application-level structure. It is NOT the database. It is
 * rebuilt from PostgreSQL at start-up and after every write (refreshIndex).
 */
const patientModel = require('../models/patientModel');
const AppError = require('../utils/AppError');
const { HashMap, mergeSort, linearSearchAll, binarySearchAll } = require('../dsa');

let index = new HashMap(64);
let loaded = false;

async function refreshIndex() {
  const rows = await patientModel.findAllEnriched();
  const fresh = new HashMap(64);
  rows.forEach((r) => fresh.set(r.patient_id, r));
  index = fresh;
  loaded = true;
  return index.size;
}

async function ensureLoaded() {
  if (!loaded) await refreshIndex();
}

function getIndexStats() {
  return index.getStats();
}

// ---- sorting -----------------------------------------------------------
const SORT_FIELDS = {
  patient_id: 'patient_id',
  name: 'name',
  age: 'age',
  appointment_date: 'next_appointment_date',
  priority: 'top_priority',
};

/** Comparator for merge sort. Empty values (no appointment) always go last. */
function makeComparator(field, order) {
  const key = SORT_FIELDS[field];
  const dir = order === 'desc' ? -1 : 1;
  return (a, b) => {
    let x = a[key];
    let y = b[key];
    const xEmpty = x === null || x === undefined;
    const yEmpty = y === null || y === undefined;
    if (xEmpty && yEmpty) return 0;
    if (xEmpty) return 1;
    if (yEmpty) return -1;
    if (typeof x === 'string') { x = x.toLowerCase(); y = String(y).toLowerCase(); }
    if (x < y) return -1 * dir;
    if (x > y) return 1 * dir;
    return 0;
  };
}

const SEARCH_KEYS = { id: 'patient_id', name: 'name', phone: 'phone' };

const normalize = (field, value) => {
  const s = String(value ?? '').toLowerCase();
  return field === 'phone' ? s.replace(/[\s-]/g, '') : s;
};

/**
 * List / search / sort patients.
 * @param {object} q { search, by: id|name|phone, algorithm: auto|hash|linear|binary, sort, order }
 */
async function list(q = {}) {
  await ensureLoaded();
  const started = process.hrtime.bigint();
  const by = SEARCH_KEYS[q.by] ? q.by : 'id';
  const sortField = SORT_FIELDS[q.sort] ? q.sort : 'patient_id';
  const order = q.order === 'desc' ? 'desc' : 'asc';
  const search = String(q.search || '').trim();

  let rows = index.values();
  const meta = { total: index.size, search: null, sort: null };

  if (search) {
    let algorithm = q.algorithm || 'auto';
    if (algorithm === 'auto') algorithm = by === 'id' ? 'hash' : 'linear';
    const key = SEARCH_KEYS[by];
    const needle = normalize(by, search);

    if (algorithm === 'hash') {
      if (by !== 'id') throw new AppError(400, 'The Hash Map is keyed by Patient ID. Search by Patient ID, or pick Linear / Binary search.');
      const r = index.lookup(search.toUpperCase());
      rows = r.found ? [r.value] : [];
      meta.search = { algorithm: 'Hash Map', complexity: 'Average O(1)', comparisons: r.comparisons, bucketIndex: r.bucketIndex };
    } else if (algorithm === 'linear') {
      const r = linearSearchAll(rows, (p) => normalize(by, p[key]).includes(needle));
      rows = r.indexes.map((i) => rows[i]);
      meta.search = { algorithm: 'Linear Search (partial match)', complexity: 'O(n)', comparisons: r.comparisons };
    } else if (algorithm === 'binary') {
      // Binary search is ONLY valid on sorted data -> merge sort by the search field first.
      const sortStats = { comparisons: 0 };
      const cmp = (a, b) => {
        const x = normalize(by, a[key]);
        const y = normalize(by, b[key]);
        return x < y ? -1 : x > y ? 1 : 0;
      };
      const sorted = mergeSort(rows, cmp, sortStats);
      const r = binarySearchAll(sorted, needle, (p) => normalize(by, p[key]));
      rows = r.indexes.map((i) => sorted[i]);
      meta.search = {
        algorithm: 'Binary Search (exact match on sorted data)',
        complexity: 'O(log n) after an O(n log n) Merge Sort',
        comparisons: r.comparisons,
        sortComparisons: sortStats.comparisons,
      };
    } else {
      throw new AppError(400, 'Unknown search algorithm.');
    }
    meta.search.by = by;
    meta.search.query = search;
    meta.search.found = rows.length > 0;
  }

  const sortStats = { comparisons: 0 };
  rows = mergeSort(rows, makeComparator(sortField, order), sortStats);
  meta.sort = { algorithm: 'Merge Sort', complexity: 'O(n log n)', field: sortField, order, comparisons: sortStats.comparisons };
  meta.count = rows.length;
  meta.elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  return { data: rows, meta };
}

/** Get one patient by ID using the Hash Map (falls back to the database if the index is stale). */
async function getById(id) {
  await ensureLoaded();
  const key = String(id).toUpperCase();
  const r = index.lookup(key);
  if (r.found) return { patient: r.value, lookup: { algorithm: 'Hash Map', complexity: 'Average O(1)', comparisons: r.comparisons, bucketIndex: r.bucketIndex } };
  const fromDb = await patientModel.findEnrichedById(key);
  if (!fromDb) throw new AppError(404, 'Patient not found.');
  index.set(key, fromDb);
  return { patient: fromDb, lookup: { algorithm: 'Database fallback', complexity: 'Indexed SELECT', comparisons: 0 } };
}

/** Existence check used by other services. Uses the Hash Map first, then the database. */
async function exists(id) {
  await ensureLoaded();
  const key = String(id).toUpperCase();
  if (index.has(key)) return true;
  return patientModel.exists(key);
}

async function create(data) {
  await ensureLoaded();
  if (index.has(data.patient_id)) throw new AppError(409, `Patient ID ${data.patient_id} already exists.`, { patient_id: 'This Patient ID is already in use.' });
  await patientModel.create(data); // the database UNIQUE/PRIMARY KEY still protects us from races
  await refreshIndex();
  return (await getById(data.patient_id)).patient;
}

async function update(id, data) {
  await getById(id); // 404 if missing
  await patientModel.update(String(id).toUpperCase(), data);
  await refreshIndex();
  return (await getById(id)).patient;
}

async function remove(id) {
  const ok = await patientModel.remove(String(id).toUpperCase());
  if (!ok) throw new AppError(404, 'Patient not found.');
  await refreshIndex();
}

/** Suggest the next free ID such as P1006 (largest numeric part + 1). */
async function nextId() {
  const ids = await patientModel.lastIds();
  let max = 1000;
  ids.forEach((id) => {
    const m = /^P(\d+)$/.exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return `P${max + 1}`;
}

module.exports = { refreshIndex, getIndexStats, list, getById, exists, create, update, remove, nextId, SORT_FIELDS };
