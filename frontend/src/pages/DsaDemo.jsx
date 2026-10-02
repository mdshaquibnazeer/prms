import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { ErrorState, LoadingBlock } from '../components/Feedback';
import { useAsync } from '../hooks/useAsync';
import { dsaApi, patientsApi } from '../services/api';
import AboutDsa from '../components/dsa/AboutDsa';
import HashMapDemo from '../components/dsa/HashMapDemo';
import QueueDemo from '../components/dsa/QueueDemo';
import PriorityQueueDemo from '../components/dsa/PriorityQueueDemo';
import HeapDemo from '../components/dsa/HeapDemo';
import LinkedListDemo from '../components/dsa/LinkedListDemo';
import SearchDemo from '../components/dsa/SearchDemo';
import SortDemo from '../components/dsa/SortDemo';

const TABS = [
  { id: 'about', label: 'About / DSA' },
  { id: 'hash', label: 'Hash Map' },
  { id: 'queue', label: 'Queue' },
  { id: 'pq', label: 'Priority Queue' },
  { id: 'heap', label: 'Heap' },
  { id: 'list', label: 'Linked List' },
  { id: 'search', label: 'Searching' },
  { id: 'sort', label: 'Sorting' },
];

export default function DsaDemo() {
  const [tab, setTab] = useState('about');
  const initial = useAsync(() => dsaApi.state());
  const patients = useAsync(() => patientsApi.list());
  const [state, setState] = useState(null);
  const current = state || initial.data?.state;
  // demos call setState(prev => next); make sure prev is never null
  const update = (fn) => setState((prev) => fn(prev || initial.data.state));

  const onKey = (e) => {
    const i = TABS.findIndex((t) => t.id === tab);
    if (e.key === 'ArrowRight') { setTab(TABS[(i + 1) % TABS.length].id); }
    if (e.key === 'ArrowLeft') { setTab(TABS[(i - 1 + TABS.length) % TABS.length].id); }
  };

  return (
    <>
      <PageHeader title="DSA Demonstration" subtitle="Every operation below runs on the real data structures in backend/src/dsa - nothing is simulated in the browser." />
      <div role="tablist" aria-label="Data structures and algorithms" onKeyDown={onKey} className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-white p-1 shadow-card ring-1 ring-line">
        {TABS.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls="dsa-panel" tabIndex={tab === t.id ? 0 : -1} onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-semibold ${tab === t.id ? 'bg-brand-600 text-white' : 'text-ink hover:bg-brand-50'}`}>{t.label}</button>
        ))}
      </div>

      <section id="dsa-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="card card-pad">
        {tab === 'about' && <AboutDsa />}
        {tab === 'search' && <SearchDemo />}
        {tab === 'sort' && <SortDemo />}
        {['hash', 'queue', 'pq', 'heap', 'list'].includes(tab) && (
          !current ? (initial.error ? <ErrorState message={initial.error} onRetry={initial.reload} /> : <LoadingBlock text="Loading demo..." rows={3} />) : (
            <>
              {tab === 'hash' && <HashMapDemo state={current} setState={update} />}
              {tab === 'queue' && <QueueDemo state={current} setState={update} />}
              {tab === 'pq' && <PriorityQueueDemo state={current} setState={update} />}
              {tab === 'heap' && <HeapDemo state={current} setState={update} />}
              {tab === 'list' && <LinkedListDemo state={current} setState={update} patients={patients.data?.data || []} />}
            </>
          )
        )}
      </section>
    </>
  );
}
