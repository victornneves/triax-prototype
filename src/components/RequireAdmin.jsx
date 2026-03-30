import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

function RequireAdmin({ children }) {
    const { userProfile, loading } = useUser();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '2rem' }}>
                <p>Carregando...</p>
            </div>
        );
    }

    if (userProfile?.effective_role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default RequireAdmin;
