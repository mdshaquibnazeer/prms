import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientFormPage from './pages/PatientFormPage';
import PatientDetails from './pages/PatientDetails';
import Appointments from './pages/Appointments';
import EmergencyQueue from './pages/EmergencyQueue';
import MedicalHistory from './pages/MedicalHistory';
import Prescriptions from './pages/Prescriptions';
import Doctors from './pages/Doctors';
import DsaDemo from './pages/DsaDemo';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Hospitals from './pages/Hospitals';
import NotFound from './pages/NotFound';

const CLINICAL = ['admin', 'hospital', 'doctor', 'patient'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/new" element={<PatientFormPage />} />
        <Route path="/patients/:id" element={<PatientDetails />} />
        <Route path="/patients/:id/edit" element={<PatientFormPage />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/emergency" element={<EmergencyQueue />} />
        <Route path="/history" element={<ProtectedRoute roles={CLINICAL}><MedicalHistory /></ProtectedRoute>} />
        <Route path="/prescriptions" element={<ProtectedRoute roles={CLINICAL}><Prescriptions /></ProtectedRoute>} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/hospitals" element={<ProtectedRoute roles={['admin']}><Hospitals /></ProtectedRoute>} />
        <Route path="/dsa" element={<DsaDemo />} />
        <Route path="/reports" element={<ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
