import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './RequireAdmin.css';

function RequireAdmin({ children }) {
    const { userProfile, loading } = useUser();

    if (loading) {
        return (
            <div className="require-admin-loading">
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
