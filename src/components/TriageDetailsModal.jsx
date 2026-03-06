import React, { useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_URL;

const TriageDetailsModal = ({ sessionKey, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' or 'reasoning'

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

    const getPriorityName = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'red': return 'Vermelho';
            case 'orange': return 'Laranja';
            case 'yellow': return 'Amarelo';
            case 'green': return 'Verde';
            case 'blue': return 'Azul';
            default: return priority || 'N/A';
        }
    };

    const getPriorityTextColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'red': return '#842029';
            case 'orange': return '#854000';
            case 'yellow': return '#856404'; // Darker yellow for readability
            case 'green': return '#0f5132';
            case 'blue': return '#084298';
            default: return '#343a40';
        }
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

    const vs = details?.vital_signs || {};
    const getValue = (val) => {
        if (!val) return '-';
        if (typeof val === 'object') return val.parsedValue || val.source || '-';
        return val;
    };

    const assignmentStep = details?.decision_steps_for_priority?.find(s => s.type === 'assignment')?.object;
    const discriminator = details?.triage_result?.discriminador || details?.discriminator || assignmentStep;

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
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                position: 'relative',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header with Tabs */}
                <div style={{
                    padding: '0 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #f1f3f5',
                    flexShrink: 0,
                    backgroundColor: '#fff'
                }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        {[
                            { id: 'clinical', label: 'Dados Clínicos' },
                            { id: 'reasoning', label: 'Raciocínio IA' },
                            { id: 'stats', label: 'Auditoria' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === tab.id ? '3px solid #0d6efd' : '3px solid transparent',
                                    padding: '1.2rem 0',
                                    fontSize: '1rem',
                                    fontWeight: activeTab === tab.id ? 700 : 500,
                                    color: activeTab === tab.id ? '#0d6efd' : '#6c757d',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    marginBottom: '-1px'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '2rem',
                            lineHeight: '1rem',
                            cursor: 'pointer',
                            color: '#adb5bd',
                            padding: '1rem 0'
                        }}
                    >
                        &times;
                    </button>
                </div>

                {/* Scrollable Content */}
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
                        <div style={{ animation: 'fadeIn 0.2s' }}>
                            {activeTab === 'clinical' ? (
                                <>
                                    {/* 0. Patient Info - Compact Horizontal Header */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '2rem',
                                        padding: '0.8rem 1.2rem',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        border: '1px solid #e9ecef',
                                        marginBottom: '1.5rem',
                                        fontSize: '0.95rem',
                                        color: '#495057',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <strong style={{ color: '#868e96', textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '0.2rem' }}>Paciente:</strong>
                                            <span style={{ fontWeight: 600, color: '#212529' }}>{details.patient_info?.name || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <strong style={{ color: '#868e96', textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '0.2rem' }}>Idade:</strong>
                                            <span style={{ fontWeight: 600, color: '#212529' }}>{details.patient_info?.age ? `${details.patient_info.age} anos` : 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <strong style={{ color: '#868e96', textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '0.2rem' }}>Sexo:</strong>
                                            <span style={{ fontWeight: 600, color: '#212529' }}>{details.patient_info?.gender || details.patient_info?.sex || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* 1. Classification & Result Box */}
                                    <section style={{ marginBottom: '2.5rem' }}>
                                        <div style={{
                                            padding: '1.5rem 2rem',
                                            background: getPriorityBg(details.triage_result?.priority),
                                            borderRadius: '12px',
                                            borderLeft: `8px solid ${getPriorityColor(details.triage_result?.priority)}`,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '2.5rem',
                                            flexWrap: 'wrap'
                                        }}>
                                            {/* Priority Column - High Impact */}
                                            <div style={{ flex: '0 0 auto' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>Prioridade</div>
                                                <div style={{
                                                    fontSize: '2rem',
                                                    fontWeight: '900',
                                                    color: getPriorityTextColor(details.triage_result?.priority),
                                                    lineHeight: '1.1'
                                                }}>
                                                    {getPriorityName(details.triage_result?.priority)}
                                                </div>
                                            </div>

                                            {/* Vertical Divider */}
                                            <div style={{ height: '50px', width: '1px', backgroundColor: 'rgba(0,0,0,0.1)', display: 'block' }}></div>

                                            {/* Protocol & Discriminator Column */}
                                            <div style={{ flex: '1 1 300px' }}>
                                                <div style={{ marginBottom: '0.4rem' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Protocolo: </span>
                                                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#333' }}>{formatProtocolName(details.triage_result?.protocol)}</span>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Discriminador: </span>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#212529' }}>{details.triage_result?.discriminador || "Indefinido"}</span>
                                                </div>
                                            </div>

                                            {(typeof discriminator === 'object' && discriminator.explanation) && (
                                                <div style={{
                                                    width: '100%',
                                                    marginTop: '0.4rem',
                                                    paddingTop: '0.8rem',
                                                    borderTop: '1px solid rgba(0,0,0,0.08)',
                                                    color: '#555',
                                                    lineHeight: '1.5',
                                                    fontSize: '0.95rem',
                                                    fontStyle: 'italic'
                                                }}>
                                                    "{discriminator.explanation}"
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* 2. Vital Signs Grid */}
                                    {details.vital_signs && (
                                        <div style={{
                                            backgroundColor: '#fff',
                                            borderRadius: '8px',
                                            padding: '1.2rem',
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '1.5rem',
                                            border: '1px solid #dee2e6'
                                        }}>
                                            {[
                                                { label: 'Freq. Cardíaca', val: vs.heart_rate, unit: 'bpm' },
                                                { label: 'Pressão Arterial', val: vs.blood_pressure, unit: 'mmHg' },
                                                { label: 'Freq. Respiratória', val: vs.respiratory_rate, unit: 'rpm' },
                                                { label: 'Saturação (SpO2)', val: vs.spo2, unit: '%' },
                                                { label: 'Temperatura', val: vs.temperature, unit: '°C' },
                                                { label: 'Glicemia', val: vs.blood_glucose, unit: 'mg/dL' },
                                                { label: 'Escala de Glasgow', val: vs.gcs_scale, unit: '' },
                                                { label: 'Escala de Dor', val: vs.pain_scale, unit: '/10' },
                                            ].map((item, idx) => (
                                                <div key={idx}>
                                                    <div style={{ fontSize: '0.8rem', color: '#868e96', marginBottom: '0.2rem' }}>{item.label}</div>
                                                    <div style={{ fontWeight: 700, color: '#343a40', fontSize: '1.2rem' }}>
                                                        {getValue(item.val)} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6c757d' }}>{item.unit}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : activeTab === 'reasoning' ? (
                                /* 3. IA Reasoning Tab */
                                <div style={{
                                    backgroundColor: '#f1f8ff',
                                    border: '1px solid #cce5ff',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    lineHeight: '1.8',
                                    color: '#004085',
                                    textAlign: 'justify',
                                    fontSize: '1.1rem',
                                    fontStyle: 'italic',
                                    boxShadow: '0 2px 10px rgba(0,64,133,0.05)'
                                }}>
                                    "{details.reasoning || "Nenhum raciocínio registrado."}"
                                </div>
                            ) : (
                                /* 4. Stats / Audit Tab */
                                <div style={{
                                    padding: '2rem',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    border: '1px solid #e9ecef',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                                    gap: '2rem',
                                    color: '#212529'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Início do Atendimento</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatTime(details.stats?.start_time)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Finalização</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatTime(details.stats?.end_time)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Tempo Total de Triagem</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0d6efd' }}>{formatDuration(details.stats?.duration_seconds)}</div>
                                    </div>
                                    <div style={{
                                        gridColumn: '1 / -1',
                                        paddingTop: '1.5rem',
                                        marginTop: '1rem',
                                        borderTop: '1px dashed #dee2e6',
                                        fontSize: '0.95rem',
                                        color: '#495057'
                                    }}>
                                        <strong style={{ color: '#868e96' }}>Identificador da Sessão:</strong>
                                        <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', backgroundColor: '#fff', padding: '0.8rem', borderRadius: '4px', border: '1px solid #eee' }}>
                                            {details.session_id}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TriageDetailsModal;
