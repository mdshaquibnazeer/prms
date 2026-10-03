import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Search, Trash2, UserPlus, Users, Info, Building2, ShieldAlert } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { ErrorState, EmptyState, LoadingBlock } from '../components/Feedback';
import { PriorityBadge } from '../components/Badges';
import { useAsync, useDebounced } from '../hooks/useAsync';
import { patientsApi, hospitalsApi } from '../services/api';
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
  const [adminTab, setAdminTab] = useState('all'); // 'all', 'no_hospital', 'no_email', 'no_phone', 'hospital_stats'
  const [hospitals, setHospitals] = useState([]);

  const debouncedSearch = useDebounced(q.search, 300);
  const set = (k) => (e) => setQ({ ...q, [k]: e.target.value });

  const params = { ...q, search: debouncedSearch };
  const state = useAsync(() => patientsApi.list(params), [params.search, q.by, q.algorithm, q.sort, q.order]);

  useEffect(() => {
    if (user?.role === 'admin') {
      hospitalsApi.listPublic().then((res) => setHospitals(res.data || [])).catch(() => {});
    }
  }, [user]);

  const meta = state.data?.meta;
  const rows = state.data?.data || [];

  const withoutHospitalCount = rows.filter((p) => !p.hospital_id || p.hospital_name === 'No Hospital').length;
  const withoutEmailCount = rows.filter((p) => !p.email).length;
  const withoutPhoneCount = rows.filter((p) => !p.phone).length;
  const withHospitalCount = rows.length - withoutHospitalCount;

  let displayRows = rows;
  if (user?.role === 'admin') {
    if (adminTab === 'no_hospital') {
      displayRows = rows.filter((p) => !p.hospital_id || p.hospital_name === 'No Hospital');
    } else if (adminTab === 'no_email') {
      displayRows = rows.filter((p) => !p.email);
    } else if (adminTab === 'no_phone') {
      displayRows = rows.filter((p) => !p.phone);
    }
  }

  const hospitalStatsMap = {};
  hospitals.forEach((h) => {
    hospitalStatsMap[h.hospital_id] = {
      id: h.hospital_id,
      name: h.name,
      city: h.city,
      count: 0,
    };
  });
  rows.forEach((p) => {
    if (p.hospital_id && hospitalStatsMap[p.hospital_id]) {
      hospitalStatsMap[p.hospital_id].count += 1;
    }
  });
  const hospitalStatsList = Object.values(hospitalStatsMap);

  const doDelete = async () => {
    try {
      await patientsApi.remove(toDelete.patient_id);
      toast.success(`Patient ${toDelete.name} deleted.`);
      setToDelete(null);
      state.reload({ silent: true });
    } catch (err) { toast.error(err.message); setToDelete(null); }
  };

  const adminColumns = [
    { key: 'patient_id', header: 'Patient ID', primary: true },
    { key: 'name', header: 'Patient Name' },
    {
      key: 'email',
      header: 'Email',
      render: (r) => r.email ? (
        <span className="text-slate-700">{r.email}</span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          No Email
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone Number',
      render: (r) => r.phone ? (
        <span className="font-mono text-slate-700">{r.phone}</span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          No Phone
        </span>
      ),
    },
    {
      key: 'hospital_name',
      header: 'Hospital Attached',
      render: (r) => (r.hospital_name && r.hospital_name !== 'No Hospital') ? (
        <span className="font-semibold text-brand-700">{r.hospital_name}</span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          No Hospital
        </span>
      ),
    },
  ];

  const standardColumns = [
    { key: 'patient_id', header: 'Patient ID', primary: true },
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age' },
    { key: 'gender', header: 'Gender' },
    { key: 'blood_group', header: 'Blood Group', render: (r) => r.blood_group || '-', hideOnTablet: true },
    { key: 'phone', header: 'Phone' },
    { key: 'hospital_name', header: 'Hospital', render: (r) => r.hospital_name || 'No Hospital' },
    { key: 'next_appointment_date', header: 'Next appt.', render: (r) => formatDate(r.next_appointment_date), hideOnTablet: true },
    { key: 'top_priority', header: 'Priority', render: (r) => (r.top_priority ? <PriorityBadge priority={r.top_priority} /> : '-'), hideOnTablet: true },
  ];

  const columns = user?.role === 'admin' ? adminColumns : standardColumns;

  return (
    <>
      <PageHeader
        title={user?.role === 'admin' ? 'Patient Network & Statistics' : 'Patients'}
        subtitle={user?.role === 'admin' ? 'Administrative directory of registered patients, contact health, and hospital affiliations.' : 'Search, sort and manage patient records.'}
      >
        {user?.role !== 'admin' && (
          <Link to="/patients/new" className="btn-primary">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add Patient
          </Link>
        )}
      </PageHeader>

      {/* ADMIN STATS & TABS */}
      {user?.role === 'admin' && (
        <div className="space-y-4 mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Registered</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{rows.length}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
              <span className="text-xs text-emerald-700 font-medium">With Hospital</span>
              <p className="text-xl font-bold text-emerald-800 mt-0.5">{withHospitalCount}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
              <span className="text-xs text-amber-700 font-medium">Without Hospital</span>
              <p className="text-xl font-bold text-amber-800 mt-0.5">{withoutHospitalCount}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
              <span className="text-xs text-orange-700 font-medium">Without Email</span>
              <p className="text-xl font-bold text-orange-800 mt-0.5">{withoutEmailCount}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
              <span className="text-xs text-red-700 font-medium">Without Phone</span>
              <p className="text-xl font-bold text-red-800 mt-0.5">{withoutPhoneCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
            <button
              onClick={() => setAdminTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                adminTab === 'all'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Patients ({rows.length})
            </button>
            <button
              onClick={() => setAdminTab('no_hospital')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                adminTab === 'no_hospital'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Without Hospital ({withoutHospitalCount})
            </button>
            <button
              onClick={() => setAdminTab('no_email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                adminTab === 'no_email'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Without Email ({withoutEmailCount})
            </button>
            <button
              onClick={() => setAdminTab('no_phone')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                adminTab === 'no_phone'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Without Phone ({withoutPhoneCount})
            </button>
            <button
              onClick={() => setAdminTab('hospital_stats')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                adminTab === 'hospital_stats'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Hospital Distribution Stats
            </button>
          </div>
        </div>
      )}

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

      {user?.role === 'admin' && adminTab === 'hospital_stats' ? (
        <section className="card card-pad" aria-label="Hospital distribution breakdown">
          <h3 className="font-bold text-base text-slate-900 mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            Hospital Network Patient Registration Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>Location</th>
                  <th>Hospital ID</th>
                  <th>Registered Patients</th>
                  <th>Distribution Share</th>
                </tr>
              </thead>
              <tbody>
                {hospitalStatsList.map((h) => {
                  const share = rows.length > 0 ? Math.round((h.count / rows.length) * 100) : 0;
                  return (
                    <tr key={h.id}>
                      <td className="font-bold text-slate-900">{h.name}</td>
                      <td className="text-slate-600">{h.city}</td>
                      <td className="font-mono text-xs text-slate-500">{h.id}</td>
                      <td className="font-bold tabular-nums text-slate-800">{h.count} patients</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${share}%` }}></div>
                          </div>
                          <span className="text-xs text-slate-600 font-medium">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-200">
                  <td className="text-slate-900">Unassigned / No Hospital</td>
                  <td className="text-slate-500">-</td>
                  <td className="text-slate-400 font-mono text-xs">-</td>
                  <td className="text-amber-800 tabular-nums">{withoutHospitalCount} patients</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${rows.length > 0 ? Math.round((withoutHospitalCount / rows.length) * 100) : 0}%` }}></div>
                      </div>
                      <span className="text-xs text-slate-600 font-medium">{rows.length > 0 ? Math.round((withoutHospitalCount / rows.length) * 100) : 0}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="card" aria-label="Patient list">
          {state.loading && !state.data ? <LoadingBlock text="Loading patients..." rows={5} />
            : state.error && !state.data ? <ErrorState message={state.error} onRetry={state.reload} />
            : displayRows.length === 0 ? <EmptyState icon={Users} title="No patients found in this category." hint={q.search ? 'Try a different search term or tab.' : 'No patients match this statistical filter.'} />
            : (
              <DataTable columns={columns} rows={displayRows} rowKey={(r) => r.patient_id} caption="Patients"
                actions={(r) => (
                  <>
                    <button className="btn-secondary btn-sm" onClick={() => navigate(`/patients/${r.patient_id}`)} aria-label={`View ${r.name}`}><Eye className="h-3.5 w-3.5" aria-hidden="true" />View</button>
                    {user?.role !== 'admin' && (
                      <button className="btn-secondary btn-sm" onClick={() => navigate(`/patients/${r.patient_id}/edit`)} aria-label={`Edit ${r.name}`}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Edit</button>
                    )}
                    {can(user.role, 'patients.delete') && <button className="btn-secondary btn-sm !text-critical" onClick={() => setToDelete(r)} aria-label={`Delete ${r.name}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Delete</button>}
                  </>
                )} />
            )}
        </section>
      )}

      {toDelete && (
        <ConfirmDialog title="Delete patient?" confirmLabel="Delete patient" onClose={() => setToDelete(null)} onConfirm={doDelete}
          message={`This permanently deletes ${toDelete.name} (${toDelete.patient_id}) together with their appointments, medical history and prescriptions. This cannot be undone.`} />
      )}
    </>
  );
}
