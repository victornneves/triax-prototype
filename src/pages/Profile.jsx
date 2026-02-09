import React, { useEffect, useState } from 'react';

import { fetchAuthSession } from 'aws-amplify/auth';
import TriageDetailsModal from '../components/TriageDetailsModal';

const API_URL = import.meta.env.VITE_API_URL;

const Profile = () => {

    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedSessionKey, setSelectedSessionKey] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const session = await fetchAuthSession();
                const token = session.tokens?.idToken?.toString();

                const response = await fetch(`${API_URL}/history`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const sortedSessions = (data.sessions || []).sort((a, b) => {
                        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
                        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
                        return dateB - dateA;
                    });
                    setHistory(sortedSessions);
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, []);

    const formatDateFromKey = (key) => {
        if (!key) return '-';
        try {
            // key example: default/UUID/YEAR/MONTH/DAY/session-TIMESTAMP-RANDOM.json
            const filename = key.split('/').pop();
            const parts = filename.split('-');
            if (parts.length < 2) return '-';

            const timestamp = parseInt(parts[1], 10);
            if (isNaN(timestamp)) return '-';

            const date = new Date(timestamp);
            return date.toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error("Error parsing date from key", key, e);
            return '-';
        }
    };



    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>

            {/* Section B: History */}
            <section style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid #e9ecef'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f8f9fa', paddingBottom: '0.8rem' }}>
                    <h3 style={{ margin: 0, color: '#495057', fontSize: '1.2rem' }}>
                        Histórico de Triagens
                    </h3>
                    <button
                        onClick={() => window.location.reload()} // Simple refresh for now or implement refine fetch
                        style={{ background: 'none', border: 'none', color: '#0d6efd', cursor: 'pointer', fontWeight: 500 }}
                    >
                        Atualizar
                    </button>
                </div>

                {loadingHistory ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#adb5bd' }}>Carregando histórico...</div>
                ) : history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#adb5bd' }}>Nenhuma triagem encontrada.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f1f3f5' }}>
                                    <th style={{ padding: '1rem', color: '#495057', fontSize: '0.9rem' }}>Data</th>
                                    <th style={{ padding: '1rem', color: '#495057', fontSize: '0.9rem' }}>Paciente</th>
                                    <th style={{ padding: '1rem', color: '#495057', fontSize: '0.9rem' }}>Protocolo</th>
                                    <th style={{ padding: '1rem', color: '#495057', fontSize: '0.9rem' }}>Prioridade</th>
                                    <th style={{ padding: '1rem', color: '#495057', fontSize: '0.9rem' }}>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f8f9fa' }}>
                                        <td style={{ padding: '1rem', color: '#212529', fontWeight: 500 }}>
                                            {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#495057' }}>
                                            <div style={{ fontWeight: 500 }}>{item.patient_info?.name || 'Anonimo'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#868e96' }}>
                                                {item.patient_info?.age ? `${item.patient_info.age} anos` : ''}
                                                {item.patient_info?.sex ? ` • ${item.patient_info.sex}` : ''}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#495057' }}>
                                            {item.triage_result?.protocol ? item.triage_result.protocol.replace(/_/g, ' ') : '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {(() => {
                                                const p = item.triage_result?.priority?.toLowerCase();
                                                const colors = {
                                                    red: { bg: '#dc3545', text: '#fff', label: 'Vermelho' },
                                                    orange: { bg: '#fd7e14', text: '#fff', label: 'Laranja' },
                                                    yellow: { bg: '#ffc107', text: '#000', label: 'Amarelo' },
                                                    green: { bg: '#198754', text: '#fff', label: 'Verde' },
                                                    blue: { bg: '#0d6efd', text: '#fff', label: 'Azul' }
                                                };
                                                const style = colors[p] || { bg: '#e9ecef', text: '#495057', label: p || 'N/A' };
                                                return (
                                                    <span style={{
                                                        backgroundColor: style.bg,
                                                        color: style.text,
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {style.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => setSelectedSessionKey(item.session_id)}
                                                style={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #dee2e6',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    color: '#0d6efd',
                                                    fontWeight: 500,
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#0d6efd';
                                                    e.currentTarget.style.color = '#fff';
                                                    e.currentTarget.style.borderColor = '#0d6efd';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#fff';
                                                    e.currentTarget.style.color = '#0d6efd';
                                                    e.currentTarget.style.borderColor = '#dee2e6';
                                                }}
                                            >
                                                Visualizar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
                }
            </section >

            {/* Modal */}
            {
                selectedSessionKey && (
                    <TriageDetailsModal
                        sessionKey={selectedSessionKey}
                        onClose={() => setSelectedSessionKey(null)}
                    />
                )
            }
        </div >
    );
};

export default Profile;
