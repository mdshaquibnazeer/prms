import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Search, Trash2, UserPlus, Users, Info } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { ErrorState, EmptyState, LoadingBlock } from '../components/Feedback';
import { PriorityBadge } from '../components/Badges';
import { useAsync, useDebounced } from '../hooks/useAsync';
import { patientsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { can } from '../utils/permissions';
import { formatDate } from '../utils/format';

const SORTS = [
  { value: 'patient_id', label: 'Patient ID' }, { value: 'name', label: 'Name' }, { value: 'age', label: 'Age' },
  { value: 'appointment_date', label: 'Appointment Date' }, { value: 'priority', label: 'Priority' },
];

export default function Patients() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState({ search: '', by: 'id', algorithm: 'auto', sort: 'patient_id', order: 'asc' });
  const [toDelete, setToDelete] = useState(null);
  const debouncedSearch = useDebounced(q.search, 300);
  const set = (k) => (e) => setQ({ ...q, [k]: e.target.value });

  const params = { ...q, search: debouncedSearch };
  const state = useAsync(() => patientsApi.list(params), [params.search, q.by, q.algorithm, q.sort, q.order]);

  const meta = state.data?.meta;
  const rows = state.data?.data || [];

  const doDelete = async () => {
    try {
      await patientsApi.remove(toDelete.patient_id);
      toast.success(`Patient ${toDelete.name} deleted.`);
      setToDelete(null);
      state.reload({ silent: true });
    } catch (err) { toast.error(err.message); setToDelete(null); }
  };

  const columns = [
    { key: 'patient_id', header: 'Patient ID', primary: true },
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age' },
    { key: 'gender', header: 'Gender' },
    { key: 'blood_group', header: 'Blood Group', render: (r) => r.blood_group || '-', hideOnTablet: true },
    { key: 'phone', header: 'Phone' },
    { key: 'next_appointment_date', header: 'Next appt.', render: (r) => formatDate(r.next_appointment_date), hideOnTablet: true },
    { key: 'top_priority', header: 'Priority', render: (r) => (r.top_priority ? <PriorityBadge priority={r.top_priority} /> : '-'), hideOnTablet: true },
  ];

  return (
    <>
      <PageHeader title="Patients" subtitle="Search, sort and manage patient records.">
        <Link to="/patients/new" className="btn-primary"><UserPlus className="h-4 w-4" aria-hidden="true" />Add Patient</Link>
      </PageHeader>

      <section className="card card-pad mb-4" aria-label="Search and sort">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="p-search" className="label">Search patients</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input id="p-search" className="input pl-9" placeholder={q.by === 'id' ? 'e.g. P1001' : q.by === 'name' ? 'e.g. Sara' : 'e.g. 98765'} value={q.search} onChange={set('search')} />
            </div>
          </div>
          <div>
            <label htmlFor="p-by" className="label">Search by</label>
            <select id="p-by" className="input" value={q.by} onChange={set('by')}>
              <option value="id">Patient ID</option><option value="name">Name</option><option value="phone">Phone</option>
            </select>
          </div>
          <div>
            <label htmlFor="p-algo" className="label">Search algorithm</label>
            <select id="p-algo" className="input" value={q.algorithm} onChange={set('algorithm')}>
              <option value="auto">Automatic</option>
              <option value="hash" disabled={q.by !== 'id'}>Hash Map (ID only)</option>
              <option value="linear">Linear Search</option>
              <option value="binary">Binary Search (exact)</option>
            </select>
          </div>
          <div>
            <label htmlFor="p-sort" className="label">Sort by (Merge Sort)</label>
            <select id="p-sort" className="input" value={q.sort} onChange={set('sort')}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="p-order" className="label">Order</label>
            <select id="p-order" className="input" value={q.order} onChange={set('order')}>
              <option value="asc">Ascending</option><option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {meta && (
          <p className="mt-3 flex flex-wrap items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800" aria-live="polite">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {meta.search
                ? <>Algorithm: <b>{meta.search.algorithm}</b> &middot; {meta.search.found ? 'Patient Found' : 'No match'} &middot; Time complexity: <b>{meta.search.complexity}</b> &middot; Comparisons: {meta.search.comparisons}{meta.search.sortComparisons ? ` (+${meta.search.sortComparisons} to sort first)` : ''}. </>
                : <>No search text, so all {meta.total} patients are shown. </>}
              Sorted with <b>{meta.sort.algorithm}</b> ({meta.sort.complexity}, {meta.sort.comparisons} comparisons).
            </span>
          </p>
        )}
      </section>

      <section className="card" aria-label="Patient list">
        {state.loading && !state.data ? <LoadingBlock text="Loading patients..." rows={5} />
          : state.error && !state.data ? <ErrorState message={state.error} onRetry={state.reload} />
          : rows.length === 0 ? <EmptyState icon={Users} title="No patients found." hint={q.search ? 'Try a different search term, field or algorithm.' : 'Add your first patient to get started.'} action={!q.search && <Link to="/patients/new" className="btn-primary">Add Patient</Link>} />
          : (
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.patient_id} caption="Patients"
              actions={(r) => (
                <>
                  <button className="btn-secondary btn-sm" onClick={() => navigate(`/patients/${r.patient_id}`)} aria-label={`View ${r.name}`}><Eye className="h-3.5 w-3.5" aria-hidden="true" />View</button>
                  <button className="btn-secondary btn-sm" onClick={() => navigate(`/patients/${r.patient_id}/edit`)} aria-label={`Edit ${r.name}`}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Edit</button>
                  {can(user.role, 'patients.delete') && <button className="btn-secondary btn-sm !text-critical" onClick={() => setToDelete(r)} aria-label={`Delete ${r.name}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Delete</button>}
                </>
              )} />
          )}
      </section>

      {toDelete && (
        <ConfirmDialog title="Delete patient?" confirmLabel="Delete patient" onClose={() => setToDelete(null)} onConfirm={doDelete}
          message={`This permanently deletes ${toDelete.name} (${toDelete.patient_id}) together with their appointments, medical history and prescriptions. This cannot be undone.`} />
      )}
    </>
  );
}
