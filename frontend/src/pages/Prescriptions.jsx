import { useState } from 'react';
import { Pill, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { PrescriptionFormModal } from '../components/RecordForms';
import { EmptyState, ErrorState, LoadingBlock } from '../components/Feedback';
import FormField from '../components/FormField';
import { useAsync } from '../hooks/useAsync';
import { patientsApi, prescriptionsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';

export default function Prescriptions() {
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const [adding, setAdding] = useState(false);
  const [del, setDel] = useState(null);
  const patients = useAsync(() => patientsApi.list());
  const list = useAsync(() => prescriptionsApi.all());

  const rows = (list.data?.data || []).filter((r) => !filter || r.patient_id === filter);
  const remove = async () => {
    try { await prescriptionsApi.remove(del.prescription_id); toast.success('Prescription deleted.'); setDel(null); list.reload({ silent: true }); }
    catch (err) { toast.error(err.message); setDel(null); }
  };

  const columns = [
    { key: 'medicine', header: 'Medicine', primary: true },
    { key: 'patient_name', header: 'Patient', render: (r) => `${r.patient_name} (${r.patient_id})` },
    { key: 'dosage', header: 'Dosage' },
    { key: 'duration', header: 'Duration' },
    { key: 'instructions', header: 'Instructions', render: (r) => r.instructions || '-', hideOnTablet: true },
    { key: 'doctor_name', header: 'Doctor' },
    { key: 'created_at', header: 'Date', render: (r) => formatDate(String(r.created_at).slice(0, 10)) },
  ];

  return (
    <>
      <PageHeader title="Prescriptions" subtitle="Medicines prescribed to patients.">
        <button className="btn-primary" onClick={() => setAdding(true)} disabled={patients.loading}><Plus className="h-4 w-4" aria-hidden="true" />Add Prescription</button>
      </PageHeader>

      <section className="card card-pad mb-4">
        <FormField as="select" label="Filter by patient" value={filter} onChange={(e) => setFilter(e.target.value)} disabled={patients.loading}
          options={[{ value: '', label: 'All patients' }, ...(patients.data?.data || []).map((p) => ({ value: p.patient_id, label: `${p.patient_id} - ${p.name}` }))]} />
      </section>

      <section className="card" aria-label="Prescription list">
        {list.loading && !list.data ? <LoadingBlock text="Loading prescriptions..." rows={4} />
          : list.error && !list.data ? <ErrorState message={list.error} onRetry={list.reload} />
          : rows.length === 0 ? <EmptyState icon={Pill} title="No prescriptions found." hint="Add a prescription to see it here." />
          : <DataTable columns={columns} rows={rows} rowKey={(r) => r.prescription_id} caption="Prescriptions"
              actions={(r) => <button className="btn-secondary btn-sm !text-critical" onClick={() => setDel(r)} aria-label={`Delete prescription ${r.medicine}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Delete</button>} />}
      </section>

      {adding && <PrescriptionFormModal patients={patients.data?.data || []} patientId={filter || undefined} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); list.reload({ silent: true }); }} />}
      {del && <ConfirmDialog title="Delete prescription?" message={`Remove ${del.medicine} prescribed to ${del.patient_name}?`} onClose={() => setDel(null)} onConfirm={remove} />}
    </>
  );
}
