import { useState } from 'react';
import FormField from '../FormField';
import { PriorityBadge } from '../Badges';
import { ComplexityChips, Explain, HeapTree, ResetButton, ResultBox, useDemoAction } from '../DsaParts';
import { dsaApi } from '../../services/api';

export default function PriorityQueueDemo({ state, setState }) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('2');
  const a = useDemoAction((s) => setState((p) => ({ ...p, priorityQueue: s })));
  const pq = state.priorityQueue;
  const reset = () => a.run(async () => { const r = await dsaApi.reset('pq'); return { state: r.state.priorityQueue, result: { message: 'Priority queue reset to Rahul (1), Aman (2), Sara (3).' } }; });

  return (
    <div className="space-y-4">
      <Explain>A Priority Queue serves the most urgent item first, not the oldest. Lower priority number = higher urgency (1 Critical, 2 Emergency, 3 Normal). It is built on a binary min-heap, so the most urgent patient is always at the root. Equal priorities are served in arrival order.</Explain>
      <ComplexityChips items={[['Insert', 'O(log n)'], ['Extract', 'O(log n)'], ['Peek', 'O(1)']]} />
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="Patient" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya" />
        <FormField as="select" label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} options={[{ value: '1', label: '1 - Critical' }, { value: '2', label: '2 - Emergency' }, { value: '3', label: '3 - Normal' }]} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary btn-sm" disabled={a.busy} onClick={async () => { const r = await a.run(() => dsaApi.pqInsert(name, priority)); if (r) setName(''); }}>Insert</button>
        <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.pqPeek())}>Peek</button>
        <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.pqExtract())}>Extract</button>
        <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.pqLoad())}>Load waiting emergency patients</button>
        <ResetButton onClick={reset} busy={a.busy} />
      </div>
      <ResultBox result={a.result} />
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold">Service order ({pq.size})</p>
          {pq.order.length === 0 ? <p className="text-sm text-muted">The priority queue is empty.</p> : (
            <ol className="space-y-2">
              {pq.order.map((e, i) => (
                <li key={`${e.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                  <span className="min-w-0 break-words"><span className="mr-2 text-muted">#{i + 1}</span><b>{e.name}</b> &mdash; {e.priority}</span>
                  <PriorityBadge priority={e.priority} />
                </li>
              ))}
            </ol>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Underlying heap</p>
          <HeapTree values={pq.heapArray} label={(h) => `${h.name} (${h.priority})`} />
        </div>
      </div>
    </div>
  );
}
