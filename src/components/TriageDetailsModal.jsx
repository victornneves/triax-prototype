import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../utils/auth';
import { useToast } from './ui/ToastProvider';

const API_URL = import.meta.env.VITE_API_URL;

const TriageDetailsModal = ({ sessionKey, onClose }) => {
    const toast = useToast();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' or 'reasoning'
    const [pdfLoading, setPdfLoading] = useState(false);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchDetails = async () => {
            try {
                const headers = await getAuthHeaders();
                const encodedKey = encodeURIComponent(sessionKey);

                const response = await fetch(`${API_URL}/history?key=${encodedKey}`, {
                    headers: headers
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
        // Handle new 'prioridade' field or old 'priority'
        if (typeof priority === 'string' && priority.includes('-')) return priority;

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
        const p = priority?.toLowerCase() || '';
        if (p.includes('red') || p.includes('vermelho')) return '#842029';
        if (p.includes('orange') || p.includes('laranja')) return '#854000';
        if (p.includes('yellow') || p.includes('amarelo')) return '#856404';
        if (p.includes('green') || p.includes('verde')) return '#0f5132';
        if (p.includes('blue') || p.includes('azul')) return '#084298';
        return '#343a40';
    };

    const getPriorityColor = (priority) => {
        const p = priority?.toLowerCase() || '';
        if (p.includes('red') || p.includes('vermelho')) return '#dc3545';
        if (p.includes('orange') || p.includes('laranja')) return '#fd7e14';
        if (p.includes('yellow') || p.includes('amarelo')) return '#ffc107';
        if (p.includes('green') || p.includes('verde')) return '#198754';
        if (p.includes('blue') || p.includes('azul')) return '#0d6efd';
        return '#6c757d';
    };

    const getPriorityBg = (priority) => {
        const p = priority?.toLowerCase() || '';
        if (p.includes('red') || p.includes('vermelho')) return '#ffeaea';
        if (p.includes('orange') || p.includes('laranja')) return '#fff5e6';
        if (p.includes('yellow') || p.includes('amarelo')) return '#fff9db';
        if (p.includes('green') || p.includes('verde')) return '#e8f5e9';
        if (p.includes('blue') || p.includes('azul')) return '#e7f1ff';
        return '#f8f9fa';
    };

    const formatProtocolName = (protocolString) => {
        if (!protocolString) return 'N/A';
        let cleaned = protocolString;
        cleaned = cleaned.replace(/[_-]/g, ' ');
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    };

    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/history/${sessionKey}/pdf`, {
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

    if (!sessionKey) return null;

    const vs = details?.clinical_data?.vital_signs || details?.vital_signs || {};
    const getValue = (val) => {
        if (val === 0) return 0;
        if (!val) return '-';
        if (typeof val === 'object') return val.parsedValue || val.source || '-';
        return val;
    };

    const triageResult = details?.triage_result || {};
    const priorityValue = triageResult.prioridade || triageResult.cor || triageResult.priority;
    const protocolValue = triageResult.fluxograma_sintoma || triageResult.protocol;
    const discriminator = triageResult.discriminador || 'Discriminador Indisponivel';

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
                                    fontSize: '0.95rem',
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={pdfLoading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                backgroundColor: '#fff',
                                color: '#dc3545',
                                border: '1px solid #dc3545',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                transition: 'all 0.2s',
                                opacity: pdfLoading ? 0.7 : 1,
                                boxShadow: '0 2px 4px rgba(220, 53, 69, 0.1)'
                            }}
                            onMouseOver={(e) => {
                                if (!pdfLoading) {
                                    e.currentTarget.style.backgroundColor = '#dc3545';
                                    e.currentTarget.style.color = '#fff';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!pdfLoading) {
                                    e.currentTarget.style.backgroundColor = '#fff';
                                    e.currentTarget.style.color = '#dc3545';
                                }
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            {pdfLoading ? 'Gerando...' : 'GERAR PDF'}
                        </button>

                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '2rem',
                                lineHeight: '1rem',
                                cursor: 'pointer',
                                color: '#adb5bd',
                                padding: '1rem 0',
                                transition: 'color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#495057'}
                            onMouseOut={(e) => e.target.style.color = '#adb5bd'}
                        >
                            &times;
                        </button>
                    </div>
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
                                    {/* 0. Patient Info - Expanded Compact Header */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.8rem',
                                        padding: '1.2rem',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '12px',
                                        border: '1px solid #e9ecef',
                                        marginBottom: '2rem',
                                        fontSize: '0.95rem',
                                        color: '#495057'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div style={{ flex: '1 1 250px' }}>
                                                <strong style={{ color: '#868e96', textTransform: 'uppercase', fontSize: '0.75rem' }}>Paciente:</strong>
                                                <div style={{ fontWeight: 700, color: '#212529', fontSize: '1.1rem' }}>{details.patient_info?.name || 'N/A'}</div>
                                            </div>
                                            <div style={{ flex: '1 1 150px' }}>
                                                <strong style={{ color: '#868e96', textTransform: 'uppercase', fontSize: '0.75rem' }}>Nascimento / Idade:</strong>
                                                <div>{details.patient_info?.birth_date || '-'} ({details.patient_info?.age}a) • {details.patient_info?.sex || 'N/A'}</div>
                                            </div>
                                            <div style={{ flex: '1 1 120px' }}>
                                                <strong style={{ color: '#868e96', textTransform: 'uppercase', fontSize: '0.75rem' }}>Senha:</strong>
                                                <div style={{ fontWeight: 600 }}>{details.patient_info?.ticket_number || '-'}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', paddingTop: '0.8rem', borderTop: '1px solid #eee' }}>
                                            <div>
                                                <strong style={{ color: '#868e96', textTransform: 'uppercase', fontSize: '0.7rem' }}>Cód. Paciente:</strong>
                                                <div>{details.patient_info?.patient_code || '-'}</div>
                                            </div>
                                            <div>
                                                <strong style={{ color: '#868e96', textTransform: 'uppercase', fontSize: '0.7rem' }}>Convênio:</strong>
                                                <div>{details.patient_info?.insurance || '-'}</div>
                                            </div>
                                            <div>
                                                <strong style={{ color: '#868e96', textTransform: 'uppercase', fontSize: '0.7rem' }}>Atendimento:</strong>
                                                <div>{details.patient_info?.visit_id || '-'}</div>
                                            </div>
                                            <div>
                                                <strong style={{ color: '#868e96', textTransform: 'uppercase', fontSize: '0.7rem' }}>SAME:</strong>
                                                <div>{details.patient_info?.same || '-'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 1. Classification & Result Box */}
                                    <section style={{ marginBottom: '2.5rem' }}>
                                        <div style={{
                                            padding: '1.5rem 2rem',
                                            background: getPriorityBg(priorityValue),
                                            borderRadius: '12px',
                                            borderLeft: `10px solid ${getPriorityColor(priorityValue)}`,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '2.5rem',
                                            flexWrap: 'wrap'
                                        }}>
                                            {/* Priority Column - High Impact */}
                                            <div style={{ flex: '0 0 auto' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>Classificação</div>
                                                <div style={{
                                                    fontSize: '1.8rem',
                                                    fontWeight: '900',
                                                    color: getPriorityTextColor(priorityValue),
                                                    lineHeight: '1.1'
                                                }}>
                                                    {getPriorityName(priorityValue)}
                                                </div>
                                            </div>

                                            {/* Vertical Divider */}
                                            <div style={{ height: '50px', width: '1px', backgroundColor: 'rgba(0,0,0,0.1)', display: 'block' }}></div>

                                            {/* Protocol & Discriminator Column */}
                                            <div style={{ flex: '1 1 300px' }}>
                                                <div style={{ marginBottom: '0.4rem' }}>
                                                    <span style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase' }}>Fluxograma: </span>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>{formatProtocolName(protocolValue)}</span>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase' }}>Discriminador: </span>
                                                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#212529' }}>{discriminator || "Indefinido"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 2. Clinical Data & IA Extraction */}
                                    {details.clinical_data && (
                                        <section style={{ marginBottom: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                                <h5 style={{ margin: '0 0 0.8rem 0', color: '#0d6efd', textTransform: 'uppercase', fontSize: '0.75rem' }}>Queixa Principal</h5>
                                                <p style={{ margin: 0, fontSize: '1rem', color: '#212529', lineHeight: '1.5' }}>{details.clinical_data.queixa_principal || '-'}</p>
                                            </div>
                                            <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                                <h5 style={{ margin: '0 0 0.8rem 0', color: '#0d6efd', textTransform: 'uppercase', fontSize: '0.75rem' }}>Especialidade Sugerida</h5>
                                                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#198754' }}>{details.clinical_data.especialidade || '-'}</p>
                                            </div>
                                            <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                                <h5 style={{ margin: '0 0 0.8rem 0', color: '#dc3545', textTransform: 'uppercase', fontSize: '0.75rem' }}>Alergias</h5>
                                                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{details.clinical_data.alergias || 'Nega'}</p>
                                            </div>
                                            <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                                <h5 style={{ margin: '0 0 0.8rem 0', color: '#6c757d', textTransform: 'uppercase', fontSize: '0.75rem' }}>Medicamentos</h5>
                                                <p style={{ margin: 0, fontSize: '0.95rem' }}>{details.clinical_data.medicamentos || 'Nega'}</p>
                                            </div>
                                        </section>
                                    )}

                                    {/* 3. Vital Signs Grid */}
                                    <div style={{
                                        backgroundColor: '#fff',
                                        borderRadius: '8px',
                                        padding: '1.2rem',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
