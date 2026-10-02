import { useEffect, useState } from 'react';
import { Siren, UserPlus, Play, GitBranch } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { PriorityBadge } from '../components/Badges';
import { EmptyState, ErrorState, LoadingBlock } from '../components/Feedback';
import { useAsync } from '../hooks/useAsync';
import { emergencyApi, patientsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { waitingText, formatDateTime } from '../utils/format';

const BORDER = { 1: 'border-l-critical', 2: 'border-l-emergency', 3: 'border-l-normal' };

function AddModal({ onClose, onSaved }) {
  const toast = useToast();
  const patients = useAsync(() => patientsApi.list());
  const [f, setF] = useState({ patient_id: '', priority: '1', reason: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErrors({}); setFormError('');
    try { const r = await emergencyApi.add(f); toast.success(r.message); onSaved(); }
    catch (err) { setErrors(err.fieldErrors || {}); setFormError(err.message); }
    finally { setBusy(false); }
  };
  return (
    <Modal title="Add emergency patient" onClose={onClose}
      footer={<><button className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" form="em-form" className="btn-primary" disabled={busy || patients.loading}>{busy ? 'Adding...' : 'Add to queue'}</button></>}>
      <form id="em-form" onSubmit={submit} noValidate className="space-y-4">
        {(formError || patients.error) && <p role="alert" className="rounded-lg bg-critical-soft px-3 py-2 text-sm font-medium text-critical">{formError || patients.error}</p>}
        <FormField as="select" label="Patient" required value={f.patient_id} onChange={set('patient_id')} error={errors.patient_id} disabled={patients.loading}
          options={[{ value: '', label: patients.loading ? 'Loading patients...' : 'Select a patient' }, ...(patients.data?.data || []).map((p) => ({ value: p.patient_id, label: `${p.patient_id} - ${p.name}` }))]} />
        <FormField as="select" label="Priority" required value={f.priority} onChange={set('priority')} error={errors.priority}
          hint="Lower number = higher urgency." options={[{ value: '1', label: '1 - Critical' }, { value: '2', label: '2 - Emergency' }, { value: '3', label: '3 - Normal' }]} />
        <FormField label="Reason (optional)" value={f.reason} onChange={set('reason')} maxLength={200} placeholder="e.g. Chest pain" />
      </form>
    </Modal>
  );
}

export default function EmergencyQueue() {
  const toast = useToast();
  const state = useAsync(() => emergencyApi.queue());
  const [adding, setAdding] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [banner, setBanner] = useState('');

  // Waiting times grow, so quietly refresh every 30 seconds.
  useEffect(() => {
    const t = setInterval(() => state.reload({ silent: true }), 30000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line

  const processNext = async () => {
    setProcessing(true);
    try {
      const r = await emergencyApi.processNext();
      setBanner(r.message); toast.success(r.message);
      state.reload({ silent: true });
    } catch (err) { toast.error(err.message); state.reload({ silent: true }); }
    finally { setProcessing(false); }
  };

  const q = state.data?.data;

  return (
    <>
      <PageHeader title="Emergency Queue" subtitle="A Priority Queue (binary min-heap) decides who is seen first: Critical, then Emergency, then Normal.">
        <button className="btn-secondary" onClick={() => setAdding(true)}><UserPlus className="h-4 w-4" aria-hidden="true" />Add Emergency Patient</button>
        <button className="btn-primary" onClick={processNext} disabled={processing || !q || q.size === 0}><Play className="h-4 w-4" aria-hidden="true" />{processing ? 'Processing...' : 'Process Next Patient'}</button>
      </PageHeader>

      {banner && <p role="status" className="mb-4 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">{banner}</p>}

      <section className="card" aria-label="Waiting patients">
        {state.loading && !q ? <LoadingBlock text="Loading emergency queue..." rows={3} />
          : state.error && !q ? <ErrorState message={state.error} onRetry={state.reload} />
          : q.size === 0 ? <EmptyState icon={Siren} title="No emergency patients waiting." hint="Add an emergency patient to see the priority queue in action." />
          : (
            <ol className="space-y-3 p-4 sm:p-5">
              {q.items.map((e) => (
                <li key={e.queue_id} className={`rounded-lg border border-line border-l-4 p-4 ${BORDER[e.priority]} ${e.rank === 1 ? 'bg-brand-50/50' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base font-bold">#{e.rank} {e.patient_name}{e.rank === 1 && <span className="ml-2 text-xs font-semibold text-brand-700">Next to be processed</span>}</p>
                      <p className="text-sm text-muted">{e.patient_id} &middot; {e.age} yrs &middot; {e.gender}</p>
                    </div>
                    <PriorityBadge priority={e.priority} />
                  </div>
                  <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <div><dt className="inline text-muted">Priority: </dt><dd className="inline font-semibold">{e.priority} ({e.priority_label})</dd></div>
                    <div><dt className="inline text-muted">Waiting: </dt><dd className="inline font-semibold">{waitingText(e.waiting_minutes)}</dd></div>
                    {e.reason && <div className="min-w-0"><dt className="inline text-muted">Reason: </dt><dd className="inline break-words">{e.reason}</dd></div>}
                  </dl>
                </li>
              ))}
            </ol>
          )}
      </section>

      {q && q.size > 0 && (
        <section className="card mt-5" aria-labelledby="heap-title">
          <h2 id="heap-title" className="flex items-center gap-2 border-b border-line px-5 py-3.5 font-bold"><GitBranch className="h-4 w-4 text-brand-700" aria-hidden="true" />Inside the heap</h2>
          <div className="p-4 sm:p-5">
            <p className="text-sm text-muted">The waiting list lives in a binary min-heap array. Index 0 is always the most urgent patient. Insert and Extract cost O(log n), Peek costs O(1).</p>
            <ol className="mt-3 flex flex-wrap gap-2">
              {q.structure.heapArray.map((h, i) => (
                <li key={i} className="rounded-lg border border-line px-3 py-1.5 text-sm"><span className="mr-1.5 text-xs text-muted">[{i}]</span>{h.name} <span className="font-semibold">({h.priority})</span></li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {q && q.recentlyProcessed.length > 0 && (
        <section className="card mt-5" aria-labelledby="done-title">
          <h2 id="done-title" className="border-b border-line px-5 py-3.5 font-bold">Recently processed</h2>
          <ul className="divide-y divide-line">
            {q.recentlyProcessed.map((e) => (
              <li key={e.queue_id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span className="min-w-0"><span className="font-semibold">{e.patient_name}</span> <span className="text-muted">({e.patient_id})</span></span>
                <span className="flex items-center gap-2 text-muted"><PriorityBadge priority={e.priority} />{formatDateTime(e.processed_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {adding && <AddModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); state.reload({ silent: true }); }} />}
    </>
  );
}
