import { PRIORITY, STATUS_CLS } from '../utils/format';

export function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || PRIORITY[3];
  return <span className={`badge ${p.cls}`}>{p.label}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLS[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}
