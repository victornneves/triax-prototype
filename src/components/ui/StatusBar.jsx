import { useState, useEffect } from 'react';
import './StatusBar.css';

export function StatusBar({ sessionId, protocolName }) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div className="status-bar" role="status" aria-live="polite">
      <span className="status-bar__session">
        Sessao: {sessionId ? `${sessionId.slice(0, 8)}...` : '\u2014'}
      </span>
      <span className="status-bar__separator">&middot;</span>
      <span className="status-bar__protocol">
        {protocolName
          ? (protocolName.length > 24 ? protocolName.slice(0, 24) + '\u2026' : protocolName)
          : 'Selecionar protocolo'}
      </span>
      <span className="status-bar__separator">&middot;</span>
      <span className={`status-bar__connection status-bar__connection--${online ? 'online' : 'offline'}`}>
        <span className="status-bar__dot" aria-hidden="true" />
        {online ? 'Conectado' : 'Sem conexao'}
      </span>
    </div>
  );
}
