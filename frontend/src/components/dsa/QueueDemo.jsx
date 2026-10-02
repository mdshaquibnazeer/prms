import { useState } from 'react';
import FormField from '../FormField';
import { ComplexityChips, Explain, ResetButton, ResultBox, useDemoAction } from '../DsaParts';
import { dsaApi } from '../../services/api';

export default function QueueDemo({ state, setState }) {
  const [name, setName] = useState('');
  const a = useDemoAction((s) => setState((p) => ({ ...p, queue: s })));
  const q = state.queue;
  const reset = () => a.run(async () => { const r = await dsaApi.reset('queue'); return { state: r.state.queue, result: { message: 'Queue reset to Patient A, B, C.' } }; });

  return (
    <div className="space-y-4">
      <Explain>A Queue is FIFO - First In, First Out. The patient who joined first is served first. It is used for normal appointments: the earliest booking is called in first. Our Queue is a linked list with head and tail pointers so both ends are O(1).</Explain>
      <ComplexityChips items={[['Enqueue', 'O(1)'], ['Dequeue', 'O(1)'], ['Peek', 'O(1)'], ['isEmpty / size', 'O(1)']]} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormField label="Patient name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Patient D" className="sm:flex-1" />
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary btn-sm" disabled={a.busy} onClick={async () => { const r = await a.run(() => dsaApi.queueEnqueue(name)); if (r) setName(''); }}>Enqueue</button>
          <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.queueDequeue())}>Dequeue</button>
          <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.queuePeek())}>Peek</button>
          <ResetButton onClick={reset} busy={a.busy} />
        </div>
      </div>
      <ResultBox result={a.result} />
      <div>
        <p className="mb-2 text-sm font-semibold">FIFO queue ({q.size} waiting)</p>
        {q.items.length === 0 ? <p className="rounded-lg border border-dashed border-line px-3 py-4 text-sm text-muted">The queue is empty.</p> : (
          <ol className="flex items-stretch gap-2 overflow-x-auto pb-1" aria-label="Queue from front to back">
            {q.items.map((n, i) => (
              <li key={`${n}-${i}`} className="flex items-center gap-2">
                <div className={`min-w-[110px] rounded-lg border px-3 py-2 text-center text-sm ${i === 0 ? 'border-brand-600 bg-brand-50' : 'border-line bg-white'}`}>
                  <p className="text-[10px] font-semibold uppercase text-muted">{i === 0 ? 'Front' : i === q.items.length - 1 ? 'Back' : `#${i + 1}`}</p>
                  <p className="font-semibold">{n}</p>
                </div>
                {i < q.items.length - 1 && <span aria-hidden="true" className="text-brand-600">&rarr;</span>}
              </li>
            ))}
          </ol>
        )}
        <p className="mt-2 text-xs text-muted">Dequeue removes from the Front, Enqueue adds at the Back.</p>
      </div>
    </div>
  );
}
