import { useState } from 'react';
import { Eye, Pencil, Stethoscope, Trash2, UserPlus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import { FormShell, useSubmit } from '../components/RecordForms';
import { EmptyState, ErrorState, LoadingBlock } from '../components/Feedback';
import { useAsync } from '../hooks/useAsync';
import { doctorsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { can } from '../utils/permissions';

function DoctorForm({ doctor, onClose, onSaved }) {
  const isEdit = !!doctor;
  const [f, setF] = useState({ doctor_id: doctor?.doctor_id || '', name: doctor?.name || '', specialization: doctor?.specialization || '', phone: doctor?.phone || '', email: doctor?.email || '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const { busy, errors, formError, submit } = useSubmit(() => (isEdit ? doctorsApi.update(doctor.doctor_id, f) : doctorsApi.create(f)), 'Doctor saved.', onSaved);
  return (
    <FormShell title={isEdit ? 'Edit doctor' : 'Add doctor'} onClose={onClose} submit={submit} busy={busy} formError={formError} submitLabel={isEdit ? 'Save changes' : 'Add doctor'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Doctor ID" required value={f.doctor_id} onChange={set('doctor_id')} error={errors.doctor_id} disabled={isEdit} placeholder="D004" />
        <FormField label="Name" required value={f.name} onChange={set('name')} error={errors.name} />
        <FormField label="Specialization" required value={f.specialization} onChange={set('specialization')} error={errors.specialization} className="sm:col-span-2" />
        <FormField label="Phone" type="tel" value={f.phone} onChange={set('phone')} error={errors.phone} />
        <FormField label="Email" type="email" value={f.email} onChange={set('email')} error={errors.email} />
      </div>
    </FormShell>
  );
}

export default function Doctors() {
  const { user } = useAuth();
  const toast = useToast();
  const manage = can(user.role, 'doctors.manage');
  const state = useAsync(() => doctorsApi.list());
  const [form, setForm] = useState(null);   // { doctor } to add/edit
  const [view, setView] = useState(null);
  const [del, setDel] = useState(null);

  const remove = async () => {
    try { await doctorsApi.remove(del.doctor_id); toast.success('Doctor deleted.'); setDel(null); state.reload({ silent: true }); }
    catch (err) { toast.error(err.message); setDel(null); }
  };

  const columns = [
    { key: 'doctor_id', header: 'Doctor ID', primary: true },
    { key: 'name', header: 'Name' },
    { key: 'specialization', header: 'Specialization' },
    { key: 'phone', header: 'Phone', render: (r) => r.phone || '-' },
    { key: 'email', header: 'Email', render: (r) => <span className="break-all">{r.email || '-'}</span> },
  ];

  return (
    <>
      <PageHeader title="Doctors" subtitle="Doctors available at the hospital.">
        {manage && <button className="btn-primary" onClick={() => setForm({ doctor: null })}><UserPlus className="h-4 w-4" aria-hidden="true" />Add Doctor</button>}
      </PageHeader>
      <section className="card" aria-label="Doctor list">
        {state.loading && !state.data ? <LoadingBlock text="Loading doctors..." rows={3} />
          : state.error && !state.data ? <ErrorState message={state.error} onRetry={state.reload} />
          : state.data.data.length === 0 ? <EmptyState icon={Stethoscope} title="No doctors found." />
          : <DataTable columns={columns} rows={state.data.data} rowKey={(r) => r.doctor_id} caption="Doctors"
              actions={(r) => (
                <>
                  <button className="btn-secondary btn-sm" onClick={() => setView(r)} aria-label={`View ${r.name}`}><Eye className="h-3.5 w-3.5" aria-hidden="true" />View</button>
                  {manage && <button className="btn-secondary btn-sm" onClick={() => setForm({ doctor: r })} aria-label={`Edit ${r.name}`}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Edit</button>}
                  {manage && <button className="btn-secondary btn-sm !text-critical" onClick={() => setDel(r)} aria-label={`Delete ${r.name}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Delete</button>}
                </>
              )} />}
      </section>

      {form && <DoctorForm doctor={form.doctor} onClose={() => setForm(null)} onSaved={() => { setForm(null); state.reload({ silent: true }); }} />}
      {view && (
        <Modal title={view.name} onClose={() => setView(null)} footer={<button className="btn-secondary" onClick={() => setView(null)}>Close</button>}>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs text-muted">Doctor ID</dt><dd className="font-medium">{view.doctor_id}</dd></div>
            <div><dt className="text-xs text-muted">Specialization</dt><dd className="font-medium">{view.specialization}</dd></div>
            <div><dt className="text-xs text-muted">Phone</dt><dd className="font-medium">{view.phone || '-'}</dd></div>
            <div className="min-w-0"><dt className="text-xs text-muted">Email</dt><dd className="break-all font-medium">{view.email || '-'}</dd></div>
          </dl>
        </Modal>
      )}
      {del && <ConfirmDialog title="Delete doctor?" message={`Delete ${del.name}? Doctors that already have appointments, history or prescriptions cannot be deleted.`} onClose={() => setDel(null)} onConfirm={remove} />}
    </>
  );
}
