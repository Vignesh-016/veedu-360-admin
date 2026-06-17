import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

function Landing() {
    const { user, loading } = useAuth();
    
    if (loading) return <LoadingSpinner />;

    if (!user) return <Navigate to="/login" />;

    if (user) return <Navigate to="/dashboard" />;

    return <LoadingSpinner />;

}

export default Landing;
