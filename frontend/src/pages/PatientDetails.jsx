import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CalendarPlus, ClipboardPlus, Pencil, Pill, CalendarDays,
  Building2, CheckCircle2, Bell, Send, ShieldCheck
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { AsyncBoundary, EmptyState, ErrorState, LoadingBlock } from '../components/Feedback';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import HistoryTimeline from '../components/HistoryTimeline';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import { AppointmentFormModal, HistoryFormModal, PrescriptionFormModal } from '../components/RecordForms';
import { useAsync } from '../hooks/useAsync';
import { historyApi, patientsApi, hospitalsApi } from '../services/api';
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
  const isAdmin = user?.role === 'admin';
  const clinical = !isAdmin && can(user.role, 'history.access');

  const patient = useAsync(() => patientsApi.get(id), [id]);
  const history = useAsync(() => (clinical ? patientsApi.history(id) : Promise.resolve(null)), [id, clinical]);
  const rx = useAsync(() => (clinical ? patientsApi.prescriptions(id) : Promise.resolve(null)), [id, clinical]);
  const appts = useAsync(() => (!isAdmin ? patientsApi.appointments(id) : Promise.resolve({ data: [] })), [id, isAdmin]);

  const [modal, setModal] = useState(null); // 'appointment' | 'history' | 'rx'
  const [delVisit, setDelVisit] = useState(null);

  // Hospital Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [targetHosp, setTargetHosp] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);

  // Hospital Send Notification Modal State
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyBusy, setNotifyBusy] = useState(false);

  useEffect(() => {
    hospitalsApi.listPublic().then((res) => {
      setHospitalsList(res.data || []);
      if (res.data?.length > 0) setTargetHosp(res.data[0].hospital_id);
    });
  }, []);

  if (patient.loading && !patient.data) return <LoadingBlock text="Loading patient..." rows={4} />;
  if (patient.error) return (
    <div className="card"><ErrorState message={patient.error} onRetry={patient.reload} /><div className="pb-6 text-center"><Link to="/patients" className="btn-secondary">Back to patients</Link></div></div>
  );
  const p = patient.data.data;

  const removeVisit = async () => {
    try { await historyApi.remove(delVisit.history_id); toast.success('Medical history record deleted.'); setDelVisit(null); history.reload({ silent: true }); }
    catch (err) { toast.error(err.message); setDelVisit(null); }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!targetHosp) return;
    setTransferBusy(true);
    try {
      await patientsApi.transferHospital(p.patient_id, targetHosp);
      toast.success('Patient care successfully transferred to new hospital!');
      setShowTransferModal(false);
      patient.reload({ silent: true });
    } catch (err) {
      toast.error(err.message || 'Hospital transfer failed.');
    } finally {
      setTransferBusy(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifyTitle.trim() || !notifyMessage.trim()) {
      toast.error('Please enter both title and message.');
      return;
    }
    setNotifyBusy(true);
    try {
      await patientsApi.notify(p.patient_id, {
        title: notifyTitle.trim(),
        message: notifyMessage.trim(),
      });
      toast.success(`Notification delivered to ${p.name}!`);
      setShowNotifyModal(false);
      setNotifyTitle('');
      setNotifyMessage('');
    } catch (err) {
      toast.error(err.message || 'Failed to send notification.');
    } finally {
      setNotifyBusy(false);
    }
  };

  const missingInPatient = [];
  if (!p.email) missingInPatient.push('Email');
  if (!p.phone) missingInPatient.push('Phone Number');
  if (!p.blood_group) missingInPatient.push('Blood Group');
  if (!p.address) missingInPatient.push('Address');

  const hospitalDisplayName = p.hospital_name && p.hospital_name !== 'No Hospital' ? p.hospital_name : 'No Hospital';

  return (
    <>
      <Link to="/patients" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All patients
      </Link>
      <PageHeader title={p.name} subtitle={`Patient ID: ${p.patient_id} · Hospital: ${hospitalDisplayName}`}>
        {isAdmin ? (
          <Link to="/patients" className="btn-secondary">
            Back to Patients &amp; Tabs
          </Link>
        ) : (
          <>
            {user.role === 'hospital' && (
              <button className="btn-primary" onClick={() => setShowNotifyModal(true)}>
                <Bell className="h-4 w-4" aria-hidden="true" />
                Send Notification
              </button>
            )}
            <button className="btn-secondary" onClick={() => setShowTransferModal(true)}>
              <Building2 className="h-4 w-4 text-brand-600" aria-hidden="true" />Transfer Hospital
            </button>
            <button className="btn-secondary" onClick={() => navigate(`/patients/${p.patient_id}/edit`)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />Edit Patient
            </button>
            <button className="btn-secondary" onClick={() => setModal('appointment')}>
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />New Appointment
            </button>
            {clinical && <button className="btn-secondary" onClick={() => setModal('history')}><ClipboardPlus className="h-4 w-4" aria-hidden="true" />Add Medical History</button>}
            {clinical && <button className="btn-secondary" onClick={() => setModal('rx')}><Pill className="h-4 w-4" aria-hidden="true" />Add Prescription</button>}
          </>
        )}
      </PageHeader>

      <div className="space-y-5">
        {missingInPatient.length > 0 && !isAdmin && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div>
                <strong className="text-xs font-bold text-amber-900">Incomplete Profile Notice:</strong>
                <span className="text-xs text-amber-800 ml-1.5">
                  Missing: {missingInPatient.join(', ')}. Complete these details for full patient records.
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/patients/${p.patient_id}/edit`)}
              className="btn-primary text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-700 whitespace-nowrap"
            >
              Complete Details
            </button>
          </div>
        )}

        {/* Patient Administrative Info Card */}
        <section className="card card-pad" aria-label="Patient details">
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field label="Patient ID" value={p.patient_id} />
            <Field label="Name" value={p.name} />
            <Field label="Hospital Attached" value={hospitalDisplayName} />
            <Field label="Phone" value={p.phone || 'No Phone Number'} />
            <Field label="Email" value={p.email || 'No Email'} />
            <Field label="Age" value={p.age ? `${p.age} years` : '-'} />
            <Field label="Gender" value={p.gender} />
            <Field label="Blood Group" value={p.blood_group} />
            <Field label="Address" value={p.address} />
          </dl>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
            <span>Lookup Algorithm: <b>{patient.data.meta.lookup.algorithm}</b> ({patient.data.meta.lookup.complexity}).</span>
            <span className="font-semibold text-brand-700">Network Hospital Linkage: {hospitalDisplayName}</span>
          </div>
        </section>

        {/* ADMIN PRIVACY & CLINICAL RESTRICTION NOTICE */}
        {isAdmin ? (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 text-slate-700 shadow-xs">
            <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 text-sm">
              <ShieldCheck className="h-5 w-5 text-brand-600" />
              Executive Administrative View &middot; Medical History Confidentiality Policy
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with hospital data governance and patient confidentiality regulations, executive administrators only possess access to administrative registration parameters (Patient ID, Name, Email, Phone Number, and Hospital Affiliation). Clinical medical history records, diagnostic entries, appointment queues, and prescriptions are strictly restricted to authorized treating doctors and affiliated hospital personnel.
            </p>
          </div>
        ) : (
          <>
            {clinical && (
              <Section title="Medical History" icon={ClipboardPlus}>
                <AsyncBoundary state={history} loadingText="Loading medical history..." rows={3}>
                  {(r) => <HistoryTimeline visits={r?.data?.visits || []} canDelete onDelete={setDelVisit} />}
                </AsyncBoundary>
              </Section>
            )}

            <Section title="Appointments" icon={CalendarDays}>
              <AsyncBoundary state={appts} loadingText="Loading appointments..." rows={2}>
                {(r) => (!r?.data || r.data.length === 0) ? (
                  <EmptyState icon={CalendarDays} title="No appointments yet." hint="Use New Appointment to book one." />
                ) : (
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
                  {(r) => (!r?.data || r.data.length === 0) ? (
                    <EmptyState icon={Pill} title="No prescriptions yet." />
                  ) : (
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
          </>
        )}
      </div>

      {/* HOSPITAL NOTIFICATION MODAL */}
      {showNotifyModal && (
        <Modal
          title={`Send Notification to ${p.name}`}
          onClose={() => setShowNotifyModal(false)}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setShowNotifyModal(false)}>Cancel</button>
              <button type="submit" form="notify-form" className="btn-primary" disabled={notifyBusy}>
                {notifyBusy ? 'Delivering...' : 'Send Notification'}
              </button>
            </>
          }
        >
          <form id="notify-form" onSubmit={handleSendNotification} className="space-y-4">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900">
              This message will be instantly delivered to <strong>{p.name}</strong>’s patient portal dashboard.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notification Subject / Title</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g. Follow-up Checkup Scheduled"
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
              <textarea
                className="input w-full min-h-[100px]"
                placeholder="Write your hospital announcement, instruction, or reminder for the patient..."
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                required
              ></textarea>
            </div>
          </form>
        </Modal>
      )}

      {/* HOSPITAL TRANSFER MODAL */}
      {showTransferModal && (
        <Modal
          title="Transfer Hospital / Change Primary Care"
          onClose={() => setShowTransferModal(false)}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setShowTransferModal(false)}>Cancel</button>
              <button type="submit" form="transfer-form" className="btn-primary" disabled={transferBusy}>
                {transferBusy ? 'Transferring...' : 'Confirm Hospital Transfer'}
              </button>
            </>
          }
        >
          <form id="transfer-form" onSubmit={handleTransferSubmit} className="space-y-4">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3.5 text-xs text-blue-900">
              <strong className="block text-sm mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Cross-Hospital History Portability
              </strong>
              Transferring will update your active care center to the chosen hospital. All your past medical history visits, diagnoses, and prescriptions will remain safely linked and immediately accessible to doctors at the new hospital.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Destination Hospital</label>
              <select
                className="input w-full"
                value={targetHosp}
                onChange={(e) => setTargetHosp(e.target.value)}
                required
              >
                {hospitalsList.map((h) => (
                  <option key={h.hospital_id} value={h.hospital_id}>
                    {h.name} ({h.city})
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'appointment' && <AppointmentFormModal patientId={p.patient_id} onClose={() => setModal(null)} onSaved={() => { setModal(null); appts.reload({ silent: true }); }} />}
      {modal === 'history' && <HistoryFormModal patientId={p.patient_id} onClose={() => setModal(null)} onSaved={() => { setModal(null); history.reload({ silent: true }); }} />}
      {modal === 'rx' && <PrescriptionFormModal patientId={p.patient_id} onClose={() => setModal(null)} onSaved={() => { setModal(null); rx.reload({ silent: true }); }} />}
      {delVisit && <ConfirmDialog title="Delete this visit?" message={`The visit "${delVisit.diagnosis}" on ${formatDate(delVisit.visit_date)} will be removed from the history list.`} onClose={() => setDelVisit(null)} onConfirm={removeVisit} />}
    </>
  );
}
