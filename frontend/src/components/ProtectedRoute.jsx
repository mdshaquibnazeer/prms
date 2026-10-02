import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingBlock } from './Feedback';
import { ShieldAlert } from 'lucide-react';
import { EmptyState } from './Feedback';

/** Redirects to /login when logged out; shows an access message if the role is not allowed. */
export default function ProtectedRoute({ roles, children }) {
  const { user, booting } = useAuth();
  const location = useLocation();
  if (booting) return <div className="mx-auto max-w-md pt-20"><LoadingBlock text="Checking your session..." rows={2} /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card mx-auto mt-10 max-w-lg">
        <EmptyState icon={ShieldAlert} title="You do not have access to this page" hint={`Your role (${user.role}) cannot open this section. Ask an administrator if you need access.`} />
      </div>
    );
  }
  return children;
}
