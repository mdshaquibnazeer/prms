import { useState } from 'react';
import FormField from '../FormField';
import { ComplexityChips, Explain, ResetButton, ResultBox, useDemoAction } from '../DsaParts';
import { dsaApi } from '../../services/api';

export default function HashMapDemo({ state, setState }) {
  const [key, setKey] = useState('P1001');
  const [value, setValue] = useState('Rahul Sharma');
  const a = useDemoAction((s) => setState((p) => ({ ...p, hashMap: s })));
  const hm = state.hashMap;
  const reset = () => a.run(async () => { const r = await dsaApi.reset('hashMap'); return { state: r.state.hashMap, result: { message: 'Hash Map reset (empty, 7 buckets).' } }; });

  return (
    <div className="space-y-4">
      <Explain>Hash Map stores patient records using Patient ID as the key for fast average-case lookup. A hash function turns the key into a bucket number; keys that land in the same bucket are chained in a list (separate chaining). This is an application-level structure built from database rows - PostgreSQL still holds the permanent records.</Explain>
      <ComplexityChips items={[['Search', 'Average O(1)'], ['Insert', 'Average O(1)'], ['Delete', 'Average O(1)'], ['Worst case', 'O(n)']]} />

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Patient ID (key)" value={key} onChange={(e) => setKey(e.target.value)} placeholder="P1001" />
        <FormField label="Patient name (value)" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Rahul Sharma" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.hashSet(key, value))}>Insert</button>
        <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.hashGet(key))}>Search</button>
        <button className="btn-secondary btn-sm !text-critical" disabled={a.busy} onClick={() => a.run(() => dsaApi.hashDelete(key))}>Delete</button>
        <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.hashCollide(key))}>Demonstrate a collision</button>
        <button className="btn-secondary btn-sm" disabled={a.busy} onClick={() => a.run(() => dsaApi.hashLoad())}>Load patients from PostgreSQL</button>
        <ResetButton onClick={reset} busy={a.busy} />
      </div>
      <ResultBox result={a.result} />

      <div>
        <p className="mb-2 text-sm font-semibold">Buckets ({hm.stats.size} entries, {hm.stats.capacity} buckets, load factor {hm.stats.loadFactor}, longest chain {hm.stats.longestChain}, {hm.stats.collidingEntries} colliding)</p>
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {hm.buckets.map((b) => (
            <li key={b.index} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
              <span className="w-16 shrink-0 font-mono text-xs text-muted">bucket {b.index}</span>
              {b.chain.length === 0 ? <span className="text-muted">empty</span> : b.chain.map((n, i) => (
                <span key={n.key} className="flex items-center gap-2">
                  {i > 0 && <span aria-label="chained to" className="text-brand-600">&rarr;</span>}
                  <span className={`rounded-md px-2 py-0.5 ${b.chain.length > 1 ? 'bg-emergency-soft' : 'bg-brand-50'}`}><b>{n.key}</b> &rarr; {n.value}</span>
                </span>
              ))}
              {b.chain.length > 1 && <span className="text-xs font-semibold text-emergency">collision chain</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
