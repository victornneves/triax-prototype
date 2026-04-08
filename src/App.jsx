import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './styles/tokens.css';
import awsConfig from './aws-config';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtocolTriage from './components/ProtocolTriage';
import HistoryPage from './components/HistoryPage';
import Header from './components/Header';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import RequireAdmin from './components/RequireAdmin';
import { UserProvider, useUser } from './contexts/UserContext';
import { ToastProvider } from './components/ui/ToastProvider';
import './App.css';

Amplify.configure(awsConfig);

function AppContent({ signOut }) {
    const { error } = useUser();

    if (error) {
        return (
            <div className="app-error">
                <h1 className="app-error__title">Erro de Autenticacao</h1>
                <p className="app-error__message">
                    Sua sessao expirou ou ocorreu um erro de autenticacao.
                    Por favor, tente novamente.
                </p>
                <button
                    onClick={signOut}
                    className="app-error__button"
                >
                    Sair e tentar novamente
                </button>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <div className="app-container" data-app-theme="light">
                <Header signOut={signOut} />

                <main className="app-main">
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
                <ToastProvider>
                    <UserProvider>
                        <AppContent signOut={signOut} />
                    </UserProvider>
                </ToastProvider>
            )}
        </Authenticator>
    );
}

export default App;
