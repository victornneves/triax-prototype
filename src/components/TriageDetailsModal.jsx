import React, { useEffect, useState, useRef } from 'react';
import { getAuthHeaders } from '../utils/auth';
import { useToast } from './ui/ToastProvider';
import './TriageDetailsModal.css';

const API_URL = import.meta.env.VITE_API_URL;

const TriageDetailsModal = ({ sessionKey, onClose }) => {
    const toast = useToast();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' or 'reasoning'
    const [pdfLoading, setPdfLoading] = useState(false);
    const modalRef = useRef(null);

    // Focus trap: save previous focus, focus first element, trap Tab, restore on close
    useEffect(() => {
        const modal = modalRef.current;
        if (!modal) return;
        const previousFocus = document.activeElement;
        const focusable = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable[0]?.focus();
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab') return;
            // Re-query on each keydown for dynamic content (tabs)
            const elements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        modal.addEventListener('keydown', handleKeyDown);
        return () => {
            modal.removeEventListener('keydown', handleKeyDown);
            previousFocus?.focus();
        };
    }, [onClose]);

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

    const getPriorityKey = (priority) => {
        const p = priority?.toLowerCase() || '';
        if (p.includes('red') || p.includes('vermelho')) return 'red';
        if (p.includes('orange') || p.includes('laranja')) return 'orange';
        if (p.includes('yellow') || p.includes('amarelo')) return 'yellow';
        if (p.includes('green') || p.includes('verde')) return 'green';
        if (p.includes('blue') || p.includes('azul')) return 'blue';
        return 'default';
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
    const priorityKey = getPriorityKey(priorityValue);

    const patientName = details?.patient_info?.name || 'Detalhes do Atendimento';

    return (
        <div
            ref={modalRef}
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={onClose}
        >
            {/* Visually hidden title for screen readers */}
            <h2 id="modal-title" className="sr-only">{patientName}</h2>

            <div className="modal-content" onClick={e => e.stopPropagation()}>

                {/* Header with Tabs */}
                <div className="modal-header">
                    <div role="tablist" className="modal-tab-list">
                        {[
                            { id: 'clinical', label: 'Dados Clínicos' },
                            { id: 'reasoning', label: 'Raciocínio IA' },
                            { id: 'stats', label: 'Auditoria' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`modal-tab${activeTab === tab.id ? ' modal-tab--active' : ''}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="modal-actions">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={pdfLoading}
                            className="modal-pdf-btn"
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
                            aria-label="Fechar janela"
                            className="modal-close-btn"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="modal-body">
                    {loading ? (
                        <div className="modal-state-center modal-state-loading">
                            <div className="modal-state-inner">
                                <div className="modal-state-icon">⏳</div>
                                <div>Carregando detalhes...</div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="modal-state-center modal-state-error">
                            <div className="modal-state-inner">
                                <div className="modal-state-icon">⚠️</div>
                                <div>Erro ao carregar os detalhes.</div>
                            </div>
                        </div>
                    ) : (
                        <div className="modal-tab-content">
                            {activeTab === 'clinical' ? (
                                <>
                                    {/* 0. Patient Info - Expanded Compact Header */}
                                    <div className="modal-patient-card">
                                        <div className="modal-patient-row">
                                            <div className="modal-patient-col-lg">
                                                <strong className="modal-info-label">Paciente:</strong>
                                                <div className="modal-info-value--name">{details.patient_info?.name || 'N/A'}</div>
                                            </div>
                                            <div className="modal-patient-col-md">
                                                <strong className="modal-info-label">Nascimento / Idade:</strong>
                                                <div>{details.patient_info?.birth_date || '-'} ({details.patient_info?.age}a) • {details.patient_info?.sex || 'N/A'}</div>
                                            </div>
                                            <div className="modal-patient-col-sm">
                                                <strong className="modal-info-label">Senha:</strong>
                                                <div className="modal-info-value--bold">{details.patient_info?.ticket_number || '-'}</div>
                                            </div>
                                        </div>

                                        <div className="modal-patient-grid">
                                            <div>
                                                <strong className="modal-info-label--xs">Cód. Paciente:</strong>
                                                <div>{details.patient_info?.patient_code || '-'}</div>
                                            </div>
                                            <div>
                                                <strong className="modal-info-label--xs">Convênio:</strong>
                                                <div>{details.patient_info?.insurance || '-'}</div>
                                            </div>
                                            <div>
                                                <strong className="modal-info-label--xs">Atendimento:</strong>
                                                <div>{details.patient_info?.visit_id || '-'}</div>
                                            </div>
                                            <div>
                                                <strong className="modal-info-label--xs">SAME:</strong>
                                                <div>{details.patient_info?.same || '-'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 1. Classification & Result Box */}
                                    <section className="modal-result-section">
                                        <div
                                            className="modal-result-box"
                                            data-priority={priorityKey}
                                        >
                                            {/* Priority Column - High Impact */}
                                            <div className="modal-result-priority-col">
                                                <div className="modal-result-priority-label">Classificação</div>
                                                <div
                                                    className="modal-result-priority-name"
                                                    data-priority={priorityKey}
                                                >
                                                    {getPriorityName(priorityValue)}
                                                </div>
                                            </div>

                                            {/* Vertical Divider */}
                                            <div className="modal-result-divider"></div>

                                            {/* Protocol & Discriminator Column */}
                                            <div className="modal-result-detail-col">
                                                <div className="modal-result-detail-row">
                                                    <span className="modal-result-meta-label">Fluxograma: </span>
                                                    <span className="modal-result-flowchart-value">{formatProtocolName(protocolValue)}</span>
                                                </div>
                                                <div className="modal-result-detail-row">
                                                    <span className="modal-result-meta-label">Discriminador: </span>
                                                    <span className="modal-result-discriminator-value">{discriminator || "Indefinido"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 2. Clinical Data & IA Extraction */}
                                    {details.clinical_data && (
                                        <section className="modal-clinical-grid">
                                            <div className="modal-clinical-card">
                                                <h5 className="modal-card-heading modal-card-heading--primary">Queixa Principal</h5>
                                                <p className="modal-card-text">{details.clinical_data.queixa_principal || '-'}</p>
                                            </div>
                                            <div className="modal-clinical-card">
                                                <h5 className="modal-card-heading modal-card-heading--primary">Especialidade Sugerida</h5>
                                                <p className="modal-card-text--success">{details.clinical_data.especialidade || '-'}</p>
                                            </div>
                                            <div className="modal-clinical-card">
                                                <h5 className="modal-card-heading modal-card-heading--danger">Alergias</h5>
                                                <p className="modal-card-text--bold">{details.clinical_data.alergias || 'Nega'}</p>
                                            </div>
                                            <div className="modal-clinical-card">
                                                <h5 className="modal-card-heading modal-card-heading--muted">Medicamentos</h5>
                                                <p className="modal-card-text--muted">{details.clinical_data.medicamentos || 'Nega'}</p>
                                            </div>
                                        </section>
                                    )}

                                    {/* 3. Vital Signs Grid */}
                                    <div className="modal-vitals-grid">
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
                                                <div className="modal-vital-label">{item.label}</div>
                                                <div className="modal-vital-value">
                                                    {getValue(item.val)} <span className="modal-vital-unit">{item.unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : activeTab === 'reasoning' ? (
                                /* IA Reasoning Tab */
                                <div className="modal-reasoning-box">
                                    "{details.reasoning || "Nenhum raciocínio registrado."}"
                                </div>
                            ) : (
                                /* Stats / Audit Tab */
                                <div className="modal-stats-grid">
                                    <div>
                                        <div className="modal-stat-label">Início do Atendimento</div>
                                        <div className="modal-stat-value">{formatTime(details.stats?.start_time)}</div>
                                    </div>
                                    <div>
                                        <div className="modal-stat-label">Finalização</div>
                                        <div className="modal-stat-value">{formatTime(details.stats?.end_time)}</div>
                                    </div>
                                    <div>
                                        <div className="modal-stat-label">Tempo Total de Triagem</div>
                                        <div className="modal-stat-value--highlight">{formatDuration(details.stats?.duration_seconds)}</div>
                                    </div>
                                    <div className="modal-session-id-block">
                                        <strong className="modal-session-id-label">Identificador da Sessão:</strong>
                                        <div className="modal-session-id-value">
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
