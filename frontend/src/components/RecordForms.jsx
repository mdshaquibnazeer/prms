import { useState } from 'react';
import Modal from './Modal';
import FormField from './FormField';
import { LoadingBlock } from './Feedback';
import { useAsync } from '../hooks/useAsync';
import { appointmentsApi, doctorsApi, patientsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { STATUSES, todayStr } from '../utils/format';

/** Shared submit logic: runs `save`, shows server field errors, toasts success. */
function useSubmit(save, successMsg, onDone) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({}); setFormError('');
    try {
      const r = await save();
      toast.success(r?.message || successMsg);
      onDone(r);
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setFormError(err.message);
    } finally { setBusy(false); }
  };
  return { busy, errors, formError, submit };
}

const FormShell = ({ title, onClose, submit, busy, formError, submitLabel, children, wide }) => (
  <Modal title={title} onClose={onClose} wide={wide}
    footer={<>
      <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
      <button type="submit" form="record-form" className="btn-primary" disabled={busy}>{busy ? 'Saving...' : submitLabel}</button>
    </>}>
    <form id="record-form" onSubmit={submit} noValidate className="space-y-4">
      {formError && <p role="alert" className="rounded-lg bg-critical-soft px-3 py-2 text-sm font-medium text-critical">{formError}</p>}
      {children}
    </form>
  </Modal>
);

const doctorOptions = (doctors) => [{ value: '', label: 'Select a doctor' }, ...doctors.map((d) => ({ value: d.doctor_id, label: `${d.name} - ${d.specialization}` }))];

