import { useId } from 'react';

/** Label + input/select/textarea + error message, wired together for screen readers. */
export default function FormField({ label, error, hint, required, as = 'input', options, className = '', children, ...props }) {
  const id = useId();
  const errId = `${id}-err`;
  const common = {
    id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': error ? errId : undefined,
    className: `input ${error ? 'input-error' : ''}`,
    ...props,
  };
  let control;
  if (as === 'select') {
    control = (
      <select {...common}>
        {children || options?.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    );
  } else if (as === 'textarea') {
    control = <textarea rows={3} {...common} />;
  } else {
    control = <input {...common} />;
  }
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}{required && <span className="text-critical" aria-hidden="true"> *</span>}</label>
      {control}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={errId} className="field-error">{error}</p>}
    </div>
  );
}
