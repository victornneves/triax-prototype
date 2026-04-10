import React, { useEffect, useState } from 'react';

import { getAuthHeaders } from '../utils/auth';
import { resolvePriority } from '../utils/priority';
import TriageDetailsModal from '../components/TriageDetailsModal';
import './Profile.css';

const API_URL = import.meta.env.VITE_API_URL;

const Profile = () => {

    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedSessionKey, setSelectedSessionKey] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const headers = await getAuthHeaders();

                const response = await fetch(`${API_URL}/history`, {
                    headers: headers
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

    return (
        <div className="profile-page">

            {/* Section B: History */}
            <section className="profile-card">
                <div className="profile-card__header">
                    <h3 className="profile-card__title">
                        Histórico de Triagens
                    </h3>
                    <button
                        onClick={() => window.location.reload()}
                        className="profile-card__refresh-btn"
                    >
                        Atualizar
                    </button>
                </div>

                {loadingHistory ? (
                    <div className="profile-loading">Carregando histórico...</div>
                ) : history.length === 0 ? (
                    <div className="profile-empty">Nenhuma triagem encontrada.</div>
                ) : (
                    <div className="profile-table-wrap">
                        <table className="profile-table">
                            <caption>Historico de triagens do usuario</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Data</th>
                                    <th scope="col">Paciente</th>
                                    <th scope="col">Protocolo</th>
                                    <th scope="col">Prioridade</th>
                                    <th scope="col">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item, idx) => {
                                    const priority = resolvePriority(item.triage_result || {});
                                    return (
                                        <tr key={idx}>
                                            <td className="profile-table__date">
                                                {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}
                                            </td>
                                            <td>
                                                <div className="profile-table__patient-name">{item.patient_info?.name || 'Anonimo'}</div>
                                                <div className="profile-table__patient-meta">
                                                    {item.patient_info?.age ? `${item.patient_info.age} anos` : ''}
                                                    {item.patient_info?.sex ? ` • ${item.patient_info.sex}` : ''}
                                                </div>
                                            </td>
                                            <td className="profile-table__protocol">
                                                {item.triage_result?.fluxograma_sintoma || item.triage_result?.protocol?.replace(/_/g, ' ') || '-'}
                                            </td>
                                            <td>
                                                <span className={priority.className}>
                                                    {priority.label}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => setSelectedSessionKey(item.session_id)}
                                                    className="profile-table__view-btn"
                                                >
                                                    Visualizar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
                }
            </section>

            {/* Modal */}
            {
                selectedSessionKey && (
                    <TriageDetailsModal
                        sessionKey={selectedSessionKey}
                        onClose={() => setSelectedSessionKey(null)}
                    />
                )
            }
        </div>
    );
};

export default Profile;
