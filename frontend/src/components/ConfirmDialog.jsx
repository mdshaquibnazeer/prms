import { useState } from 'react';
import Modal from './Modal';

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };
  return (
    <Modal title={title} onClose={onClose}
      footer={<>
        <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn-danger" onClick={go} disabled={busy}>{busy ? 'Working...' : confirmLabel}</button>
      </>}>
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}
