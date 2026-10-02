import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HeartPulse, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';

const DEMO = [
  { role: 'Admin', email: 'admin@hospital.com', password: 'Admin@123' },
  { role: 'Doctor', email: 'doctor@hospital.com', password: 'Doctor@123' },
  { role: 'Receptionist', email: 'reception@hospital.com', password: 'Reception@123' },
];

export default function Login() {
  const { user, booting, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!booting && user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) { setError('Enter your email and password.'); return; }
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white"><HeartPulse className="h-7 w-7" aria-hidden="true" /></span>
          <h1 className="text-2xl font-bold">Patient Records</h1>
          <p className="mt-1 text-sm text-muted">Intelligent Patient Record Management System</p>
        </div>

        <form onSubmit={submit} noValidate className="card card-pad space-y-4">
          <h2 className="text-lg font-bold">Log in</h2>
          {error && <p role="alert" className="rounded-lg bg-critical-soft px-3 py-2 text-sm font-medium text-critical">{error}</p>}
          <FormField label="Email" type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@hospital.com" />
          <FormField label="Password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <section className="mt-4 rounded-xl border border-dashed border-brand-200 bg-white/70 p-4" aria-label="Demo credentials">
          <p className="text-sm font-semibold">Demo credentials <span className="font-normal text-muted">(for this college project only)</span></p>
          <ul className="mt-2 space-y-1.5">
            {DEMO.map((d) => (
              <li key={d.role} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="min-w-0 break-all"><span className="font-semibold">{d.role}:</span> {d.email} / {d.password}</span>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setForm({ email: d.email, password: d.password })}>Fill in</button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
