import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

/** Runs a demo action, stores the result message and shows errors as toasts. */
export function useDemoAction(onState) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const run = async (fn) => {
    setBusy(true);
    try {
      const r = await fn();
      if (r.result) setResult(r.result);
      if (r.state && onState) onState(r.state);
      return r;
    } catch (err) { toast.error(err.message); return null; }
    finally { setBusy(false); }
  };
  return { busy, result, run, clearResult: () => setResult(null) };
}

export function ComplexityChips({ items }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Time complexity">
      {items.map(([op, c]) => (
        <li key={op} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">{op}: {c}</li>
      ))}
    </ul>
  );
}

export function Explain({ children }) {
  return <p className="rounded-lg bg-canvas px-3 py-2.5 text-sm text-muted">{children}</p>;
}

export function ResultBox({ result }) {
  if (!result) return <p className="rounded-lg border border-dashed border-line px-3 py-3 text-sm text-muted">Run an operation to see the result here.</p>;
  return (
    <div role="status" aria-live="polite" className="rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-3 text-sm">
      <p className="break-words font-semibold text-ink">{result.message}</p>
      {result.collisionNote && <p className="mt-1 break-words font-medium text-emergency">{result.collisionNote}</p>}
      {result.explanation && <p className="mt-1 text-muted">{result.explanation}</p>}
      {result.complexity && <p className="mt-1 text-brand-800">Complexity: <b>{result.complexity}</b></p>}
    </div>
  );
}

export function ResetButton({ onClick, busy, label = 'Reset demo' }) {
  return <button className="btn-ghost btn-sm" onClick={onClick} disabled={busy}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />{label}</button>;
}

export function Spinner() { return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />; }

/** Draws a min-heap array as a tree (levels of nodes). */
export function HeapTree({ values, label = (v) => v, highlight = 0 }) {
  if (!values.length) return <p className="text-sm text-muted">The heap is empty.</p>;
  const levels = [];
  let i = 0; let size = 1;
  while (i < values.length) { levels.push(values.slice(i, i + size).map((v, k) => ({ v, idx: i + k }))); i += size; size *= 2; }
  return (
    <div className="space-y-3 overflow-x-auto pb-1" role="img" aria-label={`Heap tree with ${values.length} nodes`}>
      {levels.map((lvl, li) => (
        <div key={li} className="flex min-w-max justify-center gap-2">
          {lvl.map((n) => (
            <div key={n.idx} className={`flex min-w-[52px] flex-col items-center rounded-lg border px-2.5 py-1.5 text-sm ${n.idx === highlight ? 'border-brand-600 bg-brand-50 font-bold' : 'border-line bg-white'}`}>
              <span className="text-[10px] text-muted">[{n.idx}]</span>
              <span>{label(n.v)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
