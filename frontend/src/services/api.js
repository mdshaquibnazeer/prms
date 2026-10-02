// Tiny fetch wrapper: adds the JWT, parses JSON and turns failures into friendly ApiError messages.
const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'prms_token';

export class ApiError extends Error {
  constructor(message, status = 0, fieldErrors = null) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors; // { field: 'message' } from server-side validation
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let unauthorizedHandler = null;
export const onUnauthorized = (fn) => { unauthorizedHandler = fn; };

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Cannot reach the server. Check that the backend is running and try again.');
  }

  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/login') && unauthorizedHandler) unauthorizedHandler();
    throw new ApiError(data.message || 'Something went wrong. Please try again.', res.status, data.errors || null);
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b = {}) => request('POST', p, b),
  put: (p, b = {}) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
};

const qs = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

// ---- endpoint helpers (one place that lists every API call the UI makes) ----
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
  users: () => api.get('/users'),
  createUser: (u) => api.post('/users', u),
};
export const patientsApi = {
  list: (params) => api.get(`/patients${qs(params)}`),
  get: (id) => api.get(`/patients/${encodeURIComponent(id)}`),
  nextId: () => api.get('/patients/next-id'),
  create: (p) => api.post('/patients', p),
  update: (id, p) => api.put(`/patients/${encodeURIComponent(id)}`, p),
  remove: (id) => api.del(`/patients/${encodeURIComponent(id)}`),
  history: (id) => api.get(`/patients/${encodeURIComponent(id)}/history`),
  addHistory: (id, h) => api.post(`/patients/${encodeURIComponent(id)}/history`, h),
  prescriptions: (id) => api.get(`/patients/${encodeURIComponent(id)}/prescriptions`),
  addPrescription: (id, r) => api.post(`/patients/${encodeURIComponent(id)}/prescriptions`, r),
  appointments: (id) => api.get(`/appointments${qs({ patient_id: id })}`),
};
export const historyApi = { remove: (id) => api.del(`/history/${id}`) };
export const prescriptionsApi = { all: () => api.get('/prescriptions'), remove: (id) => api.del(`/prescriptions/${id}`) };
export const doctorsApi = {
  list: () => api.get('/doctors'),
  create: (d) => api.post('/doctors', d),
  update: (id, d) => api.put(`/doctors/${encodeURIComponent(id)}`, d),
  remove: (id) => api.del(`/doctors/${encodeURIComponent(id)}`),
};
export const appointmentsApi = {
  list: (params) => api.get(`/appointments${qs(params)}`),
  create: (a) => api.post('/appointments', a),
  update: (id, a) => api.put(`/appointments/${id}`, a),
  remove: (id) => api.del(`/appointments/${id}`),
  queue: () => api.get('/appointments/queue'),
  serveNext: () => api.post('/appointments/queue/next'),
};
export const emergencyApi = {
  queue: () => api.get('/emergency'),
  add: (e) => api.post('/emergency', e),
  processNext: () => api.post('/emergency/process-next'),
};
export const dashboardApi = { get: () => api.get('/dashboard') };
export const reportsApi = { get: (params) => api.get(`/reports${qs(params)}`) };

// ---- DSA demonstration ----
export const dsaApi = {
  info: () => api.get('/dsa/info'),
  state: () => api.get('/dsa/state'),
  reset: (which) => api.post('/dsa/reset', { which }),
  hashLoad: () => api.post('/dsa/hashmap/load-patients'),
  hashSet: (key, value) => api.post('/dsa/hashmap/set', { key, value }),
  hashGet: (key) => api.get(`/dsa/hashmap/get/${encodeURIComponent(key)}`),
  hashDelete: (key) => api.del(`/dsa/hashmap/${encodeURIComponent(key)}`),
  hashCollide: (key) => api.post('/dsa/hashmap/collisions', { key }),
  queueEnqueue: (name) => api.post('/dsa/queue/enqueue', { name }),
  queueDequeue: () => api.post('/dsa/queue/dequeue'),
  queuePeek: () => api.get('/dsa/queue/peek'),
  pqInsert: (name, priority) => api.post('/dsa/priority-queue/insert', { name, priority }),
  pqPeek: () => api.get('/dsa/priority-queue/peek'),
  pqExtract: () => api.post('/dsa/priority-queue/extract'),
  pqLoad: () => api.post('/dsa/priority-queue/load-emergency'),
  heapInsert: (value) => api.post('/dsa/heap/insert', { value }),
  heapExtract: () => api.post('/dsa/heap/extract'),
  heapPeek: () => api.get('/dsa/heap/peek'),
  heapHeapify: (values) => api.post('/dsa/heap/heapify', { values }),
  listAdd: (v) => api.post('/dsa/linked-list/add', v),
  listDelete: (diagnosis) => api.post('/dsa/linked-list/delete', { diagnosis }),
  listSearch: (diagnosis) => api.post('/dsa/linked-list/search', { diagnosis }),
  listDisplay: () => api.post('/dsa/linked-list/display'),
  listLoad: (patient_id) => api.post('/dsa/linked-list/load-patient', { patient_id }),
  search: (body) => api.post('/dsa/search', body),
  sort: (body) => api.post('/dsa/sort', body),
};
