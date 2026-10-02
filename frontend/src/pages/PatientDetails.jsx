import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, ClipboardPlus, Pencil, Pill, CalendarDays } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { AsyncBoundary, EmptyState, ErrorState, LoadingBlock } from '../components/Feedback';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import HistoryTimeline from '../components/HistoryTimeline';
import ConfirmDialog from '../components/ConfirmDialog';
import { AppointmentFormModal, HistoryFormModal, PrescriptionFormModal } from '../components/RecordForms';
import { useAsync } from '../hooks/useAsync';
import { historyApi, patientsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { can } from '../utils/permissions';
import { formatDate, formatDateTime } from '../utils/format';

const Field = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-xs text-muted">{label}</dt>
    <dd className="break-words font-medium">{value || '-'}</dd>
  </div>
);

function Section({ title, icon: Icon, children, action }) {
  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
        <h2 className="flex items-center gap-2 font-bold"><Icon className="h-4 w-4 text-brand-700" aria-hidden="true" />{title}</h2>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export default function PatientDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const clinical = can(user.role, 'history.access');

  const patient = useAsync(() => patientsApi.get(id), [id]);
  const history = useAsync(() => (clinical ? patientsApi.history(id) : Promise.resolve(null)), [id]);
  const rx = useAsync(() => (clinical ? patientsApi.prescriptions(id) : Promise.resolve(null)), [id]);
  const appts = useAsync(() => patientsApi.appointments(id), [id]);

  const [modal, setModal] = useState(null); // 'appointment' | 'history' | 'rx'
  const [delVisit, setDelVisit] = useState(null);

  if (patient.loading && !patient.data) return <LoadingBlock text="Loading patient..." rows={4} />;
  if (patient.error) return (
    <div className="card"><ErrorState message={patient.error} onRetry={patient.reload} /><div className="pb-6 text-center"><Link to="/patients" className="btn-secondary">Back to patients</Link></div></div>
  );
  const p = patient.data.data;

  const removeVisit = async () => {
    try { await historyApi.remove(delVisit.history_id); toast.success('Medical history record deleted.'); setDelVisit(null); history.reload({ silent: true }); }
    catch (err) { toast.error(err.message); setDelVisit(null); }
  };

  return (
    <>
      <Link to="/patients" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All patients</Link>
      <PageHeader title={p.name} subtitle={`Patient ${p.patient_id}`}>
        <button className="btn-secondary" onClick={() => navigate(`/patients/${p.patient_id}/edit`)}><Pencil className="h-4 w-4" aria-hidden="true" />Edit Patient</button>
        <button className="btn-secondary" onClick={() => setModal('appointment')}><CalendarPlus className="h-4 w-4" aria-hidden="true" />New Appointment</button>
        {clinical && <button className="btn-secondary" onClick={() => setModal('history')}><ClipboardPlus className="h-4 w-4" aria-hidden="true" />Add Medical History</button>}
        {clinical && <button className="btn-secondary" onClick={() => setModal('rx')}><Pill className="h-4 w-4" aria-hidden="true" />Add Prescription</button>}
      </PageHeader>

      <div className="space-y-5">
        <section className="card card-pad" aria-label="Patient details">
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field label="Patient ID" value={p.patient_id} />
            <Field label="Name" value={p.name} />
            <Field label="Age" value={`${p.age} years`} />
            <Field label="Gender" value={p.gender} />
            <Field label="Blood Group" value={p.blood_group} />
            <Field label="Phone" value={p.phone} />
            <Field label="Email" value={p.email} />
            <Field label="Address" value={p.address} />
          </dl>
          <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
            Loaded with <b>{patient.data.meta.lookup.algorithm}</b> ({patient.data.meta.lookup.complexity}).
          </p>
        </section>

        {clinical && (
          <Section title="Medical History" icon={ClipboardPlus}>
            <AsyncBoundary state={history} loadingText="Loading medical history..." rows={3}>
              {(r) => <HistoryTimeline visits={r.data.visits} canDelete onDelete={setDelVisit} />}
            </AsyncBoundary>
          </Section>
        )}

        <Section title="Appointments" icon={CalendarDays}>
          <AsyncBoundary state={appts} loadingText="Loading appointments..." rows={2}>
            {(r) => r.data.length === 0 ? <EmptyState icon={CalendarDays} title="No appointments yet." hint="Use New Appointment to book one." /> : (
              <ul className="divide-y divide-line">
                {[...r.data].reverse().map((a) => (
                  <li key={a.appointment_id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="font-semibold">{formatDate(a.appointment_date)} at {a.appointment_time}</p>
                      <p className="text-sm text-muted">{a.doctor_name}</p>
                    </div>
                    <div className="flex gap-1.5"><PriorityBadge priority={a.priority} /><StatusBadge status={a.status} /></div>
                  </li>
                ))}
              </ul>
            )}
          </AsyncBoundary>
        </Section>

        {clinical && (
          <Section title="Prescriptions" icon={Pill}>
            <AsyncBoundary state={rx} loadingText="Loading prescriptions..." rows={2}>
              {(r) => r.data.length === 0 ? <EmptyState icon={Pill} title="No prescriptions yet." /> : (
                <ul className="divide-y divide-line">
                  {r.data.map((x) => (
                    <li key={x.prescription_id} className="py-3">
                      <p className="font-semibold">{x.medicine} <span className="font-normal text-muted">- {x.dosage}</span></p>
                      <p className="text-sm text-muted">{x.duration} &middot; {x.doctor_name} &middot; {formatDateTime(x.created_at)}</p>
                      {x.instructions && <p className="mt-1 break-words text-sm">{x.instructions}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </AsyncBoundary>
          </Section>
        )}
      </div>

      {modal === 'appointment' && <AppointmentFormModal patientId={p.patient_id} onClose={() => setModal(null)} onSaved={() => { setModal(null); appts.reload({ silent: true }); }} />}
      {modal === 'history' && <HistoryFormModal patientId={p.patient_id} onClose={() => setModal(null)} onSaved={() => { setModal(null); history.reload({ silent: true }); }} />}
      {modal === 'rx' && <PrescriptionFormModal patientId={p.patient_id} onClose={() => setModal(null)} onSaved={() => { setModal(null); rx.reload({ silent: true }); }} />}
      {delVisit && <ConfirmDialog title="Delete this visit?" message={`The visit "${delVisit.diagnosis}" on ${formatDate(delVisit.visit_date)} will be removed from the history list.`} onClose={() => setDelVisit(null)} onConfirm={removeVisit} />}
    </>
  );
}
