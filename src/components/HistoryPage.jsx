import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const HistoryPage = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadSessions();
    }, []);

    const handleDownloadPDF = async () => {
        if (!selectedSession) return;
        setPdfLoading(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/history/${selectedSession.session_id}/pdf`, {
                method: 'GET',
                headers: headers
            });
            if (!response.ok) throw new Error('Erro ao buscar PDF');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Falha ao gerar PDF:", error);
            alert("Erro ao gerar PDF. Tente novamente.");
        } finally {
            setPdfLoading(false);
        }
    };

    const loadSessions = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/history`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) throw new Error("Failed to fetch history");

            const data = await response.json();
            // Expected format: { sessions: [ { key, lastModified, size }, ... ] }

            setSessions(data.sessions || []);

        } catch (error) {
            console.error("Error listing sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSession = async (key) => {
        setDetailLoading(true);
        setSelectedSession(null);
        try {
            const headers = await getAuthHeaders();
            // Encode key properly
            const encodedKey = encodeURIComponent(key);
            const response = await fetch(`${API_URL}/history?key=${encodedKey}`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) throw new Error("Failed to fetch details");

            const json = await response.json();
            setSelectedSession(json);
        } catch (error) {
            console.error("Error fetching session details:", error);
            alert("Erro ao carregar detalhes da sessão.");
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0 }}>Histórico de Triagens</h1>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Voltar para Início
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', height: 'calc(100vh - 150px)' }}>
                {/* List Column */}
                <div style={{
                    borderRight: '1px solid #dee2e6',
                    paddingRight: '1rem',
                    overflowY: 'auto'
                }}>
                    {loading ? (
                        <p>Carregando histórico...</p>
                    ) : sessions.length === 0 ? (
                        <p>Nenhuma triagem encontrada.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {sessions.map((item) => (
                                <div
                                    key={item.key}
                                    onClick={() => handleSelectSession(item.key)}
                                    style={{
                                        padding: '1rem',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedSession?.session_id === item.key.split('/').pop().replace('.json', '')
                                            ? '#e7f1ff' : '#fff',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                        {new Date(item.lastModified).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                        {new Date(item.lastModified).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                                        ID: {item.key.split('/').pop().replace('.json', '').substring(0, 15)}...
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail Column */}
                <div style={{ overflowY: 'auto', paddingLeft: '1rem' }}>
                    {detailLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <p>Carregando detalhes...</p>
                        </div>
                    ) : selectedSession ? (
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            padding: '2rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{
                                padding: '1rem',
                                borderRadius: '8px',
                                marginBottom: '1.5rem',
                                color: 'white',
                                backgroundColor:
                                    (() => {
                                        const p = (selectedSession.triage_result?.prioridade || selectedSession.triage_result?.cor || selectedSession.triage_result?.priority || '').toLowerCase();
                                        if (p.includes('red') || p.includes('vermelho')) return '#dc3545';
                                        if (p.includes('orange') || p.includes('laranja')) return '#fd7e14';
                                        if (p.includes('yellow') || p.includes('amarelo')) return '#ffc107';
                                        if (p.includes('green') || p.includes('verde')) return '#198754';
                                        return '#0d6efd';
                                    })()
                            }}>
                                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{selectedSession.triage_result?.discriminador || 'Discriminador Indisponivel'}</h2>
                                <p style={{ margin: '0.5rem 0 0' }}>Prioridade: {selectedSession.triage_result?.prioridade || selectedSession.triage_result?.priority || 'N/A'}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ flex: 1, padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                    <h4 style={{ color: '#6c757d', marginBottom: '0.5rem' }}>Paciente</h4>
                                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                                        {selectedSession.patient_info?.name || 'N/A'}
                                    </p>
                                    <p style={{ margin: 0, color: '#666' }}>
                                        {selectedSession.patient_info?.age} Anos • {selectedSession.patient_info?.sex === 'M' ? 'Masculino' : 'Feminino'}
                                    </p>
                                </div>
                                <div style={{ flex: 1, padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                    <h4 style={{ color: '#6c757d', marginBottom: '0.5rem' }}>Protocolo / Fluxograma</h4>
                                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
                                        {selectedSession.triage_result?.fluxograma_sintoma || selectedSession.triage_result?.protocol?.replace('protocol_', '') || 'N/A'}
                                    </p>
                                </div>
                                <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'stretch' }}>
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={pdfLoading}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            padding: '0 1.5rem',
                                            background: '#fff',
                                            color: '#dc3545',
                                            border: '2px solid #dc3545',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            fontSize: '0.8rem',
                                            transition: 'all 0.2s',
                                            opacity: pdfLoading ? 0.7 : 1
                                        }}
                                        onMouseOver={(e) => {
                                            if (!pdfLoading) {
                                                e.currentTarget.style.background = '#dc3545';
                                                e.currentTarget.style.color = '#fff';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (!pdfLoading) {
                                                e.currentTarget.style.background = '#fff';
                                                e.currentTarget.style.color = '#dc3545';
                                            }
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        {pdfLoading ? 'Gerando...' : 'PDF'}
                                    </button>
                                </div>
                            </div>

                            {selectedSession.clinical_data && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <div>
                                        <h5 style={{ margin: '0 0 0.25rem 0', color: '#6c757d', fontSize: '0.8rem' }}>QUEIXA PRINCIPAL</h5>
                                        <p style={{ margin: 0 }}>{selectedSession.clinical_data.queixa_principal || '-'}</p>
                                    </div>
                                    <div>
                                        <h5 style={{ margin: '0 0 0.25rem 0', color: '#6c757d', fontSize: '0.8rem' }}>ESPECIALIDADE</h5>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{selectedSession.clinical_data.especialidade || '-'}</p>
                                    </div>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <h5 style={{ margin: '0 0 0.25rem 0', color: '#dc3545', fontSize: '0.8rem' }}>ALERGIAS</h5>
                                        <p style={{ margin: 0 }}>{selectedSession.clinical_data.alergias || 'Nega'}</p>
                                    </div>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <h5 style={{ margin: '0 0 0.25rem 0', color: '#6c757d', fontSize: '0.8rem' }}>MEDICAMENTOS</h5>
                                        <p style={{ margin: 0 }}>{selectedSession.clinical_data.medicamentos || 'Nega'}</p>
                                    </div>
                                </div>
                            )}

                            <hr style={{ border: 'none', borderTop: '1px solid #dee2e6', margin: '1.5rem 0' }} />

                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ color: '#6c757d', marginBottom: '0.5rem' }}>Raciocínio Clínico</h4>
                                <p style={{ lineHeight: 1.6, backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                                    {selectedSession.reasoning}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#666' }}>
                                <div>
                                    <strong>Início:</strong> {selectedSession.stats?.start_time ? new Date(selectedSession.stats.start_time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}
                                </div>
                                <div>
                                    <strong>Duração:</strong> {selectedSession.stats?.duration_seconds}s
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                            <p>Selecione uma triagem para ver os detalhes</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
