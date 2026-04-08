import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ui/ToastProvider';
import './HistoryPage.css';

const API_URL = import.meta.env.VITE_API_URL;

function resolvePriorityBanner(triageResult) {
    const p = (
        triageResult?.prioridade ||
        triageResult?.cor ||
        triageResult?.priority ||
        ''
    ).toLowerCase();

    if (p.includes('red') || p.includes('vermelho'))   return 'priority-red';
    if (p.includes('orange') || p.includes('laranja')) return 'priority-orange';
    if (p.includes('yellow') || p.includes('amarelo')) return 'priority-yellow';
    if (p.includes('green') || p.includes('verde'))    return 'priority-green';
    return 'priority-blue';
}

const HistoryPage = () => {
    const toast = useToast();
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
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (error) {
            console.error("Falha ao gerar PDF:", error);
            toast.error("Erro ao gerar PDF. Tente novamente.");
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
            toast.error("Erro ao carregar detalhes da sessão.");
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div className="history-page">
            <div className="history-page__header">
                <h1 className="history-page__title">Histórico de Triagens</h1>
                <button
                    onClick={() => navigate('/')}
                    className="history-page__back-btn"
                >
                    Voltar para Início
                </button>
            </div>

            <div className="history-page__layout">
                {/* List Column */}
                <div className="history-page__list-col">
                    {loading ? (
                        <p className="history-page__loading">Carregando histórico...</p>
                    ) : sessions.length === 0 ? (
                        <p className="history-page__empty">Nenhuma triagem encontrada.</p>
                    ) : (
                        <table className="history-page__table">
                            <caption>Lista de triagens realizadas</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Data</th>
                                    <th scope="col">Hora</th>
                                    <th scope="col">ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((item) => {
                                    const isActive = selectedSession?.session_id === item.key.split('/').pop().replace('.json', '');
                                    return (
                                        <tr
                                            key={item.key}
                                            onClick={() => handleSelectSession(item.key)}
                                            className={`history-page__session-row${isActive ? ' history-page__session-row--active' : ''}`}
                                        >
                                            <td className="history-page__session-date">
                                                {new Date(item.lastModified).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                            </td>
                                            <td className="history-page__session-time">
                                                {new Date(item.lastModified).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="history-page__session-id">
                                                {item.key.split('/').pop().replace('.json', '').substring(0, 15)}...
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Detail Column */}
                <div className="history-page__detail-col">
                    {detailLoading ? (
                        <div className="history-page__detail-loading">
                            <p>Carregando detalhes...</p>
                        </div>
                    ) : selectedSession ? (
                        <div className="history-page__detail-card">
                            {(() => {
                                const priorityClass = resolvePriorityBanner(selectedSession.triage_result);
                                const isYellow = priorityClass === 'priority-yellow';
                                return (
                                    <div className={`history-page__priority-banner priority-badge ${priorityClass}${isYellow ? ' history-page__priority-banner--yellow' : ''}`}>
                                        <h2 className="history-page__discriminator">
                                            {selectedSession.triage_result?.discriminador || 'Discriminador Indisponivel'}
                                        </h2>
                                        <p className="history-page__priority-label">
                                            Prioridade: {selectedSession.triage_result?.prioridade || selectedSession.triage_result?.priority || 'N/A'}
                                        </p>
                                    </div>
                                );
                            })()}

                            <div className="history-page__info-row">
                                <div className="history-page__info-card">
                                    <h4 className="history-page__info-label">Paciente</h4>
                                    <p className="history-page__info-name">
                                        {selectedSession.patient_info?.name || 'N/A'}
                                    </p>
                                    <p className="history-page__info-meta">
                                        {selectedSession.patient_info?.age} Anos • {selectedSession.patient_info?.sex === 'M' ? 'Masculino' : 'Feminino'}
                                    </p>
                                </div>
                                <div className="history-page__info-card">
                                    <h4 className="history-page__info-label">Protocolo / Fluxograma</h4>
                                    <p className="history-page__info-name history-page__info-name--medium">
                                        {selectedSession.triage_result?.fluxograma_sintoma || selectedSession.triage_result?.protocol?.replace('protocol_', '') || 'N/A'}
                                    </p>
                                </div>
                                <div className="history-page__pdf-btn-wrap">
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={pdfLoading}
                                        className="history-page__pdf-btn"
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
                                <div className="history-page__clinical-grid">
                                    <div>
                                        <h5 className="history-page__clinical-label">QUEIXA PRINCIPAL</h5>
                                        <p className="history-page__clinical-value">{selectedSession.clinical_data.queixa_principal || '-'}</p>
                                    </div>
                                    <div>
                                        <h5 className="history-page__clinical-label">ESPECIALIDADE</h5>
                                        <p className="history-page__clinical-value history-page__clinical-value--semibold">{selectedSession.clinical_data.especialidade || '-'}</p>
                                    </div>
                                    <div className="history-page__clinical-item">
                                        <h5 className="history-page__clinical-label history-page__clinical-label--alert">ALERGIAS</h5>
                                        <p className="history-page__clinical-value">{selectedSession.clinical_data.alergias || 'Nega'}</p>
                                    </div>
                                    <div className="history-page__clinical-item">
                                        <h5 className="history-page__clinical-label">MEDICAMENTOS</h5>
                                        <p className="history-page__clinical-value">{selectedSession.clinical_data.medicamentos || 'Nega'}</p>
                                    </div>
                                </div>
                            )}

                            <hr className="history-page__divider" />

                            <div className="history-page__reasoning-section">
                                <h4 className="history-page__section-title">Raciocínio Clínico</h4>
                                <p className="history-page__reasoning-text">
                                    {selectedSession.reasoning}
                                </p>
                            </div>

                            <div className="history-page__stats-row">
                                <div>
                                    <strong>Início:</strong> {selectedSession.stats?.start_time ? new Date(selectedSession.stats.start_time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}
                                </div>
                                <div>
                                    <strong>Duração:</strong> {selectedSession.stats?.duration_seconds}s
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="history-page__empty-state">
                            <h2 className="history-page__empty-state-title">Nenhuma triagem realizada</h2>
                            <p className="history-page__empty-state-body">As triagens realizadas aparecem aqui apos a conclusao.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
