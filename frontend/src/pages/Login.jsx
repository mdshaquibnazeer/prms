import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  HeartPulse, Loader2, ShieldCheck, Building2, Stethoscope, User,
  AlertCircle, CheckCircle2, ArrowRight, Siren, CalendarDays
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hospitalsApi, authApi } from '../services/api';
import FormField from '../components/FormField';

export default function Login() {
  const { user, booting, login, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeRole, setActiveRole] = useState('admin'); // 'admin', 'hospital', 'doctor', 'patient'
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  // Common and Role-specific form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');

  // Hospital Registration State
  const [hospForm, setHospForm] = useState({ name: '', email: '', phone: '', address: '', city: '', password: '' });

  // Doctor Registration State
  const [docForm, setDocForm] = useState({ name: '', specialization: 'General Medicine', phone: '', email: '', password: '', hospital_id: '' });

  // Patient Registration State
  const [patForm, setPatForm] = useState({ name: '', age: 30, gender: 'Male', phone: '', email: '', blood_group: 'O+', password: '', hospital_id: '' });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoadingHospitals(true);
    hospitalsApi.listPublic()
      .then((res) => {
        setHospitals(res.data || []);
        if (res.data?.length > 0) {
          setSelectedHospital(res.data[0].hospital_id);
          setDocForm((prev) => ({ ...prev, hospital_id: res.data[0].hospital_id }));
          setPatForm((prev) => ({ ...prev, hospital_id: res.data[0].hospital_id }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHospitals(false));
  }, []);

  if (!booting && user) return <Navigate to="/dashboard" replace />;

  const resetState = (role) => {
    setActiveRole(role);
    setAuthMode('login');
    setError('');
    setSuccessMsg('');
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!loginEmail.trim() || !loginPassword) {
      setError('Please enter your email and password.');
      return;
    }

    if (activeRole === 'doctor' && !selectedHospital) {
      setError('Please select your hospital from the list to log in as a Doctor.');
      return;
    }

    setBusy(true);
    try {
      const extra = { role: activeRole };
      if (activeRole === 'doctor') extra.hospital_id = selectedHospital;
      if (activeRole === 'hospital') extra.hospital_id = selectedHospital;

      await login(loginEmail.trim(), loginPassword, extra);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterHospital = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!hospForm.name || !hospForm.email || !hospForm.password) {
      setError('Hospital name, email, and password are required.');
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.registerHospital(hospForm);
      setSuccessMsg(res.message);
      setAuthMode('login');
      const hList = await hospitalsApi.listPublic();
      setHospitals(hList.data || []);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!docForm.name || !docForm.email || !docForm.password || !docForm.hospital_id) {
      setError('Please fill in all doctor details and choose a hospital.');
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.registerDoctor(docForm);
      setSuccessMsg(res.message || 'Doctor registered successfully! You can now log in.');
      setAuthMode('login');
    } catch (err) {
      setError(err.message || 'Doctor registration failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!patForm.name || !patForm.email || !patForm.password || !patForm.phone) {
      setError('Please provide your name, phone, email, and password.');
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.registerPatient(patForm);
      if (res.token && res.user) {
        setSession(res.token, res.user);
        navigate('/dashboard?welcome=patient', { replace: true });
      } else {
        setSuccessMsg('Account created successfully! You can now log in.');
        setAuthMode('login');
      }
    } catch (err) {
      setError(err.message || 'Patient registration failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-3">
            <HeartPulse className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Records System</h1>
          <p className="mt-1 text-sm text-slate-500">Multi-Hospital Network &amp; Intelligent Record Management</p>
        </div>

        {/* Quick Role Selection Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-slate-200/80 rounded-2xl mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => resetState('admin')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeRole === 'admin'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4 mb-1" />
            <span>Main Admin</span>
          </button>

          <button
            type="button"
            onClick={() => resetState('hospital')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeRole === 'hospital'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4 mb-1" />
            <span>Hospital</span>
          </button>

          <button
            type="button"
            onClick={() => resetState('doctor')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeRole === 'doctor'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="h-4 w-4 mb-1" />
            <span>Doctor</span>
          </button>

          <button
            type="button"
            onClick={() => resetState('patient')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeRole === 'patient'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="h-4 w-4 mb-1" />
            <span>Patient</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 md:p-8">
          {/* Header of Active Tab */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {activeRole === 'admin' && <><ShieldCheck className="h-5 w-5 text-purple-600" /> Main Admin Portal</>}
                {activeRole === 'hospital' && <><Building2 className="h-5 w-5 text-blue-600" /> Hospital Management</>}
                {activeRole === 'doctor' && <><Stethoscope className="h-5 w-5 text-emerald-600" /> Doctor Portal</>}
                {activeRole === 'patient' && <><User className="h-5 w-5 text-amber-600" /> Patient Access</>}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeRole === 'admin' && 'Central command for doctor statistics, approvals, and hospital network.'}
                {activeRole === 'hospital' && 'Manage your hospital branch, doctors (up to 10), and patient queues.'}
                {activeRole === 'doctor' && 'Select your affiliated hospital to access clinical patient records.'}
                {activeRole === 'patient' && 'Instant access to prescriptions, medical timeline, and appointments.'}
              </p>
            </div>

            {/* Toggle Login vs Register if supported */}
            {activeRole !== 'admin' && (
              <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }}
                  className={`px-3 py-1 rounded-md transition-all ${authMode === 'login' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(''); setSuccessMsg(''); }}
                  className={`px-3 py-1 rounded-md transition-all ${authMode === 'register' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'}`}
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-100">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-800 border border-emerald-100">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. ADMIN LOGIN FORM */}
          {activeRole === 'admin' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <FormField
                label="Admin ID"
                type="text"
                autoComplete="username"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter Admin ID"
              />
              <FormField
                label="Password"
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
              />

              <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 rounded-xl font-medium mt-2">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? 'Authenticating...' : 'Sign in as Super Admin'}
              </button>
            </form>
          )}

          {/* 2. HOSPITAL LOGIN & REGISTER */}
          {activeRole === 'hospital' && (
            <>
              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Hospital</label>
                    <select
                      className="input w-full"
                      value={selectedHospital}
                      onChange={(e) => setSelectedHospital(e.target.value)}
                    >
                      {hospitals.map((h) => (
                        <option key={h.hospital_id} value={h.hospital_id}>
                          {h.name} ({h.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <FormField
                    label="Hospital Admin Email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@hospital.com"
                  />
                  <FormField
                    label="Password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                  />

                  <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 rounded-xl font-medium">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {busy ? 'Verifying...' : 'Sign in as Hospital Admin'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterHospital} className="space-y-3.5">
                  <div className="rounded-xl bg-blue-50/80 p-3 text-xs text-blue-800 border border-blue-100">
                    <strong>Hospital Network Notice:</strong> Initial 10 slots are pre-approved. New hospital registrations are submitted to the <strong>Main Admin for approval</strong>.
                  </div>
                  <FormField label="Hospital Name" value={hospForm.name} onChange={(e) => setHospForm({ ...hospForm, name: e.target.value })} placeholder="e.g. City Life General Hospital" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <FormField label="Official Email" type="email" value={hospForm.email} onChange={(e) => setHospForm({ ...hospForm, email: e.target.value })} placeholder="contact@hospital.com" />
                    <FormField label="Phone" value={hospForm.phone} onChange={(e) => setHospForm({ ...hospForm, phone: e.target.value })} placeholder="+91 98765 00000" />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <FormField label="City" value={hospForm.city} onChange={(e) => setHospForm({ ...hospForm, city: e.target.value })} placeholder="e.g. Bengaluru" />
                    <FormField label="Admin Password" type="password" value={hospForm.password} onChange={(e) => setHospForm({ ...hospForm, password: e.target.value })} placeholder="Min 8 characters" />
                  </div>
                  <FormField label="Full Address" value={hospForm.address} onChange={(e) => setHospForm({ ...hospForm, address: e.target.value })} placeholder="Plot 10, Medical Enclave" />

                  <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 rounded-xl font-medium mt-2">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {busy ? 'Submitting Registration...' : 'Request Hospital Registration'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* 3. DOCTOR LOGIN & REGISTER */}
          {activeRole === 'doctor' && (
            <>
              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="rounded-xl bg-emerald-50/80 p-3 text-xs text-emerald-900 border border-emerald-100 mb-2">
                    <strong>Hospital Verification:</strong> Please select your affiliated hospital. Doctor credentials are strictly validated against the chosen hospital.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      1. Select Your Hospital <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input w-full font-medium"
                      value={selectedHospital}
                      onChange={(e) => setSelectedHospital(e.target.value)}
                    >
                      <option value="">-- Choose your affiliated hospital --</option>
                      {hospitals.map((h) => (
                        <option key={h.hospital_id} value={h.hospital_id}>
                          {h.name} ({h.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <FormField
                    label="2. Doctor Email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="doctor@hospital.com"
                  />
                  <FormField
                    label="3. Password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                  />

                  <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 rounded-xl font-medium">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {busy ? 'Verifying Hospital & Credentials...' : 'Sign in as Doctor'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterDoctor} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Hospital to Join <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input w-full font-medium"
                      value={docForm.hospital_id}
                      onChange={(e) => setDocForm({ ...docForm, hospital_id: e.target.value })}
                    >
                      <option value="">-- Choose Hospital (Max 10 Doctors per hospital) --</option>
                      {hospitals.map((h) => (
                        <option key={h.hospital_id} value={h.hospital_id}>
                          {h.name} ({h.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <FormField label="Doctor Full Name" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} placeholder="Dr. Jane Doe" />
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
                      <select
                        className="input w-full"
                        value={docForm.specialization}
                        onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })}
                      >
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="General Medicine">General Medicine</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="Oncology">Oncology</option>
                      </select>
                    </div>
                    <FormField label="Phone" value={docForm.phone} onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })} placeholder="+91 98765 00000" />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <FormField label="Email" type="email" value={docForm.email} onChange={(e) => setDocForm({ ...docForm, email: e.target.value })} placeholder="doctor@hospital.com" />
                    <FormField label="Password" type="password" value={docForm.password} onChange={(e) => setDocForm({ ...docForm, password: e.target.value })} placeholder="••••••••" />
                  </div>

                  <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 rounded-xl font-medium mt-2">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {busy ? 'Registering Doctor...' : 'Register as Doctor'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* 4. PATIENT LOGIN & REGISTER */}
          {activeRole === 'patient' && (
            <>
              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <FormField
                    label="Patient Email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="patient@example.com"
                  />
                  <FormField
                    label="Password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                  />

                  <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 rounded-xl font-medium">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {busy ? 'Signing In...' : 'Sign in as Patient'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterPatient} className="space-y-3">
                  <div className="rounded-xl bg-amber-50/80 p-3 text-xs text-amber-900 border border-amber-100 mb-1">
                    <strong>Instant Patient Access:</strong> No admin approval needed. Access consultations, medical records, or transfer hospital care seamlessly.
                  </div>

                  <FormField label="Full Name" value={patForm.name} onChange={(e) => setPatForm({ ...patForm, name: e.target.value })} placeholder="Full Name" />

                  <div className="grid grid-cols-3 gap-2">
                    <FormField label="Age" type="number" min="0" max="120" value={patForm.age} onChange={(e) => setPatForm({ ...patForm, age: e.target.value })} />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                      <select className="input w-full" value={patForm.gender} onChange={(e) => setPatForm({ ...patForm, gender: e.target.value })}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                      <select className="input w-full" value={patForm.blood_group} onChange={(e) => setPatForm({ ...patForm, blood_group: e.target.value })}>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <FormField label="Phone Number" value={patForm.phone} onChange={(e) => setPatForm({ ...patForm, phone: e.target.value })} placeholder="+91 98765 00000" />
                    <FormField label="Email" type="email" value={patForm.email} onChange={(e) => setPatForm({ ...patForm, email: e.target.value })} placeholder="name@example.com" />
                  </div>

                  <FormField label="Create Password" type="password" value={patForm.password} onChange={(e) => setPatForm({ ...patForm, password: e.target.value })} placeholder="Min 8 characters" />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Primary Hospital</label>
                    <select
                      className="input w-full text-xs"
                      value={patForm.hospital_id}
                      onChange={(e) => setPatForm({ ...patForm, hospital_id: e.target.value })}
                    >
                      {hospitals.map((h) => (
                        <option key={h.hospital_id} value={h.hospital_id}>
                          {h.name} ({h.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 rounded-xl font-medium mt-2">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {busy ? 'Creating Patient Account...' : 'Register & Enter Portal'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Visitor / Quick Info */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="inline-flex p-2 rounded-lg bg-red-100 text-red-600 mb-2">
                <Siren className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-bold text-slate-800">Emergency Queue</h3>
              <p className="text-xs text-slate-500 mt-0.5">High-urgency emergency cases prioritized by Min-Heap</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveRole('patient')}
              className="mt-3 text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              Patient Sign In <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600 mb-2">
                <CalendarDays className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-bold text-slate-800">Book Appointment</h3>
              <p className="text-xs text-slate-500 mt-0.5">FIFO regular scheduling across 10 hospital branches</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveRole('patient');
                setAuthMode('register');
              }}
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Easy Patient Signup <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
