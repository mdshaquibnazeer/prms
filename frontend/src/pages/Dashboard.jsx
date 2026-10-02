import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarDays, Siren, Stethoscope, UserPlus, Users, CalendarPlus,
  ShieldCheck, Building2, CheckCircle, XCircle, ArrowRight, X, Clock, Award, AlertCircle
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { AsyncBoundary, EmptyState } from '../components/Feedback';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { useAsync } from '../hooks/useAsync';
import { dashboardApi, adminApi, hospitalsApi, doctorsApi, appointmentsApi, patientsApi } from '../services/api';
import { formatDate, waitingText } from '../utils/format';
import { useAuth } from '../context/AuthContext';

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="card card-pad flex items-center gap-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const state = useAsync(() => dashboardApi.get());

  // Admin Specific States
  const [doctorStats, setDoctorStats] = useState([]);
  const [pendingHospitals, setPendingHospitals] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminActionMsg, setAdminActionMsg] = useState('');

  // Patient Quick Book Modal State
  const [showPatientPrompt, setShowPatientPrompt] = useState(false);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [bookHosp, setBookHosp] = useState('');
  const [bookDoc, setBookDoc] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('10:00');
  const [bookPriority, setBookPriority] = useState(3);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [patientRecord, setPatientRecord] = useState(null);
  const [dismissIncomplete, setDismissIncomplete] = useState(false);

  useEffect(() => {
    if (user?.role === 'patient' && searchParams.get('welcome') === 'patient') {
      setShowPatientPrompt(true);
    }
  }, [user, searchParams]);

  useEffect(() => {
    if (user?.role === 'admin') {
      setAdminLoading(true);
      Promise.all([adminApi.doctorStats(), adminApi.approvals()])
        .then(([statsRes, appRes]) => {
          setDoctorStats(statsRes.data || []);
          setPendingHospitals(appRes.data?.hospitals || []);
        })
        .catch((err) => console.error('Admin data load error:', err))
        .finally(() => setAdminLoading(false));
    }

    if (user?.role === 'patient') {
      hospitalsApi.listPublic().then((res) => {
        setHospitalsList(res.data || []);
        if (res.data?.length > 0) setBookHosp(res.data[0].hospital_id);
      });
      doctorsApi.list().then((res) => {
        setAvailableDocs(res.data || []);
        if (res.data?.length > 0) setBookDoc(res.data[0].doctor_id);
      });
      if (user.patient_id) {
        patientsApi.get(user.patient_id)
          .then((res) => setPatientRecord(res.data))
          .catch(() => {});
      }
    }
  }, [user]);

  const handleHospitalApproval = async (id, status) => {
    try {
      await adminApi.setApprovalStatus('hospital', id, status);
      setAdminActionMsg(`Hospital ${id} status set to ${status}.`);
      const appRes = await adminApi.approvals();
      setPendingHospitals(appRes.data?.hospitals || []);
    } catch (err) {
      alert(err.message || 'Failed to update approval status.');
    }
  };

  const handlePatientQuickBook = async (e) => {
    e.preventDefault();
    if (!bookDoc || !bookDate) {
      alert('Please choose a doctor and appointment date.');
      return;
    }
    setBookingBusy(true);
    try {
      await appointmentsApi.create({
        patient_id: user.patient_id || 'P1001',
        doctor_id: bookDoc,
        appointment_date: bookDate,
        appointment_time: bookTime,
        priority: Number(bookPriority),
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setShowPatientPrompt(false);
        state.reload();
      }, 1500);
    } catch (err) {
      alert(err.message || 'Booking failed.');
    } finally {
      setBookingBusy(false);
    }
  };

  const missingProfileFields = [];
  if (user?.role === 'patient') {
    const curEmail = patientRecord?.email || user?.email;
    const curPhone = patientRecord?.phone || user?.phone;
    const curBlood = patientRecord?.blood_group;
    const curAddress = patientRecord?.address;

    if (!curEmail) missingProfileFields.push('Email');
    if (!curPhone) missingProfileFields.push('Phone Number');
    if (!curBlood) missingProfileFields.push('Blood Group');
    if (!curAddress) missingProfileFields.push('Address');
  }
  const totalProfileFields = 4;
  const completedProfileFields = totalProfileFields - missingProfileFields.length;
  const profileCompletionPct = Math.round((completedProfileFields / totalProfileFields) * 100);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome, ${user.name} (${user.role.toUpperCase()}${user.hospital_name ? ` · ${user.hospital_name}` : ''}).`}
      >
        {user.role !== 'patient' && (
          <Link to="/patients/new" className="btn-primary">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add Patient
          </Link>
        )}
        <Link to="/appointments?new=1" className="btn-secondary">
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Book Appointment
        </Link>
        <Link to="/emergency" className="btn-secondary">
          <Siren className="h-4 w-4" aria-hidden="true" />
          Emergency Queue
        </Link>
      </PageHeader>

      {/* PATIENT SKIPPABLE WELCOME PROMPT MODAL */}
      {showPatientPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowPatientPrompt(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              title="Skip for now"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                <CalendarPlus className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Welcome to Patient Portal</h3>
                <p className="text-xs text-slate-500">Would you like to book an appointment now? (Skippable)</p>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center text-emerald-800">
                <CheckCircle className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                <p className="font-bold">Appointment Booked Successfully!</p>
                <p className="text-xs text-emerald-600 mt-1">Directing you to your dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handlePatientQuickBook} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Hospital</label>
                  <select
                    className="input w-full"
                    value={bookHosp}
                    onChange={(e) => setBookHosp(e.target.value)}
                  >
                    {hospitalsList.map((h) => (
                      <option key={h.hospital_id} value={h.hospital_id}>
                        {h.name} ({h.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Doctor</label>
                  <select
                    className="input w-full"
                    value={bookDoc}
                    onChange={(e) => setBookDoc(e.target.value)}
                  >
                    {availableDocs.map((d) => (
                      <option key={d.doctor_id} value={d.doctor_id}>
                        {d.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      className="input w-full"
                      value={bookDate}
                      onChange={(e) => setBookDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                    <input
                      type="time"
                      className="input w-full"
                      value={bookTime}
                      onChange={(e) => setBookTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
                  <select
                    className="input w-full"
                    value={bookPriority}
                    onChange={(e) => setBookPriority(e.target.value)}
                  >
                    <option value="3">Normal (Standard FIFO Queue)</option>
                    <option value="2">Emergency (Priority Queue)</option>
                    <option value="1">Critical (Highest Priority Min-Heap)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPatientPrompt(false)}
                    className="btn-ghost text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Skip &amp; Explore Records
                  </button>
                  <button
                    type="submit"
                    disabled={bookingBusy}
                    className="btn-primary py-2 px-5 text-xs font-semibold"
                  >
                    {bookingBusy ? 'Booking...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PATIENT INCOMPLETE PROFILE NOTIFICATION BANNER / BUBBLE */}
      {user.role === 'patient' && missingProfileFields.length > 0 && !dismissIncomplete && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/80 p-4 sm:p-5 shadow-xs relative overflow-hidden animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="relative shrink-0 mt-0.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                  <AlertCircle className="h-6 w-6" />
                </span>
                {/* Glowing Notification Bubble Badge */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] font-extrabold text-white items-center justify-center shadow-xs">
                    !
                  </span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Profile Incomplete Notice
                  </h4>
                  <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5">
                    {profileCompletionPct}% Completed
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  You registered with minimal details. Missing: <strong className="text-amber-900">{missingProfileFields.join(', ')}</strong>. Completing your profile ensures seamless hospital transfers, emergency queue prioritization, and verified records.
                </p>

                {/* Micro Progress Bar */}
                <div className="mt-2.5 w-full max-w-xs bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletionPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                type="button"
                onClick={() => setDismissIncomplete(true)}
                className="text-xs text-slate-500 hover:text-slate-700 py-1.5 px-2.5 rounded-lg"
              >
                Dismiss
              </button>
              <Link
                to={user.patient_id ? `/patients/${user.patient_id}/edit` : '/patients'}
                className="btn-primary text-xs py-2 px-4 font-semibold bg-amber-600 hover:bg-amber-700 shadow-sm whitespace-nowrap"
              >
                Complete Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MAIN ADMIN SUPERPANEL */}
      {user.role === 'admin' && (
        <div className="space-y-6 mb-6">
          {/* Admin Pending Approvals Notification */}
          {pendingHospitals.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-amber-700" />
                <h3 className="font-bold text-amber-900 text-base">
                  Pending Hospital Registrations ({pendingHospitals.length})
                </h3>
              </div>
              <p className="text-xs text-amber-800 mb-3">
                The 10 initial hospital slots have been exceeded. The following hospitals have submitted registration requests for your approval:
              </p>
              <div className="space-y-2">
                {pendingHospitals.map((h) => (
                  <div key={h.hospital_id} className="bg-white rounded-xl p-3 border border-amber-200/60 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{h.name}</span>
                      <span className="text-xs text-slate-500 ml-2">({h.city}) &middot; {h.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleHospitalApproval(h.hospital_id, 'approved')}
                        className="btn-primary btn-sm bg-emerald-600 hover:bg-emerald-700 text-xs py-1 px-3"
                      >
                        Approve Hospital
                      </button>
                      <button
                        onClick={() => handleHospitalApproval(h.hospital_id, 'rejected')}
                        className="btn-secondary btn-sm text-red-600 text-xs py-1 px-3"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminActionMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              {adminActionMsg}
            </div>
          )}

          {/* DOCTOR PERFORMANCE & STATS ACROSS HOSPITALS */}
          <div className="card card-pad">
            <div className="flex items-center justify-between mb-4 border-b border-line pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-brand-600" />
                  Doctor Performance &amp; Hospital Statistics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live metrics for each registered doctor across all affiliated hospitals.
                </p>
              </div>
              <Link to="/doctors" className="text-xs font-semibold text-brand-700 hover:underline">
                Manage Doctors &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Hospital</th>
                    <th>Specialization</th>
                    <th>Total Appts</th>
                    <th>Patients Seen</th>
                    <th>Completed</th>
                    <th>History Logged</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorStats.map((doc) => (
                    <tr key={doc.doctor_id}>
                      <td>
                        <div className="font-semibold text-slate-900">{doc.doctor_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{doc.doctor_id} &middot; {doc.email}</div>
                      </td>
                      <td>
                        <div className="font-medium text-slate-800">{doc.hospital_name}</div>
                        <div className="text-[11px] text-slate-400">{doc.hospital_city}</div>
                      </td>
                      <td className="text-xs font-medium text-slate-700">{doc.specialization}</td>
                      <td className="font-semibold text-slate-800 tabular-nums">{doc.total_appointments}</td>
                      <td className="font-semibold text-slate-800 tabular-nums">{doc.total_patients_treated}</td>
                      <td className="text-xs font-medium text-emerald-700 tabular-nums">{doc.completed_appointments}</td>
                      <td className="text-xs text-slate-600 tabular-nums">{doc.medical_records_logged}</td>
                      <td>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          {doc.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {doctorStats.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-6 text-slate-400">
                        {adminLoading ? 'Loading doctor performance data...' : 'No doctor statistics available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CORE STATS OVERVIEW */}
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
