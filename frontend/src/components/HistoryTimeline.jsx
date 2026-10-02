import { useState } from 'react';
import { ArrowDown, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/format';
import { EmptyState } from './Feedback';
import { ClipboardList } from 'lucide-react';

/**
 * Shows the medical history linked list as a timeline.
 * `visits` come from the backend already in list order (head = oldest visit).
 */
export default function HistoryTimeline({ visits, onDelete, canDelete }) {
  const [newestFirst, setNewestFirst] = useState(false);
  if (!visits.length) return <EmptyState icon={ClipboardList} title="No medical history available." hint="Visits you add will appear here, linked one after another." />;
  const list = newestFirst ? [...visits].reverse() : visits;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">Stored as a linked list: each visit is a node that points to the next one.</p>
        <button className="btn-ghost btn-sm" onClick={() => setNewestFirst(!newestFirst)}>{newestFirst ? 'Show oldest first (list order)' : 'Show newest first'}</button>
      </div>
      <ol className="space-y-0">
        {list.map((v, idx) => (
          <li key={v.history_id}>
            <article className="rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-700">{formatDate(v.visit_date)}</p>
                  <h3 className="break-words text-base font-bold">{v.diagnosis}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="badge bg-brand-50 text-brand-800">Visit {v.position}{v.isHead ? ' (head)' : ''}{v.isTail ? ' (tail)' : ''}</span>
                  {canDelete && (
                    <button onClick={() => onDelete(v)} aria-label={`Delete visit on ${formatDate(v.visit_date)}`} className="rounded-lg p-1.5 text-critical hover:bg-critical-soft"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              </div>
              <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <div><dt className="inline text-muted">Treatment: </dt><dd className="inline break-words">{v.treatment}</dd></div>
                <div><dt className="inline text-muted">Doctor: </dt><dd className="inline">{v.doctor_name}</dd></div>
                {v.notes && <div className="sm:col-span-2"><dt className="inline text-muted">Notes: </dt><dd className="inline break-words">{v.notes}</dd></div>}
              </dl>
              <p className="mt-2 text-xs text-muted">next &rarr; {v.nextHistoryId ? `Visit ${v.position + 1}` : 'null (end of list)'}</p>
            </article>
            {idx < list.length - 1 && <div className="flex justify-center py-1 text-brand-600" aria-hidden="true"><ArrowDown className="h-4 w-4" /></div>}
          </li>
        ))}
      </ol>
    </div>
  );
}
