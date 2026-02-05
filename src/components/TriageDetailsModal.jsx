import React, { useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_URL;

const TriageDetailsModal = ({ sessionKey, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('triage');

    useEffect(() => {
        if (!sessionKey) return;

        const fetchDetails = async () => {
            try {
                const session = await fetchAuthSession();
                const token = session.tokens?.idToken?.toString();
                const encodedKey = encodeURIComponent(sessionKey);

                const response = await fetch(`${API_URL}/history?key=${encodedKey}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to load details');
                }

                const data = await response.json();
                setDetails(data);
            } catch (err) {
                console.error(err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [sessionKey]);

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '-';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h}h ${m}m ${s}s`;
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'red': return '#dc3545';
            case 'orange': return '#fd7e14';
            case 'yellow': return '#ffc107';
            case 'green': return '#198754';
            case 'blue': return '#0d6efd';
            default: return '#6c757d';
        }
    };

    const getPriorityBg = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'red': return '#ffeaea';
            case 'orange': return '#fff5e6';
            case 'yellow': return '#fff9db';
            case 'green': return '#e8f5e9';
            case 'blue': return '#e7f1ff';
            default: return '#f8f9fa';
        }
    };

    const formatProtocolName = (protocolString) => {
        if (!protocolString) return 'N/A';
        let cleaned = protocolString;
        cleaned = cleaned.replace(/[_-]/g, ' ');
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    };

    if (!sessionKey) return null;

    const renderTabContent = () => {
        if (!details) return null;

        switch (activeTab) {
            case 'triage':
                return (
                    <div style={{ animation: 'fadeIn 0.3s' }}>
                        {/* 1. Patient Info */}
                        <section style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.8rem 0', color: '#0d6efd', fontWeight: 600, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paciente</h4>
                            <div style={{
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                padding: '1.2rem',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '1rem',
                                border: '1px solid #e9ecef'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#868e96', marginBottom: '0.2rem' }}>Nome</div>
                                    <div style={{ fontWeight: 600, color: '#343a40', fontSize: '1rem' }}>{details.patient_info?.name || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#868e96', marginBottom: '0.2rem' }}>Idade</div>
                                    <div style={{ fontWeight: 600, color: '#343a40', fontSize: '1rem' }}>{details.patient_info?.age} Anos</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#868e96', marginBottom: '0.2rem' }}>Sexo</div>
                                    <div style={{ fontWeight: 600, color: '#343a40', fontSize: '1rem' }}>{details.patient_info?.sex || 'N/A'}</div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Protocol & Classification */}
                        <section style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.8rem 0', color: '#0d6efd', fontWeight: 600, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Classificação</h4>
                            <div style={{
                                padding: '1.2rem',
                                background: getPriorityBg(details.triage_result?.priority),
                                borderRadius: '8px',
                                borderLeft: `5px solid ${getPriorityColor(details.triage_result?.priority)}`
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#212529' }}>
                                        {details.triage_result?.classification || "Classificação Indefinida"}
                                    </div>
                                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem', color: '#495057' }}>
                                        <span>
                                            <strong>Protocolo:</strong> {formatProtocolName(details.triage_result?.protocol)}
                                        </span>
                                        <span>
                                            <strong>Prioridade:</strong> {details.triage_result?.priority?.toUpperCase() || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Discriminators */}
                        <section style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.8rem 0', color: '#0d6efd', fontWeight: 600, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Discriminadores</h4>
                            <div style={{
                                backgroundColor: '#fff',
                                border: '1px solid #dee2e6',
                                borderRadius: '8px',
                                padding: '1rem'
                            }}>
                                {details.triage_result?.discriminators && details.triage_result.discriminators.length > 0 ? (
                                    <ul style={{ margin: '0 0 0 1.2rem', padding: 0, color: '#495057' }}>
                                        {details.triage_result.discriminators.map((d, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{d}</li>)}
                                    </ul>
                                ) : (
                                    <div style={{ fontStyle: 'italic', color: '#adb5bd', fontSize: '0.9rem' }}>
                                        Nenhum discriminador registrado.
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 4. Statistics */}
                        <section>
                            <h4 style={{ margin: '0 0 0.8rem 0', color: '#0d6efd', fontWeight: 600, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estatísticas</h4>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '1rem',
                                fontSize: '0.9rem',
                                color: '#6c757d',
                                borderTop: '1px solid #f1f3f5',
                                paddingTop: '1rem'
                            }}>
                                <div>
                                    <strong>Início:</strong> {formatTime(details.stats?.start_time)}
                                </div>
                                <div>
                                    <strong>Fim:</strong> {formatTime(details.stats?.end_time)}
                                </div>
                                <div>
                                    <strong>Duração:</strong> {formatDuration(details.stats?.duration_seconds)}
                                </div>
                            </div>
                        </section>
                    </div>
                );

            case 'reasoning':
                return (
                    <div style={{ animation: 'fadeIn 0.3s' }}>
                        <section>
                            <h4 style={{ margin: '0 0 0.8rem 0', color: '#0d6efd', fontWeight: 600, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Raciocínio Clínico (IA)</h4>
                            <div style={{
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                lineHeight: '1.7',
                                color: '#212529',
                                textAlign: 'justify',
                                fontSize: '1rem'
                            }}>
                                {details.reasoning || "Nenhum raciocínio registrado."}
                            </div>
                        </section>
                    </div>
                );

            case 'protocol':
                const steps = details.decision_steps_for_protocol_selection || [];
                if (steps.length === 0) {
                    return (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#adb5bd' }}>
                            Nenhum passo de decisão registrado.
                        </div>
                    );
                }

                return (
                    <div style={{ animation: 'fadeIn 0.3s', padding: '1rem 0' }}>
                        <h4 style={{ margin: '0 0 2rem 0', color: '#0d6efd', fontWeight: 600, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                            Linha do Tempo de Decisão
                        </h4>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '700px', margin: '0 auto' }}>
                            {/* Central Line */}
                            <div style={{
                                position: 'absolute',
                                left: '50%',
                                top: 0,
                                bottom: 0,
                                width: '4px',
                                backgroundColor: '#e9ecef',
                                transform: 'translateX(-50%)',
                                borderRadius: '2px'
                            }}></div>

                            {/* Steps */}
                            {steps.map((step, index) => {
                                const isLeft = index % 2 === 0;
                                const isProtocol = step.type === 'protocol';
                                // New structure uses 'text' effectively replacing the old 'chosen_branch_id' display title
                                // Fallback to 'chosen_branch_id' if 'text' is missing for backward compat
                                const title = step.text || formatProtocolName(step.chosen_branch_id) || 'Passo sem título';
                                // New structure uses 'response' for the reasoning/answer explanation
                                // Fallback to 'reasoning'
                                const reasoning = step.response || step.reasoning;

                                return (
                                    <div key={index} style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'flex-start',
                                        marginBottom: '2rem',
                                        position: 'relative'
                                    }}>
                                        {/* Left Side */}
                                        <div style={{ width: '45%', display: 'flex', flexDirection: 'column', alignItems: isLeft ? 'flex-end' : 'flex-start', paddingRight: isLeft ? '2rem' : 0 }}>
                                            {isLeft && (
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: isProtocol ? '#198754' : '#343a40', marginBottom: '0.5rem' }}>
                                                        {title}
                                                    </div>
                                                    {reasoning && (
                                                        <div style={{ fontSize: '0.9rem', color: '#495057', backgroundColor: '#fff', border: '1px solid #dee2e6', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                                            {reasoning}
                                                        </div>
                                                    )}
                                                    {isProtocol && (
                                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#adb5bd', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            <span style={{
                                                                backgroundColor: '#e8f5e9',
                                                                color: '#198754',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px'
                                                            }}>
                                                                Protocolo
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Center Node */}
                                        <div style={{
                                            position: 'relative',
                                            zIndex: 2,
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: isProtocol ? '#198754' : '#343a40',
                                            color: '#fff',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            border: '4px solid #fff',
                                            boxShadow: '0 0 0 2px #e9ecef'
                                        }}>
                                            {step.step}
                                        </div>

                                        {/* Right Side */}
                                        <div style={{ width: '45%', display: 'flex', flexDirection: 'column', alignItems: !isLeft ? 'flex-start' : 'flex-end', paddingLeft: !isLeft ? '2rem' : 0 }}>
                                            {!isLeft && (
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: isProtocol ? '#198754' : '#343a40', marginBottom: '0.5rem' }}>
                                                        {title}
                                                    </div>
                                                    {reasoning && (
                                                        <div style={{ fontSize: '0.9rem', color: '#495057', backgroundColor: '#fff', border: '1px solid #dee2e6', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                                            {reasoning}
                                                        </div>
                                                    )}
                                                    {isProtocol && (
                                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#adb5bd', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{
                                                                backgroundColor: '#e8f5e9',
                                                                color: '#198754',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px'
                                                            }}>
                                                                Protocolo
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '95%',
                maxWidth: '900px',
                height: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                position: 'relative',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header & Tabs */}
                <div style={{
                    padding: '1.5rem 1.5rem 0',
                    borderBottom: '1px solid #dee2e6',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h2 style={{ margin: 0, color: '#212529', fontSize: '1.5rem' }}>
                            Detalhes da Triagem
                        </h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '2rem',
                                lineHeight: '1rem',
                                cursor: 'pointer',
                                color: '#adb5bd',
                            }}
                        >
                            &times;
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem' }}>
                        {['triage', 'reasoning', 'protocol'].map((tab) => {
                            const labels = {
                                triage: 'Triagem', // Aba A
                                reasoning: 'Raciocínio IA', // Aba B
                                protocol: 'Seleção de Protocolo' // Aba C
                            };
                            const isActive = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: isActive ? '3px solid #0d6efd' : '3px solid transparent',
                                        padding: '0.8rem 0',
                                        fontSize: '1rem',
                                        fontWeight: isActive ? 600 : 400,
                                        color: isActive ? '#0d6efd' : '#495057',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        marginBottom: '-1px'
                                    }}
                                >
                                    {labels[tab]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '2rem',
                    backgroundColor: '#fff'
                }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6c757d' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                                <div>Carregando detalhes...</div>
                            </div>
                        </div>
                    ) : error ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#dc3545' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
                                <div>Erro ao carregar os detalhes.</div>
                            </div>
                        </div>
                    ) : (
                        renderTabContent()
                    )}
                </div>
            </div>
        </div>
    );
};

export default TriageDetailsModal;
