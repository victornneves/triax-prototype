import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsConfig from './aws-config';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ProtocolTriage from './components/ProtocolTriage';
import HistoryPage from './components/HistoryPage';
import './App.css';

Amplify.configure(awsConfig);

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <BrowserRouter>
          <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <header className="app-header" style={{
              height: '64px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 1.5rem',
              backgroundColor: '#f8f9fa', // Lighter background for a cleaner header
              borderBottom: '1px solid #dee2e6',
              flexShrink: 0 // Prevent header from shrinking
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Triax - Sistema de Triagem Inteligente</h2>
                <nav style={{ display: 'flex', gap: '1rem' }}>
                  <Link to="/" style={{ textDecoration: 'none', color: '#495057', fontWeight: 500 }}>Triagem</Link>
                  <Link to="/history" style={{ textDecoration: 'none', color: '#495057', fontWeight: 500 }}>Histórico</Link>
                </nav>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>Usuário: <strong>{user?.signInDetails?.loginId || user?.username}</strong></span>
                <button
                  onClick={signOut}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Sair
                </button>
              </div>
            </header>

            <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <Routes>
                <Route path="/" element={<ProtocolTriage />} />
                <Route path="/history" element={<HistoryPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      )}
    </Authenticator>
  );
}

export default App;