export function AppointmentFormModal({ appointment, patientId, onClose, onSaved }) {
  const isEdit = !!appointment;
  const doctors = useAsync(() => doctorsApi.list());
  const patients = useAsync(() => (patientId ? Promise.resolve(null) : patientsApi.list()));
  const [f, setF] = useState({
    patient_id: appointment?.patient_id || patientId || '',
    doctor_id: appointment?.doctor_id || '',
    appointment_date: appointment?.appointment_date || todayStr(),
    appointment_time: appointment?.appointment_time || '09:00',
    priority: String(appointment?.priority || 3),
    status: appointment?.status || 'Pending',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const { busy, errors, formError, submit } = useSubmit(
    () => (isEdit ? appointmentsApi.update(appointment.appointment_id, f) : appointmentsApi.create(f)),
    isEdit ? 'Appointment updated.' : 'Appointment booked.', (r) => onSaved(r)
  );
  const loading = doctors.loading || patients.loading;

  return (
    <FormShell title={isEdit ? 'Edit appointment' : 'New appointment'} onClose={onClose} submit={submit} busy={busy || loading} formError={formError || doctors.error || patients.error} submitLabel={isEdit ? 'Save changes' : 'Book appointment'} wide>
      {loading ? <LoadingBlock text="Loading doctors and patients..." rows={3} /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {patientId ? (
            <FormField label="Patient" value={patientId} disabled readOnly />
          ) : (
            <FormField as="select" label="Patient" required value={f.patient_id} onChange={set('patient_id')} error={errors.patient_id}
              options={[{ value: '', label: 'Select a patient' }, ...(patients.data?.data || []).map((p) => ({ value: p.patient_id, label: `${p.patient_id} - ${p.name}` }))]} />
          )}
          <FormField as="select" label="Doctor" required value={f.doctor_id} onChange={set('doctor_id')} error={errors.doctor_id} options={doctorOptions(doctors.data?.data || [])} />
          <FormField label="Date" type="date" required value={f.appointment_date} onChange={set('appointment_date')} error={errors.appointment_date} />
          <FormField label="Time" type="time" required value={f.appointment_time} onChange={set('appointment_time')} error={errors.appointment_time} />
          <FormField as="select" label="Priority" value={f.priority} onChange={set('priority')} error={errors.priority}
            hint="Critical and Emergency appointments booked for today also join the emergency queue."
            options={[{ value: '3', label: 'Normal (3)' }, { value: '2', label: 'Emergency (2)' }, { value: '1', label: 'Critical (1)' }]} />
          <FormField as="select" label="Status" value={f.status} onChange={set('status')} error={errors.status} options={STATUSES} />
        </div>
      )}
    </FormShell>
  );
}

export function HistoryFormModal({ patientId, onClose, onSaved }) {
  const doctors = useAsync(() => doctorsApi.list());
  const [f, setF] = useState({ doctor_id: '', visit_date: todayStr(), diagnosis: '', treatment: '', notes: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const { busy, errors, formError, submit } = useSubmit(() => patientsApi.addHistory(patientId, f), 'Medical history added.', onSaved);
  return (
    <FormShell title={`Add medical history - ${patientId}`} onClose={onClose} submit={submit} busy={busy || doctors.loading} formError={formError || doctors.error} submitLabel="Save visit" wide>
      {doctors.loading ? <LoadingBlock text="Loading doctors..." rows={2} /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Visit date" type="date" required value={f.visit_date} onChange={set('visit_date')} error={errors.visit_date} />
          <FormField as="select" label="Doctor" required value={f.doctor_id} onChange={set('doctor_id')} error={errors.doctor_id} options={doctorOptions(doctors.data?.data || [])} />
          <FormField label="Diagnosis" required value={f.diagnosis} onChange={set('diagnosis')} error={errors.diagnosis} className="sm:col-span-2" />
          <FormField label="Treatment" required value={f.treatment} onChange={set('treatment')} error={errors.treatment} className="sm:col-span-2" />
          <FormField as="textarea" label="Notes" value={f.notes} onChange={set('notes')} className="sm:col-span-2" />
        </div>
      )}
    </FormShell>
  );
}

export function PrescriptionFormModal({ patientId, patients, onClose, onSaved }) {
  const doctors = useAsync(() => doctorsApi.list());
  const [pid, setPid] = useState(patientId || '');
  const [f, setF] = useState({ doctor_id: '', medicine: '', dosage: '', duration: '', instructions: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const { busy, errors, formError, submit } = useSubmit(async () => {
    if (!pid) throw Object.assign(new Error('Choose a patient.'), { fieldErrors: { patient: 'Choose a patient.' } });
    return patientsApi.addPrescription(pid, f);
  }, 'Prescription added.', onSaved);
  return (
    <FormShell title={patientId ? `Add prescription - ${patientId}` : 'Add prescription'} onClose={onClose} submit={submit} busy={busy || doctors.loading} formError={formError || doctors.error} submitLabel="Save prescription" wide>
      {doctors.loading ? <LoadingBlock text="Loading doctors..." rows={2} /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {!patientId && (
            <FormField as="select" label="Patient" required value={pid} onChange={(e) => setPid(e.target.value)} error={errors.patient}
              options={[{ value: '', label: 'Select a patient' }, ...(patients || []).map((p) => ({ value: p.patient_id, label: `${p.patient_id} - ${p.name}` }))]} />
          )}
          <FormField as="select" label="Doctor" required value={f.doctor_id} onChange={set('doctor_id')} error={errors.doctor_id} options={doctorOptions(doctors.data?.data || [])} />
          <FormField label="Medicine" required value={f.medicine} onChange={set('medicine')} error={errors.medicine} />
          <FormField label="Dosage" required value={f.dosage} onChange={set('dosage')} error={errors.dosage} placeholder="e.g. 500 mg twice daily" />
          <FormField label="Duration" required value={f.duration} onChange={set('duration')} error={errors.duration} placeholder="e.g. 5 days" />
          <FormField as="textarea" label="Instructions" value={f.instructions} onChange={set('instructions')} className="sm:col-span-2" />
        </div>
      )}
    </FormShell>
  );
}

export { useSubmit, FormShell };
