import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import { ErrorState, LoadingBlock } from '../components/Feedback';
import { patientsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { BLOOD_GROUPS, GENDERS } from '../utils/format';

const EMPTY = { patient_id: '', name: '', age: '', gender: 'Male', phone: '', email: '', address: '', blood_group: '' };

/** Client-side checks mirror the backend rules so users get instant feedback. */
function validate(f, isEdit) {
  const e = {};
  if (!isEdit) {
    if (!f.patient_id.trim()) e.patient_id = 'Patient ID is required.';
    else if (!/^[A-Za-z0-9-]{3,20}$/.test(f.patient_id.trim())) e.patient_id = 'Use 3-20 letters, numbers or hyphens (example: P1006).';
  }
  if (!f.name.trim()) e.name = 'Name is required.';
  const age = Number(f.age);
  if (f.age === '') e.age = 'Age is required.';
  else if (!Number.isInteger(age) || age < 0 || age > 120) e.age = 'Age must be a whole number between 0 and 120.';
  if (!f.phone.trim()) e.phone = 'Phone number is required.';
  else if (!/^\+?[0-9\s-]{7,15}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number (7-15 digits).';
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email address.';
  return e;
}

export default function PatientFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setLoadError('');
    (async () => {
      try {
        if (isEdit) {
          const r = await patientsApi.get(id);
          if (alive) setF({ ...EMPTY, ...Object.fromEntries(Object.entries(r.data).map(([k, v]) => [k, v ?? ''])) });
        } else {
          const r = await patientsApi.nextId();
          if (alive) setF({ ...EMPTY, patient_id: r.patient_id });
        }
      } catch (err) { if (alive) setLoadError(err.message); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id, isEdit]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const local = validate(f, isEdit);
    setErrors(local);
    if (Object.keys(local).length) { setFormError('Please correct the highlighted fields.'); return; }
    setBusy(true);
    try {
      const r = isEdit ? await patientsApi.update(id, f) : await patientsApi.create(f);
      toast.success(r.message);
      navigate(`/patients/${r.data.patient_id}`);
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setFormError(err.message);
    } finally { setBusy(false); }
  };

  return (
    <>
      <Link to={isEdit ? `/patients/${id}` : '/patients'} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back</Link>
      <PageHeader title={isEdit ? 'Edit patient' : 'Add patient'} subtitle={isEdit ? `Update the details of ${id}.` : 'Patient IDs must be unique.'} />
      <div className="card">
        {loading ? <LoadingBlock text="Loading..." rows={4} /> : loadError ? <ErrorState message={loadError} /> : (
          <form onSubmit={submit} noValidate className="card-pad space-y-4">
            {formError && <p role="alert" className="rounded-lg bg-critical-soft px-3 py-2 text-sm font-medium text-critical">{formError}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Patient ID" required value={f.patient_id} onChange={set('patient_id')} error={errors.patient_id} disabled={isEdit} hint={isEdit ? 'The ID cannot be changed.' : 'Suggested next ID - you can change it.'} />
              <FormField label="Full name" required value={f.name} onChange={set('name')} error={errors.name} autoComplete="off" />
              <FormField label="Age" required type="number" min="0" max="120" inputMode="numeric" value={f.age} onChange={set('age')} error={errors.age} />
              <FormField as="select" label="Gender" required value={f.gender} onChange={set('gender')} error={errors.gender} options={GENDERS} />
              <FormField label="Phone" required type="tel" value={f.phone} onChange={set('phone')} error={errors.phone} placeholder="+91 98765 43210" />
              <FormField label="Email" type="email" value={f.email} onChange={set('email')} error={errors.email} placeholder="optional" />
              <FormField as="select" label="Blood group" value={f.blood_group} onChange={set('blood_group')} error={errors.blood_group}
                options={[{ value: '', label: 'Not specified' }, ...BLOOD_GROUPS]} />
              <FormField as="textarea" label="Address" value={f.address} onChange={set('address')} className="sm:col-span-2" />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
              <Link to={isEdit ? `/patients/${id}` : '/patients'} className="btn-secondary">Cancel</Link>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving...' : isEdit ? 'Save changes' : 'Add patient'}</button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
