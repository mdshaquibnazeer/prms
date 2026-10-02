import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export function LoadingBlock({ text = 'Loading...', rows = 4 }) {
  return (
    <div role="status" aria-live="polite" className="p-4 sm:p-5">
      <p className="mb-3 flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{text}</p>
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-canvas" style={{ opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, hint, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Icon className="h-6 w-6" aria-hidden="true" /></span>
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center px-4 py-10 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-critical-soft text-critical"><AlertTriangle className="h-6 w-6" aria-hidden="true" /></span>
      <p className="font-semibold text-ink">We could not load this page</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && <button onClick={() => onRetry()} className="btn-secondary mt-4">Try again</button>}
    </div>
  );
}

/** Wraps a useAsync result: shows loading / error / content. */
export function AsyncBoundary({ state, loadingText, rows, children }) {
  if (state.loading && !state.data) return <LoadingBlock text={loadingText} rows={rows} />;
  if (state.error && !state.data) return <ErrorState message={state.error} onRetry={state.reload} />;
  return children(state.data);
}
