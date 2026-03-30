import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsConfig from './aws-config';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtocolTriage from './components/ProtocolTriage';
import HistoryPage from './components/HistoryPage';
import Header from './components/Header';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import RequireAdmin from './components/RequireAdmin';
import { UserProvider, useUser } from './contexts/UserContext';
import './App.css';

Amplify.configure(awsConfig);

function AppContent({ signOut }) {
    const { error } = useUser();

    if (error) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                alignItems: 'center', height: '100vh', padding: '2rem',
                backgroundColor: '#f8f9fa', textAlign: 'center'
            }}>
                <h1 style={{ color: '#dc3545', marginBottom: '1rem' }}>Erro de Autenticacao</h1>
                <p style={{ fontSize: '1.1rem', color: '#333', marginBottom: '1.5rem' }}>
                    Sua sessao expirou ou ocorreu um erro de autenticacao.
                    Por favor, tente novamente.
                </p>
                <button
                    onClick={signOut}
                    style={{
                        padding: '0.75rem 1.5rem', backgroundColor: '#dc3545',
                        color: 'white', border: 'none', borderRadius: '4px',
                        cursor: 'pointer', fontSize: '1rem'
                    }}
                >
                    Sair e tentar novamente
                </button>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <Header signOut={signOut} />

                <main style={{ flex: 1, overflow: 'auto', position: 'relative', backgroundColor: '#f8f9fa' }}>
                    <Routes>
                        <Route path="/" element={<ProtocolTriage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

function App() {
    return (
        <Authenticator>
            {({ signOut, user }) => (
                <UserProvider>
                    <AppContent signOut={signOut} />
                </UserProvider>
            )}
        </Authenticator>
    );
}

export default App;
