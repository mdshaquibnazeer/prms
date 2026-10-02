import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async function and tracks { data, loading, error }.
 * Call reload() to run it again (e.g. after adding a record).
 * `deps` works like useEffect deps: when they change the function re-runs.
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const runId = useRef(0);

  const run = useCallback(async ({ silent = false } = {}) => {
    const id = ++runId.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (id === runId.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (id === runId.current) setState((s) => ({ data: silent ? s.data : null, loading: false, error: err.message || 'Something went wrong.' }));
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);

  return { ...state, reload: run };
}

/** Small debounce hook for search boxes. */
export function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
