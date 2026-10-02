import { useEffect, useState } from 'react';
import { Building2, Plus, CheckCircle, XCircle, Search, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { hospitalsApi, adminApi } from '../services/api';

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const res = await hospitalsApi.list();
      setHospitals(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminApi.setApprovalStatus('hospital', id, newStatus);
      setActionMsg(`Hospital ${id} status updated to ${newStatus}.`);
      loadHospitals();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const filtered = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.city?.toLowerCase().includes(search.toLowerCase()) ||
      h.hospital_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Network Management"
        subtitle="Manage all 10+ hospitals, review registration requests, and inspect hospital branches."
      />

      {actionMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-emerald-600 font-bold text-xs">Dismiss</button>
        </div>
      )}

      <div className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="input pl-9 w-full"
              placeholder="Search by hospital name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Total Hospitals: {hospitals.length} | Active: {hospitals.filter(h => h.status === 'approved').length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Hospital ID</th>
                <th>Hospital Name</th>
                <th>City &amp; Address</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.hospital_id}>
                  <td className="font-mono text-xs font-bold text-slate-700">{h.hospital_id}</td>
                  <td className="font-semibold text-slate-900">{h.name}</td>
                  <td className="text-xs text-slate-600">
                    <span className="font-medium text-slate-800">{h.city}</span> &middot; {h.address}
                  </td>
                  <td className="text-xs text-slate-600">
                    <div>{h.email}</div>
                    <div className="text-slate-400">{h.phone}</div>
                  </td>
                  <td>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        h.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : h.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {h.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {h.status === 'pending' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStatusChange(h.hospital_id, 'approved')}
                          className="btn-primary btn-sm flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(h.hospital_id, 'rejected')}
                          className="btn-secondary btn-sm flex items-center gap-1 text-red-600"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Verified</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-400">
                    No hospitals found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
