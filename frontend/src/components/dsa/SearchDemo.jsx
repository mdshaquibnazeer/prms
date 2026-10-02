import { useState } from 'react';
import FormField from '../FormField';
import { ComplexityChips, Explain, ResultBox } from '../DsaParts';
import { useToast } from '../../context/ToastContext';
import { dsaApi } from '../../services/api';

export default function SearchDemo() {
  const toast = useToast();
  const [f, setF] = useState({ dataset: 'numbers', field: 'patient_id', algorithm: 'linear', numbers: '40, 10, 30, 20, 50, 60, 70, 80', query: '30', sortFirst: false });
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const run = async (override = {}) => {
    setBusy(true);
    try { setRes((await dsaApi.search({ ...f, ...override })).data); }
    catch (err) { toast.error(err.message); setRes(null); }
    finally { setBusy(false); }
  };
  const patients = f.dataset === 'patients';
  const numeric = !patients || f.field === 'age';

  return (
    <div className="space-y-4">
      <Explain>Linear Search checks items one by one - O(n), works on any data. Binary Search repeatedly halves the range - O(log n) - but ONLY works on data that is already sorted. The Hash Map jumps straight to the right bucket - average O(1).</Explain>
      <ComplexityChips items={[['Linear Search', 'O(n)'], ['Binary Search', 'O(log n), sorted data only'], ['Hash Map', 'Average O(1)']]} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FormField as="select" label="Data to search" value={f.dataset} onChange={set('dataset')} options={[{ value: 'numbers', label: 'My own numbers' }, { value: 'patients', label: 'Patients from PostgreSQL' }]} />
        <FormField as="select" label="Search algorithm" value={f.algorithm} onChange={set('algorithm')}
          options={[{ value: 'linear', label: 'Linear Search' }, { value: 'binary', label: 'Binary Search' }, { value: 'hash', label: 'Hash Map (Patient ID)' }]} />
        {patients && <FormField as="select" label="Search field" value={f.field} onChange={set('field')} options={[{ value: 'patient_id', label: 'Patient ID' }, { value: 'name', label: 'Name' }, { value: 'age', label: 'Age' }]} />}
        <FormField label="Search for" value={f.query} onChange={set('query')} type={numeric ? 'text' : 'text'} placeholder={patients ? (f.field === 'age' ? '42' : f.field === 'name' ? 'Sara Ali' : 'P1003') : '30'} />
      </div>
      {!patients && <FormField label="Numbers (comma separated)" value={f.numbers} onChange={set('numbers')} hint="Try an unsorted list with Binary Search to see why sorting is required." />}
      {f.algorithm === 'binary' && (
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#0E7C86]" checked={f.sortFirst} onChange={set('sortFirst')} />Sort first with Merge Sort if the data is not sorted</label>
      )}
      <button className="btn-primary btn-sm" onClick={() => run()} disabled={busy}>{busy ? 'Searching...' : 'Search'}</button>

      {!res ? <ResultBox result={null} /> : (
        <div className="space-y-3">
          <ResultBox result={{
            message: res.needsSort ? 'Binary Search cannot run on unsorted data.' : res.found ? `Found - ${res.results.length || 1} match${(res.results.length || 1) > 1 ? 'es' : ''}.` : 'Not found.',
            complexity: res.complexity,
          }} />
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-line p-3 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-muted">Algorithm</dt><dd className="font-semibold">{res.algorithm}</dd></div>
            <div><dt className="text-xs text-muted">Input</dt><dd className="break-words font-semibold">{res.input.query} ({res.input.size} items)</dd></div>
            <div><dt className="text-xs text-muted">Comparisons</dt><dd className="font-semibold">{res.comparisons}</dd></div>
            <div><dt className="text-xs text-muted">Time complexity</dt><dd className="font-semibold">{res.complexity}</dd></div>
          </dl>
          {res.needsSort && (
            <div className="rounded-lg border border-emergency/30 bg-emergency-soft px-3 py-3 text-sm">
              <p className="font-semibold text-emergency">{res.notes[0]}</p>
              <p className="mt-1">{res.notes[1]}</p>
              <button className="btn-secondary btn-sm mt-2" onClick={() => { setF({ ...f, sortFirst: true }); run({ sortFirst: true }); }}>Sort with Merge Sort and search</button>
            </div>
          )}
          {!res.needsSort && res.notes?.map((n) => <p key={n} className="text-xs text-muted">{n}</p>)}
          {res.sortComparisons > 0 && <p className="text-xs text-muted">Merge Sort used {res.sortComparisons} comparisons before searching.</p>}
          {res.steps?.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-semibold">Binary search steps (low / mid / high index)</p>
              <ol className="flex flex-wrap gap-2 text-xs">
                {res.steps.map((s, i) => <li key={i} className="rounded-md bg-canvas px-2 py-1 font-mono">{i + 1}: {s.low} / {s.mid} / {s.high}</li>)}
              </ol>
            </div>
          )}
          {res.found && (
            <ul className="space-y-1 text-sm">
              {res.results.map((r, i) => <li key={i} className="rounded-md bg-success-soft px-3 py-1.5 text-success">{typeof r === 'string' ? r : `Index ${r.index}: ${r.value}`}</li>)}
            </ul>
          )}
          <details className="rounded-lg border border-line px-3 py-2 text-sm">
            <summary className="cursor-pointer font-semibold">Show the data searched</summary>
            <p className="mt-2 break-words text-muted">{(res.dataSorted || res.dataBefore).join(' | ')}</p>
          </details>
        </div>
      )}
    </div>
  );
}
