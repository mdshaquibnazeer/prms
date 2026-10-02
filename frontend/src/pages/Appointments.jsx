import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, CalendarPlus, Pencil, PhoneCall, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { AppointmentFormModal } from '../components/RecordForms';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { EmptyState, ErrorState, LoadingBlock } from '../components/Feedback';
import { useAsync } from '../hooks/useAsync';
import { appointmentsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { can } from '../utils/permissions';
import { formatDate } from '../utils/format';

const TABS = [
  { id: 'today', label: "Today's appointments", empty: 'No appointments today.' },
  { id: 'upcoming', label: 'Upcoming', empty: 'No upcoming appointments.' },
  { id: 'all', label: 'All', empty: 'No appointments found.' },
];

export default function Appointments() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('today');
  const [modal, setModal] = useState(params.get('new') ? { appointment: null } : null);
  const [toDelete, setToDelete] = useState(null);
  const [serving, setServing] = useState(false);

  useEffect(() => { if (params.get('new')) setParams({}, { replace: true }); }, []); // eslint-disable-line

  const list = useAsync(() => appointmentsApi.list({ scope: tab }), [tab]);
  const queue = useAsync(() => appointmentsApi.queue());
  const refresh = () => { list.reload({ silent: true }); queue.reload({ silent: true }); };

  const serveNext = async () => {
    setServing(true);
    try { const r = await appointmentsApi.serveNext(); toast.success(r.message); refresh(); }
    catch (err) { toast.error(err.message); }
    finally { setServing(false); }
  };
  const doDelete = async () => {
    try { await appointmentsApi.remove(toDelete.appointment_id); toast.success('Appointment deleted.'); setToDelete(null); refresh(); }
    catch (err) { toast.error(err.message); setToDelete(null); }
  };

  const columns = [
    { key: 'patient_name', header: 'Patient', primary: true, render: (r) => `${r.patient_name} (${r.patient_id})` },
    { key: 'doctor_name', header: 'Doctor' },
    { key: 'appointment_date', header: 'Date', render: (r) => formatDate(r.appointment_date) },
    { key: 'appointment_time', header: 'Time' },
    { key: 'priority', header: 'Priority', render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];
  const q = queue.data?.data;

  return (
    <>
      <PageHeader title="Appointments" subtitle="Book and manage appointments. Normal appointments are served first-come, first-served.">
        <button className="btn-primary" onClick={() => setModal({ appointment: null })}><CalendarPlus className="h-4 w-4" aria-hidden="true" />New Appointment</button>
      </PageHeader>

      <section className="card mb-5" aria-labelledby="fifo-title">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
          <div>
            <h2 id="fifo-title" className="font-bold">Normal appointment queue (FIFO)</h2>
            <p className="text-xs text-muted">Today's Normal appointments in booking order. Enqueue, Dequeue and Peek are all O(1).</p>
          </div>
          <button className="btn-primary btn-sm" onClick={serveNext} disabled={serving || !q || q.size === 0}><PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />{serving ? 'Calling...' : 'Serve next patient'}</button>
        </div>
        <div className="p-4 sm:p-5">
          {queue.loading && !q ? <LoadingBlock text="Loading queue..." rows={1} />
            : queue.error && !q ? <ErrorState message={queue.error} onRetry={queue.reload} />
            : q.size === 0 ? <p className="text-sm text-muted">No normal appointments are waiting today.</p>
            : (
              <ol className="flex gap-3 overflow-x-auto pb-1">
                {q.items.map((a) => (
                  <li key={a.appointment_id} className={`min-w-[170px] shrink-0 rounded-lg border p-3 ${a.position === 1 ? 'border-brand-600 bg-brand-50' : 'border-line'}`}>
                    <p className="text-xs font-semibold text-muted">{a.position === 1 ? 'Front (next)' : `Position ${a.position}`}</p>
                    <p className="truncate font-semibold">{a.patient_name}</p>
                    <p className="text-xs text-muted">{a.appointment_time} &middot; {a.doctor_name}</p>
                  </li>
                ))}
              </ol>
            )}
        </div>
      </section>

      <div role="tablist" aria-label="Appointment lists" className="mb-3 flex gap-1 overflow-x-auto rounded-lg bg-white p-1 shadow-card ring-1 ring-line sm:w-fit">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-semibold ${tab === t.id ? 'bg-brand-600 text-white' : 'text-ink hover:bg-brand-50'}`}>{t.label}</button>
        ))}
      </div>

      <section className="card" aria-label="Appointment list">
        {list.loading && !list.data ? <LoadingBlock text="Loading appointments..." rows={4} />
          : list.error && !list.data ? <ErrorState message={list.error} onRetry={list.reload} />
          : list.data.data.length === 0 ? <EmptyState icon={CalendarDays} title={TABS.find((t) => t.id === tab).empty} hint="Use New Appointment to book one." />
          : <DataTable columns={columns} rows={list.data.data} rowKey={(r) => r.appointment_id} caption="Appointments"
              actions={(r) => (
                <>
                  <button className="btn-secondary btn-sm" onClick={() => setModal({ appointment: r })} aria-label={`Edit appointment of ${r.patient_name}`}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Edit</button>
                  {can(user.role, 'appointments.delete') && <button className="btn-secondary btn-sm !text-critical" onClick={() => setToDelete(r)} aria-label={`Delete appointment of ${r.patient_name}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Delete</button>}
                </>
              )} />}
      </section>

      {modal && <AppointmentFormModal appointment={modal.appointment} onClose={() => setModal(null)} onSaved={() => { setModal(null); refresh(); }} />}
      {toDelete && <ConfirmDialog title="Delete appointment?" message={`Remove the appointment of ${toDelete.patient_name} on ${formatDate(toDelete.appointment_date)} at ${toDelete.appointment_time}?`} onClose={() => setToDelete(null)} onConfirm={doDelete} />}
    </>
  );
}
