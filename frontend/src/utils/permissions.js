// Mirrors the backend rules so the UI can hide actions a role may not use.
// (The backend still enforces everything - hiding buttons is only for convenience.)
const RULES = {
  'patients.delete': ['admin', 'hospital'],
  'doctors.manage': ['admin', 'hospital'],
  'history.access': ['admin', 'hospital', 'doctor', 'patient'],
  'history.create': ['admin', 'hospital', 'doctor'],
  'prescriptions.access': ['admin', 'hospital', 'doctor', 'patient'],
  'prescriptions.create': ['admin', 'hospital', 'doctor'],
  'appointments.delete': ['admin', 'hospital', 'receptionist'],
  'reports.access': ['admin', 'hospital'],
  'users.manage': ['admin'],
  'hospitals.manage': ['admin'],
  'approvals.manage': ['admin'],
};

export const can = (role, action) => (RULES[action] ? RULES[action].includes(role) : true);

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/patients', label: 'Patients', icon: 'Users', roles: ['admin', 'hospital', 'doctor', 'receptionist'] },
  { to: '/appointments', label: 'Appointments', icon: 'CalendarDays' },
  { to: '/emergency', label: 'Emergency Queue', icon: 'Siren' },
  { to: '/history', label: 'Medical History', icon: 'ClipboardList', roles: ['admin', 'hospital', 'doctor', 'patient'] },
  { to: '/prescriptions', label: 'Prescriptions', icon: 'Pill', roles: ['admin', 'hospital', 'doctor', 'patient'] },
  { to: '/doctors', label: 'Doctors', icon: 'Stethoscope' },
  { to: '/hospitals', label: 'Hospitals', icon: 'Building2', roles: ['admin'] },
  { to: '/dsa', label: 'DSA Demonstration', icon: 'Network' },
  { to: '/reports', label: 'Reports', icon: 'BarChart3', roles: ['admin', 'hospital'] },
  { to: '/settings', label: 'Settings', icon: 'Settings' },
];
