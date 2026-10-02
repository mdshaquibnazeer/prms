export const PRIORITY = {
  1: { label: 'Critical', cls: 'bg-critical-soft text-critical' },
  2: { label: 'Emergency', cls: 'bg-emergency-soft text-emergency' },
  3: { label: 'Normal', cls: 'bg-normal-soft text-normal' },
};
export const STATUS_CLS = {
  Pending: 'bg-emergency-soft text-emergency',
  Confirmed: 'bg-normal-soft text-normal',
  Completed: 'bg-success-soft text-success',
  Cancelled: 'bg-slate-100 text-slate-600',
};
export const STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
export const GENDERS = ['Male', 'Female', 'Other'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** '2026-09-20' -> '20 Sep 2026' (no timezone surprises: parsed by hand). */
export function formatDate(str) {
  if (!str) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (!m) return str;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function formatDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${formatDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function waitingText(minutes) {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
