// Mirrors the backend rules so the UI can hide actions a role may not use.
// (The backend still enforces everything - hiding buttons is only for convenience.)
const RULES = {
  'patients.delete': ['admin'],
  'doctors.manage': ['admin'],
  'history.access': ['admin', 'doctor'],
  'prescriptions.access': ['admin', 'doctor'],
  'appointments.delete': ['admin', 'receptionist'],
  'reports.access': ['admin'],
  'users.manage': ['admin'],
};
export const can = (role, action) => (RULES[action] ? RULES[action].includes(role) : true);

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/patients', label: 'Patients', icon: 'Users' },
  { to: '/appointments', label: 'Appointments', icon: 'CalendarDays' },
  { to: '/emergency', label: 'Emergency Queue', icon: 'Siren' },
  { to: '/history', label: 'Medical History', icon: 'ClipboardList', roles: ['admin', 'doctor'] },
  { to: '/prescriptions', label: 'Prescriptions', icon: 'Pill', roles: ['admin', 'doctor'] },
  { to: '/doctors', label: 'Doctors', icon: 'Stethoscope' },
  { to: '/dsa', label: 'DSA Demonstration', icon: 'Network' },
  { to: '/reports', label: 'Reports', icon: 'BarChart3', roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: 'Settings' },
];
