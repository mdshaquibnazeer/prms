import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import BarChart from '../components/BarChart';
import FormField from '../components/FormField';
import { ErrorState, LoadingBlock } from '../components/Feedback';
import { useAsync } from '../hooks/useAsync';
import { doctorsApi, reportsApi } from '../services/api';

const Card = ({ title, children, note }) => (
  <section className="card">
    <h2 className="border-b border-line px-5 py-3.5 font-bold">{title}</h2>
    <div className="p-4 sm:p-5">{children}{note && <p className="mt-3 text-xs text-muted">{note}</p>}</div>
  </section>
);

export default function Reports() {
  const [f, setF] = useState({ from: '', to: '', doctor_id: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const doctors = useAsync(() => doctorsApi.list());
  const state = useAsync(() => reportsApi.get(f), [f.from, f.to, f.doctor_id]);
  const r = state.data?.data;
  const filtered = f.from || f.to || f.doctor_id;
  const PRIORITY_COLORS = { Critical: 'bg-critical', Emergency: 'bg-emergency', Normal: 'bg-normal' };
  const withColor = (rows) => rows.map((x) => ({ ...x, color: PRIORITY_COLORS[x.label] }));

  return (
    <>
      <PageHeader title="Reports" subtitle="Simple summaries of patients, appointments and emergencies." />
      <section className="card card-pad mb-5" aria-label="Report filters">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Appointments from" type="date" value={f.from} onChange={set('from')} />
          <FormField label="Appointments to" type="date" value={f.to} onChange={set('to')} />
          <FormField as="select" label="Doctor" value={f.doctor_id} onChange={set('doctor_id')}
            options={[{ value: '', label: 'All doctors' }, ...(doctors.data?.data || []).map((d) => ({ value: d.doctor_id, label: d.name }))]} />
          <div className="flex items-end"><button className="btn-secondary w-full" onClick={() => setF({ from: '', to: '', doctor_id: '' })} disabled={!filtered}>Clear filters</button></div>
        </div>
        <p className="mt-2 text-xs text-muted">Filters apply to the appointment-based reports. Patient totals always cover all patients.</p>
      </section>

      {state.loading && !r ? <div className="card"><LoadingBlock text="Loading reports..." rows={4} /></div>
        : state.error && !r ? <div className="card"><ErrorState message={state.error} onRetry={state.reload} /></div>
        : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card card-pad"><p className="text-sm text-muted">Total Patients</p><p className="text-3xl font-bold tabular-nums">{r.totalPatients}</p></div>
              <div className="card card-pad"><p className="text-sm text-muted">Appointments {filtered ? '(filtered)' : '(all time)'}</p><p className="text-3xl font-bold tabular-nums">{r.totalAppointments}</p></div>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card title="Patients by age group"><BarChart data={r.patientsByAge} /></Card>
              <Card title="Patients by gender"><BarChart data={r.patientsByGender} color="bg-normal" /></Card>
              <Card title="Appointments by status"><BarChart data={r.appointmentsByStatus} color="bg-success" /></Card>
              <Card title="Doctor-wise appointments"><BarChart data={r.doctorWiseAppointments} color="bg-brand-600" emptyText="No appointments for these filters." /></Card>
              <Card title="Emergency cases - appointments by priority" note="Counts booked appointments with priority Critical, Emergency or Normal."><BarChart data={withColor(r.emergencyCases.appointmentsByPriority)} /></Card>
              <Card title="Emergency queue entries (all time)" note="Everyone who has ever been added to the emergency queue."><BarChart data={withColor(r.emergencyCases.queueEntriesByPriority)} /></Card>
            </div>
          </div>
        )}
    </>
  );
}
