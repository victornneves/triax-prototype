import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const Header = ({ signOut }) => {
    const { userProfile, loading } = useUser();
    const navigate = useNavigate();

    const getRoleBadgeColor = (role) => {
        const r = role?.toLowerCase();
        if (r === 'admin') return '#dc3545'; // Red
        if (r === 'tenant_admin') return '#fd7e14'; // Orange
        if (r === 'doctor' || r === 'medico') return '#0d6efd'; // Blue
        if (r === 'nurse' || r === 'enfermeiro') return '#198754'; // Green
        return '#6c757d'; // Grey
    };

    return (
        <header className="app-header" style={{
            height: '64px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 1.5rem',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e9ecef',
            flexShrink: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Triax
                    </h2>
                </Link>
                <nav style={{ display: 'flex', gap: '1.5rem' }}>
                    <Link
                        to="/"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            cursor: 'pointer',
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            transition: 'all 0.2s',
                            backgroundColor: '#f1f3f5',
                            color: '#495057',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e9ecef';
                            e.currentTarget.style.color = '#212529';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f1f3f5';
                            e.currentTarget.style.color = '#495057';
                        }}
                    >
                        Nova Triagem
                    </Link>
                    {userProfile?.effective_role === 'admin' && (
                        <Link to="/admin/users" style={{ textDecoration: 'none', color: '#495057', fontWeight: 500, fontSize: '0.95rem' }}>Usuários</Link>
                    )}
                </nav>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {loading ? (
                    <span style={{ fontSize: '0.85rem', color: '#adb5bd' }}>Carregando perfil...</span>
                ) : userProfile ? (
                    <div
                        onClick={() => navigate('/profile')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            cursor: 'pointer',
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            transition: 'all 0.2s',
                            backgroundColor: '#f1f3f5',
                            color: '#495057',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e9ecef';
                            e.currentTarget.style.color = '#212529';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f1f3f5';
                            e.currentTarget.style.color = '#495057';
                        }}
                    >
                        Histórico de Triagens
                    </div>
                ) : (
                    // Fallback if profile fails
                    <span>Usuário Conectado</span>
                )}

                <button
                    onClick={signOut}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'transparent',
                        color: '#dc3545',
                        border: '1px solid #dc3545',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc3545';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#dc3545';
                    }}
                >
                    Sair
                </button>
            </div>
        </header>
    );
};

export default Header;
