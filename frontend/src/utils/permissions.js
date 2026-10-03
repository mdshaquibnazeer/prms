// Mirrors the backend rules so the UI can hide actions a role may not use.
// (The backend still enforces everything - hiding buttons is only for convenience.)
const RULES = {
  'patients.delete': ['admin', 'hospital'],
  'doctors.manage': ['admin', 'hospital'],
  'history.access': ['hospital', 'doctor', 'patient'],
  'history.create': ['hospital', 'doctor'],
  'prescriptions.access': ['hospital', 'doctor', 'patient'],
  'prescriptions.create': ['hospital', 'doctor'],
  'appointments.delete': ['hospital', 'receptionist'],
  'reports.access': ['hospital'],
  'users.manage': ['admin'],
  'hospitals.manage': ['admin'],
  'approvals.manage': ['admin'],
};

export const can = (role, action) => (RULES[action] ? RULES[action].includes(role) : true);

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/hospitals', label: 'Hospitals', icon: 'Building2', roles: ['admin'] },
  { to: '/patients', label: 'Patients', icon: 'Users', roles: ['admin', 'hospital', 'doctor', 'receptionist'] },
  { to: '/doctors', label: 'Doctors', icon: 'Stethoscope', roles: ['admin', 'hospital'] },
  { to: '/appointments', label: 'Appointments', icon: 'CalendarDays', roles: ['hospital', 'doctor', 'receptionist', 'patient'] },
  { to: '/emergency', label: 'Emergency Queue', icon: 'Siren', roles: ['hospital', 'doctor', 'receptionist'] },
  { to: '/history', label: 'Medical History', icon: 'ClipboardList', roles: ['hospital', 'doctor', 'patient'] },
  { to: '/prescriptions', label: 'Prescriptions', icon: 'Pill', roles: ['hospital', 'doctor', 'patient'] },
  { to: '/reports', label: 'Reports', icon: 'BarChart3', roles: ['hospital'] },
  { to: '/dsa', label: 'DSA Demonstration', icon: 'Network', roles: ['hospital', 'doctor'] },
  { to: '/settings', label: 'Settings', icon: 'Settings' },
];
