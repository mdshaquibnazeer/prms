import { AsyncBoundary } from '../Feedback';
import { useAsync } from '../../hooks/useAsync';
import { dsaApi } from '../../services/api';

export default function AboutDsa() {
  const state = useAsync(() => dsaApi.info());
  return (
    <AsyncBoundary state={state} loadingText="Loading DSA overview..." rows={4}>
      {(res) => {
        const d = res.data;
        const idx = d.patientIndex;
        return (
          <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-line p-4"><h3 className="font-bold">Project objective</h3><p className="mt-1 text-sm text-muted">{d.project.objective}</p></div>
              <div className="rounded-lg border border-line p-4"><h3 className="font-bold">Problem being solved</h3><p className="mt-1 text-sm text-muted">{d.project.problem}</p></div>
              <div className="rounded-lg border border-line p-4"><h3 className="font-bold">Technology stack</h3><ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted">{d.project.stack.map((s) => <li key={s}>{s}</li>)}</ul></div>
              <div className="rounded-lg border border-line p-4"><h3 className="font-bold">Database vs DSA</h3><p className="mt-1 text-sm text-muted">{d.project.databaseVsDsa}</p>
                <p className="mt-2 rounded-md bg-brand-50 px-2.5 py-1.5 text-xs text-brand-800">Live: the patient Hash Map index currently holds {idx.size} patients in {idx.capacity} buckets (load factor {idx.loadFactor}, longest chain {idx.longestChain}).</p></div>
            </section>
            <section>
              <h3 className="mb-3 font-bold">Where and why each concept is used</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {d.concepts.map((c) => (
                  <article key={c.name} className="rounded-lg border border-line p-4">
                    <h4 className="font-bold text-brand-700">{c.name} <span className="ml-1 font-mono text-xs font-normal text-muted">{c.file}</span></h4>
                    <dl className="mt-2 space-y-1.5 text-sm">
                      <div><dt className="inline font-semibold">Used for: </dt><dd className="inline text-muted">{c.usedFor}</dd></div>
                      <div><dt className="inline font-semibold">Why: </dt><dd className="inline text-muted">{c.why}</dd></div>
                      <div><dt className="inline font-semibold">Time: </dt><dd className="inline text-muted">{c.complexity}</dd></div>
                      <div><dt className="inline font-semibold">Space: </dt><dd className="inline text-muted">{c.space}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-3 font-bold">Complexity table</h3>
              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full min-w-[480px] border-collapse">
                  <thead><tr><th className="th">Algorithm / Data Structure</th><th className="th">Operation</th><th className="th">Complexity</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {d.complexityTable.map((r, i) => <tr key={i}><td className="td font-semibold">{r.structure}</td><td className="td">{r.operation}</td><td className="td font-mono text-[13px]">{r.complexity}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      }}
    </AsyncBoundary>
  );
}
