import { Link } from 'react-router-dom';
import { CalendarDays, Siren, Stethoscope, UserPlus, Users, CalendarPlus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { AsyncBoundary, EmptyState } from '../components/Feedback';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { useAsync } from '../hooks/useAsync';
import { dashboardApi } from '../services/api';
import { formatDate, waitingText } from '../utils/format';
import { useAuth } from '../context/AuthContext';

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="card card-pad flex items-center gap-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-6 w-6" aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const state = useAsync(() => dashboardApi.get());

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user.name}.`}>
        <Link to="/patients/new" className="btn-primary"><UserPlus className="h-4 w-4" aria-hidden="true" />Add Patient</Link>
        <Link to="/appointments?new=1" className="btn-secondary"><CalendarPlus className="h-4 w-4" aria-hidden="true" />New Appointment</Link>
        <Link to="/emergency" className="btn-secondary"><Siren className="h-4 w-4" aria-hidden="true" />View Emergency Queue</Link>
      </PageHeader>

      <AsyncBoundary state={state} loadingText="Loading dashboard..." rows={5}>
        {(res) => {
          const d = res.data;
          return (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat icon={Users} label="Total Patients" value={d.stats.totalPatients} tone="bg-brand-50 text-brand-700" />
                <Stat icon={CalendarDays} label="Today's Appointments" value={d.stats.todaysAppointments} tone="bg-normal-soft text-normal" />
                <Stat icon={Siren} label="Emergency Cases" value={d.stats.emergencyCases} tone="bg-critical-soft text-critical" />
                <Stat icon={Stethoscope} label="Doctors" value={d.stats.totalDoctors} tone="bg-success-soft text-success" />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <section className="card" aria-labelledby="recent-appts">
                  <h2 id="recent-appts" className="border-b border-line px-5 py-3.5 font-bold">Recent appointments</h2>
                  {d.recentAppointments.length === 0 ? <EmptyState title="No appointments yet." hint="Booked appointments will appear here." /> : (
                    <ul className="divide-y divide-line">
                      {d.recentAppointments.map((a) => (
                        <li key={a.appointment_id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{a.patient_name}</p>
                            <p className="text-sm text-muted">{a.doctor_name} &middot; {formatDate(a.appointment_date)} {a.appointment_time}</p>
                          </div>
                          <StatusBadge status={a.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="card" aria-labelledby="emerg-prev">
                  <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                    <h2 id="emerg-prev" className="font-bold">Emergency queue</h2>
                    <Link to="/emergency" className="text-sm font-semibold text-brand-700 hover:underline">Open queue</Link>
                  </div>
                  {d.emergencyPreview.length === 0 ? <EmptyState icon={Siren} title="No emergency patients waiting." /> : (
                    <ol className="divide-y divide-line">
                      {d.emergencyPreview.map((e) => (
                        <li key={e.queue_id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">#{e.rank} {e.patient_name}</p>
                            <p className="text-sm text-muted">Waiting {waitingText(e.waiting_minutes)}</p>
                          </div>
                          <PriorityBadge priority={e.priority} />
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>

              <section className="card" aria-labelledby="recent-pats">
                <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                  <h2 id="recent-pats" className="font-bold">Recent patients</h2>
                  <Link to="/patients" className="text-sm font-semibold text-brand-700 hover:underline">All patients</Link>
                </div>
                {d.recentPatients.length === 0 ? <EmptyState title="No patients found." /> : (
                  <ul className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
                    {d.recentPatients.map((p) => (
                      <li key={p.patient_id} className="px-5 py-3">
                        <Link to={`/patients/${p.patient_id}`} className="block rounded-lg hover:text-brand-700">
                          <p className="truncate font-semibold">{p.name}</p>
                          <p className="text-sm text-muted">{p.patient_id} &middot; {p.age} yrs &middot; {p.gender}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          );
        }}
      </AsyncBoundary>
    </>
  );
}
