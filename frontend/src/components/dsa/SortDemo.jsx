import { useState } from 'react';
import FormField from '../FormField';
import { ComplexityChips, Explain } from '../DsaParts';
import { useToast } from '../../context/ToastContext';
import { dsaApi } from '../../services/api';

export default function SortDemo() {
  const toast = useToast();
  const [f, setF] = useState({ dataset: 'patients', field: 'name', order: 'asc', numbers: '38, 27, 43, 3, 9, 82, 10' });
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const run = async () => {
    setBusy(true);
    try { setRes((await dsaApi.sort(f)).data); } catch (err) { toast.error(err.message); setRes(null); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <Explain>Merge Sort splits the list in half, sorts each half, then merges the two sorted halves. It always takes O(n log n) time, is stable (equal items keep their order) and uses O(n) extra space. It is written by hand in backend/src/dsa/Sorting.js - Array.sort() is not used.</Explain>
      <ComplexityChips items={[['Time (best / average / worst)', 'O(n log n)'], ['Space', 'O(n)']]} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FormField as="select" label="Data to sort" value={f.dataset} onChange={set('dataset')} options={[{ value: 'patients', label: 'Patients from PostgreSQL' }, { value: 'numbers', label: 'My own numbers' }]} />
        {f.dataset === 'patients' && <FormField as="select" label="Sort by" value={f.field} onChange={set('field')} options={[{ value: 'patient_id', label: 'Patient ID' }, { value: 'name', label: 'Name' }, { value: 'age', label: 'Age' }]} />}
        <FormField as="select" label="Order" value={f.order} onChange={set('order')} options={[{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }]} />
      </div>
      {f.dataset === 'numbers' && <FormField label="Numbers (comma separated)" value={f.numbers} onChange={set('numbers')} />}
      <button className="btn-primary btn-sm" onClick={run} disabled={busy}>{busy ? 'Sorting...' : 'Run Merge Sort'}</button>

      {res && (
        <div className="space-y-3">
          <p role="status" className="rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-3 text-sm">Sorted {res.size} items with <b>{res.algorithm}</b> in <b>{res.comparisons}</b> comparisons. Complexity: <b>{res.complexity}</b>.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div><p className="mb-1.5 text-sm font-semibold">Before sorting</p><ol className="list-decimal space-y-1 rounded-lg border border-line py-2 pl-8 pr-3 text-sm">{res.before.map((x, i) => <li key={i} className="break-words">{x}</li>)}</ol></div>
            <div><p className="mb-1.5 text-sm font-semibold">After sorting ({res.field}, {res.order})</p><ol className="list-decimal space-y-1 rounded-lg border border-brand-200 bg-brand-50/40 py-2 pl-8 pr-3 text-sm">{res.after.map((x, i) => <li key={i} className="break-words">{x}</li>)}</ol></div>
          </div>
        </div>
      )}
    </div>
  );
}
