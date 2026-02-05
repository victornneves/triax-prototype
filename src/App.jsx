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
import { UserProvider } from './contexts/UserContext';
import './App.css';

Amplify.configure(awsConfig);

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <UserProvider>
          <BrowserRouter>
            <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
              <Header signOut={signOut} />

              <main style={{ flex: 1, overflow: 'auto', position: 'relative', backgroundColor: '#f8f9fa' }}>
                <Routes>
                  <Route path="/" element={<ProtocolTriage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </UserProvider>
      )}
    </Authenticator>
  );
}

export default App;
