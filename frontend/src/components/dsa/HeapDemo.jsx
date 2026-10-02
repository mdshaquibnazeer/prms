import { useState } from 'react';
import FormField from '../FormField';
import { ComplexityChips, Explain, HeapTree, ResetButton, ResultBox, useDemoAction } from '../DsaParts';
import { dsaApi } from '../../services/api';

export default function HeapDemo({ state, setState }) {
  const [value, setValue] = useState('');
  const [bulk, setBulk] = useState('9, 4, 7, 1, 8, 2');
  const a = useDemoAction((s) => setState((p) => ({ ...p, heap: s })));
  const h = state.heap;
  const reset = () => a.run(async () => { const r = await dsaApi.reset('heap'); return { state: r.state.heap, result: { message: 'Heap reset to [1, 3, 2, 5, 9, 8] (built by inserting 5, 3, 8, 1, 9, 2).' } }; });

  return (
    <div className="space-y-4">
      <Explain>A binary min-heap is a complete binary tree stored in an array. Every parent is smaller than its children, so the minimum is always at index 0. For index i: parent = floor((i-1)/2), children = 2i+1 and 2i+2. Insert sifts the new value up; Extract moves the last value to the root and sifts it down.</Explain>
      <ComplexityChips items={[['Insert', 'O(log n)'], ['Extract', 'O(log n)'], ['Peek', 'O(1)'], ['Heapify', 'O(n)']]} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormField label="Number to insert" type="number" value={value} onChange={(e) => setValue(e.target.value)} className="sm:w-48" />
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary btn-sm" disabled={a.busy} onClick={async () => { const r = await a.run(() => dsaApi.heapInsert(value)); if (r) setValue(''); }}>Insert</button>
          <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.heapExtract())}>Extract min</button>
          <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.heapPeek())}>Peek</button>
          <ResetButton onClick={reset} busy={a.busy} />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormField label="Heapify an unsorted list" value={bulk} onChange={(e) => setBulk(e.target.value)} className="sm:flex-1" hint="Numbers separated by commas" />
        <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.heapHeapify(bulk))}>Heapify</button>
      </div>
      <ResultBox result={a.result} />
      <div>
        <p className="mb-2 text-sm font-semibold">Tree view ({h.size} nodes{h.min !== null ? `, minimum = ${h.min}` : ''})</p>
        <HeapTree values={h.array} />
        <p className="mt-3 text-xs text-muted">Array form: [{h.array.join(', ')}]</p>
      </div>
    </div>
  );
}
