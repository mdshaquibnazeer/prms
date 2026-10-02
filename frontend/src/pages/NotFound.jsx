import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { EmptyState } from '../components/Feedback';

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-lg">
      <EmptyState icon={SearchX} title="Page not found" hint="The page you are looking for does not exist or has moved."
        action={<Link to="/dashboard" className="btn-primary">Go to dashboard</Link>} />
    </div>
  );
}
