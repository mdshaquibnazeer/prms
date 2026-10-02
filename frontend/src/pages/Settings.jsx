import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const local = {};
    if (!f.currentPassword) local.currentPassword = 'Enter your current password.';
    if (f.newPassword.length < 8) local.newPassword = 'Use at least 8 characters.';
    if (f.confirm !== f.newPassword) local.confirm = 'Passwords do not match.';
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      const r = await authApi.changePassword(f.currentPassword, f.newPassword);
      toast.success(r.message);
      setF({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { setErrors(err.fieldErrors || {}); setFormError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account details." />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card card-pad" aria-labelledby="acct">
          <h2 id="acct" className="mb-3 font-bold">Account</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs text-muted">User name</dt><dd className="font-medium">{user.name}</dd></div>
            <div><dt className="text-xs text-muted">Email</dt><dd className="break-all font-medium">{user.email}</dd></div>
            <div><dt className="text-xs text-muted">Role</dt><dd className="font-medium capitalize">{user.role}</dd></div>
          </dl>
        </section>
        <form onSubmit={submit} noValidate className="card card-pad space-y-4" aria-labelledby="pw">
          <h2 id="pw" className="font-bold">Change password</h2>
          {formError && <p role="alert" className="rounded-lg bg-critical-soft px-3 py-2 text-sm font-medium text-critical">{formError}</p>}
          <FormField label="Current password" type="password" autoComplete="current-password" value={f.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} />
          <FormField label="New password" type="password" autoComplete="new-password" value={f.newPassword} onChange={set('newPassword')} error={errors.newPassword} hint="At least 8 characters." />
          <FormField label="Confirm new password" type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} error={errors.confirm} />
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Change password'}</button>
        </form>
      </div>
    </>
  );
}
