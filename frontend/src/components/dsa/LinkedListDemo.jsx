import { useState } from 'react';
import FormField from '../FormField';
import { ComplexityChips, Explain, ResetButton, ResultBox, useDemoAction } from '../DsaParts';
import { dsaApi } from '../../services/api';
import { formatDate } from '../../utils/format';

export default function LinkedListDemo({ state, setState, patients }) {
  const [f, setF] = useState({ date: '', diagnosis: '', treatment: '' });
  const [target, setTarget] = useState('');
  const [pid, setPid] = useState('');
  const a = useDemoAction((s) => setState((p) => ({ ...p, linkedList: s })));
  const ll = state.linkedList;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const reset = () => a.run(async () => { const r = await dsaApi.reset('list'); return { state: r.state.linkedList, result: { message: 'Linked list reset to 3 sample visits.' } }; });

  return (
    <div className="space-y-4">
      <Explain>A patient's medical history is a singly linked list. Each visit is a Node holding the visit data and a pointer to the next node. The list keeps a head (first visit) and a tail (last visit) so adding a new visit at the end is O(1); searching or deleting needs a walk from the head, O(n).</Explain>
      <ComplexityChips items={[['Add visit (append)', 'O(1) with tail'], ['Delete visit', 'O(n)'], ['Search visit', 'O(n)'], ['Display history', 'O(n)']]} />

      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="Date" type="date" value={f.date} onChange={set('date')} />
        <FormField label="Diagnosis" value={f.diagnosis} onChange={set('diagnosis')} />
        <FormField label="Treatment" value={f.treatment} onChange={set('treatment')} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary btn-sm" disabled={a.busy} onClick={async () => { const r = await a.run(() => dsaApi.listAdd(f)); if (r) setF({ date: '', diagnosis: '', treatment: '' }); }}>Add Visit</button>
        <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.listDisplay())}>Display History</button>
        <ResetButton onClick={reset} busy={a.busy} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormField label="Diagnosis to search / delete" value={target} onChange={(e) => setTarget(e.target.value)} className="sm:flex-1" />
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.listSearch(target))}>Search Visit</button>
          <button className="btn-secondary btn-sm !text-critical" disabled={a.busy} onClick={() => a.run(() => dsaApi.listDelete(target))}>Delete Visit</button>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormField as="select" label="Load a real patient's history from PostgreSQL" value={pid} onChange={(e) => setPid(e.target.value)} className="sm:flex-1"
          options={[{ value: '', label: 'Select a patient' }, ...patients.map((p) => ({ value: p.patient_id, label: `${p.patient_id} - ${p.name}` }))]} />
        <button className="btn-secondary btn-sm" disabled={a.busy || !pid} onClick={() => a.run(() => dsaApi.listLoad(pid))}>Load into list</button>
      </div>
      <ResultBox result={a.result} />

      <div>
        <p className="mb-2 text-sm font-semibold">Linked list ({ll.size} nodes, head = {ll.headPosition ? `node ${ll.headPosition}` : 'null'})</p>
        {ll.nodes.length === 0 ? <p className="rounded-lg border border-dashed border-line px-3 py-4 text-sm text-muted">The list is empty (head = null).</p> : (
          <ol className="flex items-stretch gap-2 overflow-x-auto pb-2" aria-label="Linked list from head to tail">
            {ll.nodes.map((n) => (
              <li key={n.id} className="flex items-center gap-2">
                <div className="min-w-[170px] rounded-lg border border-line bg-white text-sm">
                  <p className={`rounded-t-lg px-3 py-1 text-[11px] font-semibold ${n.isHead ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-800'}`}>Node {n.position}{n.isHead ? ' - HEAD' : ''}{n.isTail ? ' - TAIL' : ''}</p>
                  <div className="space-y-0.5 px-3 py-2">
                    <p><span className="text-muted">Date:</span> {formatDate(n.date)}</p>
                    <p className="break-words"><span className="text-muted">Diagnosis:</span> {n.diagnosis}</p>
                    <p className="break-words"><span className="text-muted">Treatment:</span> {n.treatment}</p>
                  </div>
                  <p className="border-t border-line px-3 py-1 text-xs text-muted">next &rarr; {n.nextPosition ? `Node ${n.nextPosition}` : 'null'}</p>
                </div>
                {n.nextPosition && <span aria-hidden="true" className="text-lg text-brand-600">&rarr;</span>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
