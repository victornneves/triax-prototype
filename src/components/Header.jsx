import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './Header.css';

const Header = ({ signOut }) => {
    const { userProfile, loading } = useUser();

    return (
        <header className="app-header">
            <div className="header-left">
                <Link to="/" className="header-brand-link">
                    <h2 className="header-brand">
                        Triax
                    </h2>
                </Link>
                <nav className="header-nav">
                    <Link
                        to="/"
                        className="header-nav-link"
                    >
                        Nova Triagem
                    </Link>
                    {userProfile?.effective_role === 'admin' && (
                        <Link to="/admin/users" className="header-admin-link">Usuários</Link>
                    )}
                </nav>
            </div>

            <div className="header-right">
                {loading ? (
                    <span className="header-loading-text">Carregando perfil...</span>
                ) : userProfile ? (
                    <Link
                        to="/profile"
                        className="header-profile-link"
                    >
                        Histórico de Triagens
                    </Link>
                ) : (
                    // Fallback if profile fails
                    <span>Usuário Conectado</span>
                )}

                <button
                    onClick={signOut}
                    className="header-signout-btn"
                >
                    Sair
                </button>
            </div>
        </header>
    );
};

export default Header;
