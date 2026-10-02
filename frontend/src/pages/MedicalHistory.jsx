import { useState } from 'react';
import { ClipboardPlus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import HistoryTimeline from '../components/HistoryTimeline';
import ConfirmDialog from '../components/ConfirmDialog';
import { HistoryFormModal } from '../components/RecordForms';
import { EmptyState, ErrorState, LoadingBlock } from '../components/Feedback';
import FormField from '../components/FormField';
import { useAsync } from '../hooks/useAsync';
import { historyApi, patientsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';

export default function MedicalHistory() {
  const toast = useToast();
  const patients = useAsync(() => patientsApi.list());
  const [pid, setPid] = useState('');
  const history = useAsync(() => (pid ? patientsApi.history(pid) : Promise.resolve(null)), [pid]);
  const [adding, setAdding] = useState(false);
  const [del, setDel] = useState(null);

  const remove = async () => {
    try { await historyApi.remove(del.history_id); toast.success('Medical history record deleted.'); setDel(null); history.reload({ silent: true }); }
    catch (err) { toast.error(err.message); setDel(null); }
  };

  return (
    <>
      <PageHeader title="Medical History" subtitle="Each patient's visits are kept as a linked list and shown in time order.">
        {pid && <button className="btn-primary" onClick={() => setAdding(true)}><ClipboardPlus className="h-4 w-4" aria-hidden="true" />Add Medical History</button>}
      </PageHeader>

      <section className="card card-pad mb-5">
        {patients.error ? <ErrorState message={patients.error} onRetry={patients.reload} /> : (
          <FormField as="select" label="Choose a patient" value={pid} onChange={(e) => setPid(e.target.value)} disabled={patients.loading}
            options={[{ value: '', label: patients.loading ? 'Loading patients...' : 'Select a patient' }, ...(patients.data?.data || []).map((p) => ({ value: p.patient_id, label: `${p.patient_id} - ${p.name}` }))]} />
        )}
      </section>

      <section className="card p-4 sm:p-5" aria-label="History">
        {!pid ? <EmptyState icon={ClipboardPlus} title="Select a patient" hint="Pick a patient above to see their medical history." />
          : history.loading && !history.data ? <LoadingBlock text="Loading medical history..." rows={3} />
          : history.error && !history.data ? <ErrorState message={history.error} onRetry={history.reload} />
          : <HistoryTimeline visits={history.data.data.visits} canDelete onDelete={setDel} />}
      </section>

      {adding && <HistoryFormModal patientId={pid} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); history.reload({ silent: true }); }} />}
      {del && <ConfirmDialog title="Delete this visit?" message={`The visit "${del.diagnosis}" on ${formatDate(del.visit_date)} will be removed from the history list.`} onClose={() => setDel(null)} onConfirm={remove} />}
    </>
  );
}
