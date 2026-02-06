import { useState, useRef, useEffect, useCallback } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useTranscribe } from '../useTranscribe'; // Import hook

const API_URL = import.meta.env.VITE_API_URL;

const SENSOR_CONFIG = {
    blood_glucose: {
        label: 'Glicemia',
        full_label: 'Níveis de Glicose no Sangue',
        hint: 'mg/dL',
        desc: 'Níveis de glicose no sangue. <70: Hipoglicemia. >200: Hiperglicemia potencial.',
        range: 'Normal: 70–99 (Jejum) ou < 140 (Casual)'
    },
    blood_pressure: {
        label: 'PA',
        full_label: 'Pressão Arterial',
        hint: 'mmHg',
        composite: true,
        desc: 'Pressão Arterial. >140/90: Hipertensão. <90/60: Hipotensão/Choque.',
        range: 'Normal: Sis < 120 e Dia < 80 mmHg'
    },
    gcs: {
        label: 'Glasgow',
        full_label: 'Nível de Consciência Glasgow',
        hint: '3-15',
        desc: 'Avaliação do nível de consciência (Ocular, Verbal, Motora). <9: Trauma Grave/Intubação.',
        range: '3 (Coma Profundo) - 15 (Consciência Normal)',
        type: 'slider',
        min: 3,
        max: 15
    },
    heart_rate: {
        label: 'FC',
        full_label: 'Frequência Cardíaca',
        hint: 'bpm',
        desc: 'Frequência de batimentos cardíacos. >100: Taquicardia. <60: Bradicardia.',
        range: 'Normal: 60-100 bpm'
    },
    oxygen_saturation: {
        label: 'SpO2',
        full_label: 'Saturação de Oxigênio',
        hint: '%',
        desc: 'Saturação de oxigênio. <90%: Hipoxemia Grave (Perigo).',
        range: 'Normal: ≥ 95%'
    },
    pain_scale: {
        label: 'Dor',
        full_label: 'Escala subjetiva de dor',
        hint: '0-10',
        desc: 'Escala subjetiva de dor. 1-3: Leve, 4-6: Moderada, 7-10: Intensa.',
        range: '0 (Sem dor) - 10 (Pior dor imaginável)',
        type: 'slider',
        min: 0,
        max: 10,
        emoji: false
    },
    respiratory_rate: {
        label: 'FR',
        full_label: 'Frequência Respiratória',
        hint: 'irpm',
        desc: 'Incursões respiratórias. >20: Taquipneia. <12: Bradipneia.',
        range: 'Normal: 12-20 irpm'
    },
    temperature: {
        label: 'Temp',
        full_label: 'Temperatura Corporal',
        hint: '°C',
        desc: 'Temperatura corporal. >37.8: Febre. <35: Hipotermia.',
        range: 'Normal: 36.5 - 37.4 °C'
    }
};

const PainInput = ({ value, onChange }) => {
    const val = value ? parseInt(value) : 0;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', minWidth: 0 }}>
            <input
                type="range"
                min="0"
                max="10"
                value={val}
                name="pain_scale"
                onChange={onChange}
                style={{ flex: 1, accentColor: val > 7 ? '#dc3545' : ((val > 3) ? '#ffc107' : '#198754'), minWidth: 0, cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'right', fontSize: '0.9rem' }}>{val}</span>
        </div>
    );
};

const GCSInput = ({ value, onChange }) => {
    const getColor = (v) => {
        if (!v) return '#ced4da';
        const num = parseInt(v);
        if (num <= 8) return '#dc3545'; // Severe
        if (num <= 12) return '#ffc107'; // Moderate
        return '#198754'; // Mild/Normal
    };

    return (
        <select
            name="gcs"
            value={value || ""}
            onChange={onChange}
            style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: `1px solid ${getColor(value)}`,
                borderLeftWidth: '5px', // Emphasis on color
                outline: 'none',
                backgroundColor: '#ffffff',
                color: value ? '#212529' : '#6c757d',
                cursor: 'pointer',
                fontWeight: value ? '600' : 'normal'
            }}
        >
            <option value="" disabled>Selecione...</option>
            {Array.from({ length: 13 }, (_, i) => 15 - i).map(num => (
                <option key={num} value={num}>
                    {num} {num === 15 ? '(Consciência Normal)' : num === 3 ? '(Coma Profundo)' : num <= 8 ? '(Trauma Grave)' : ''}
                </option>
            ))}
        </select>
    );
};

const SensorLabel = ({ config, setTooltipState }) => (
    <div
        style={{ position: 'relative', cursor: 'help', display: 'flex', flexDirection: 'column' }}
        className="sensor-label-group"
        onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipState({
                x: rect.left + rect.width / 2,
                y: rect.top,
                config
            });
        }}
        onMouseLeave={() => setTooltipState(null)}
    >
        <span style={{ fontWeight: '600', color: '#333' }}>{config.label}</span>
        <span style={{ fontSize: '0.75rem', color: '#666' }}>({config.hint})</span>
    </div>
);

const PatientForm = ({ onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        sex: 'M'
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            <form onSubmit={handleSubmit} style={{
                background: '#fff',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '400px',
                border: '1px solid #dee2e6'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#212529', textAlign: 'center' }}>Identificação do Paciente</h3>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#495057' }}>Nome</label>
                    <input
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            boxSizing: 'border-box',
                            backgroundColor: '#ffffff',
                            color: '#212529'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#495057' }}>Idade</label>
                    <input
                        required
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            boxSizing: 'border-box',
                            backgroundColor: '#ffffff',
                            color: '#212529'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#495057' }}>Sexo</label>
                    <select
                        name="sex"
                        value={formData.sex}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            boxSizing: 'border-box',
                            backgroundColor: '#ffffff',
                            color: '#212529'
                        }}
                    >
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: '#0d6efd',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Iniciando Triagem...' : 'Iniciar Triagem'}
                </button>
            </form>
        </div>
    );
};

const ProtocolTriage = () => {
    // Chat & Session State
    const [messages, setMessages] = useState([
        { role: 'system', text: 'Sistema de Triagem Iniciado. Descreva a queixa principal do paciente.' }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);

    // Patient Info State
    const [isPatientInfoSubmitted, setIsPatientInfoSubmitted] = useState(false);
    const [patientInfo, setPatientInfo] = useState(null);

    // Triage Logic State
    // Triage Logic State
    const [sessionId, setSessionId] = useState(() => 'session-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
    const [suggestedProtocol, setSuggestedProtocol] = useState(null);
    const [currentNode, setCurrentNode] = useState(null);
    const [triageResult, setTriageResult] = useState(null);
    const [triageReport, setTriageReport] = useState(null);
    const [sensorInputs, setSensorInputs] = useState({});
    const [tooltipState, setTooltipState] = useState(null);
    const [allProtocols, setAllProtocols] = useState([]);
    const [pendingProtocol, setPendingProtocol] = useState(null);

    // -- AUDIO TRANSCRIPTION --
    const {
        isRecording,
        finalTranscript,
        partialTranscript,
        start: startRecording,
        stop: stopRecording,
        reset: resetRecording,
        error: transcribeError
    } = useTranscribe();

    const [textBeforeRecording, setTextBeforeRecording] = useState("");

    // Update input text with transcription
    useEffect(() => {
        if (!isRecording && !finalTranscript && !partialTranscript) return;

        // Combine initial text + final phrases + current partial
        const parts = [textBeforeRecording, finalTranscript, partialTranscript].filter(Boolean);
        setInputText(parts.join(" "));
    }, [isRecording, finalTranscript, partialTranscript, textBeforeRecording]);


    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            // Save current text so we append to it
            setTextBeforeRecording(inputText);
            startRecording();
        }
    };

    useEffect(() => {
        getAuthHeaders().then(headers => {
            fetch(`${API_URL}/protocol_names`, { headers })
                .then(res => res.json())
                .then(data => {
                    const list = data.protocols || data; // Adapting to possible return format
                    // Filter duplicates and sort
                    const uniqueList = [...new Set(list)];
                    setAllProtocols(uniqueList.sort((a, b) => a.localeCompare(b)));
                })
                .catch(err => console.error("Error fetching protocols:", err));
        });
    }, []);


    const messagesEndRef = useRef(null);
    const protocolRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // Auth Helper
    const getAuthHeaders = useCallback(async () => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            return {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
        } catch (e) {
            console.error("Error fetching auth session", e);
            return { 'Content-Type': 'application/json' };
        }
    }, []);


    // ----- Patient Info Handler -----
    const handlePatientSubmit = async (data) => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            // Log patient info to transcription context
            const infoString = `PACIENTE: ${data.name}, IDADE: ${data.age}, SEXO: ${data.sex === 'M' ? 'Masculino' : 'Feminino'}.`;

            await fetch(`${API_URL}/transcription`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    session_id: sessionId,
                    transcription: `CONTEXTO INICIAL: ${infoString}`
                })
            });

            setPatientInfo(data);
            setIsPatientInfoSubmitted(true);
        } catch (e) {
            console.error("Error submitting patient info", e);
            alert("Erro ao iniciar sessão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    // ----- Chat Logic -----

    const addMessage = (role, text) => {
        setMessages(prev => [...prev, { role, text }]);
    };

    const logSystemMessage = async (text) => {
        try {
            const headers = await getAuthHeaders();
            await fetch(`${API_URL}/transcription`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    session_id: sessionId,
                    transcription: `Sistema: ${text}`
                })
            });
        } catch (e) {
            console.error("Failed to log system message", e);
        }
    };

    const handleSendMessage = async (overrideText = null) => {
        const textToSend = typeof overrideText === 'string' ? overrideText : inputText;
        if (!textToSend?.trim()) return;

        // --- AUDIO RESET LOGIC ---
        if (isRecording) {
            stopRecording();
        }
        resetRecording();        // Clear transcription buffer
        setTextBeforeRecording(""); // Clear local buffer
        // -------------------------

        const userMsg = textToSend.trim();
        setInputText('');
        addMessage('user', userMsg);
        setLoading(true);

        try {
            const headers = await getAuthHeaders();

            // 1. Send to Transcription Handler (Appends to Session History)
            // Fire and forget (don't await) or await if critical. 
            // We await to ensure order integrity on the server side mostly.
            fetch(`${API_URL}/transcription`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    session_id: sessionId,
                    transcription: userMsg
                })
            }).catch(e => console.error("Transcription upload failed", e));

            // 2. Decide next action based on state
            if (!protocolRef.current) {
                await checkProtocolSuggestion(headers);
            } else {
                // Pass userMsg explicitly to avoid race condition with DB read
                await traverseTree(headers, null, null, userMsg);
            }

        } catch (err) {
            console.error(err);
            addMessage('system', "Ocorreu um erro ao processar sua mensagem. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const checkProtocolSuggestion = async (headers) => {
        // ... (existing code)
        const response = await fetch(`${API_URL}/protocol-suggest`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                session_id: sessionId,
                node_id: currentNode ? currentNode.id : undefined
            })
        });
        const data = await response.json();

        if (data.reply) {
            if (data.reply.protocol) {
                const protocol = data.reply.protocol;
                setPendingProtocol(protocol);

                // Add a special "confirmation" message
                setMessages(prev => [...prev, {
                    role: 'system',
                    type: 'protocol_confirmation',
                    text: `Sugestão de Protocolo: ${protocol.text}`,
                    protocol: protocol
                }]);

            } else if (data.reply.type === 'question') {
                setCurrentNode({ id: data.reply.node_id }); // Keep track of node
                addMessage('system', data.reply.text); // Ask the clarification question
                logSystemMessage(data.reply.text);
            } else {
                addMessage('system', "Não foi possível identificar o protocolo. Por favor, dê mais detalhes.");
            }

        } else {
            addMessage('system', "Informação insuficiente. Por favor, detalhe.");
        }
    };

    const confirmProtocol = (protocol) => {
        setSuggestedProtocol(protocol);
        protocolRef.current = protocol;
        setPendingProtocol(null);

        // Replace the confirmation message with a standard text or just proceed
        // We can just proceed, user sees they clicked accept.

        addMessage('system', `Protocolo Confirmado: ${protocol.text}`);

        getAuthHeaders().then(headers => {
            setTimeout(() => traverseTree(headers, protocol.id.replace('protocol_', '')), 100);
        });
    };

    const traverseTree = async (headers, forcedProtocolId = null, overrideNodeId = null, userInput = null) => {
        const protocolName = forcedProtocolId || (protocolRef.current ? protocolRef.current.id.replace('protocol_', '') : null);

        // Combine composite sensors like Blood Pressure
        const finalSensors = { ...sensorInputs };
        if (finalSensors.bp_systolic && finalSensors.bp_diastolic) {
            finalSensors.blood_pressure = `${finalSensors.bp_systolic}/${finalSensors.bp_diastolic}`;
            delete finalSensors.bp_systolic;
            delete finalSensors.bp_diastolic;
        }

        const payload = {
            decision_tree_protocol: protocolName,
            // If switching protocol, start from root (undefined).
            // If override provided (recursion), use it.
            // Otherwise use current state.
            node_id: forcedProtocolId ? undefined : (overrideNodeId || (currentNode ? currentNode.id : undefined)),
            session_id: sessionId,
            user_input: userInput,
            ...finalSensors
        };

        console.log("Traverse Payload:", payload);

        const response = await fetch(`${API_URL}/protocol-traverse`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        handleTraversalResponse(data);
    };

    const handleTraversalResponse = (data) => {
        setLoading(false);
        if (data.status === 'complete') {
            setCurrentNode(data.result);
            setTriageResult(data.result);
            if (data.report) {
                setTriageReport(data.report);
            }
            // addMessage is not strictly needed if we switch view immediately, but kept for history
            addMessage('system', `Triagem Completa! Prioridade: ${data.result.text} (${data.result.priority})`);

        } else if (data.status === 'next_node') {
            const next = data.next_node;
            setCurrentNode(next);

            if (next.type === 'assignment') {
                setTriageResult(next);
                if (data.report) {
                    setTriageReport(data.report);
                }
                addMessage('system', `Triagem Completa! Prioridade: ${next.text} (${next.priority})`);
            } else {
                // Recursive traversal with EXPLICIT next node ID to avoid closure staleness
                setLoading(true);
                getAuthHeaders().then(h => traverseTree(h, null, next.id));
            }

        } else if (data.status === 'ask_user') {
            // Backend evaluated context and decided it needs more info.
            setCurrentNode(data.node);
            const msgText = data.node.question || data.node.text;
            addMessage('system', msgText);
            logSystemMessage(msgText);

        } else if (data.status === 'missing_sensors') {
            const translatedSensors = data.missing_sensors.map(s => {
                const key = s === 'gcs_scale' ? 'gcs' : s;
                return SENSOR_CONFIG[key]?.full_label || SENSOR_CONFIG[key]?.label || s;
            });
            addMessage('system', `Preciso dos seguintes sinais vitais para continuar: ${translatedSensors.join(', ')}. Por favor, preencha o painel lateral.`);
            setMissingSensors(data.missing_sensors);
            setCurrentNode(data.node);
        } else if (data.error) {
            addMessage('system', `Erro: ${data.error}`);
        }
    };

    // ----- Render -----



    const [missingSensors, setMissingSensors] = useState([]);

    const handleSensorChange = (e) => {
        setSensorInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };



    const handleSendSensors = () => {
        console.log("handleSendSensors triggered. Inputs:", sensorInputs);
        setLoading(true);
        // Clear missing sensors flag locally as we are attempting to send them
        setMissingSensors([]);
        getAuthHeaders()
            .then(h => traverseTree(h))
            .catch(e => {
                console.error("Error sending sensors:", e);
                setLoading(false);
            });
    };

    const handleFillNormals = () => {
        setSensorInputs({
            blood_glucose: '100',
            bp_systolic: '120',
            bp_diastolic: '80',
            gcs: '15',
            heart_rate: '80',
            oxygen_saturation: '98',
            pain_scale: '0',
            respiratory_rate: '15',
            temperature: '37'
        });
    };

    // ----- Reset Handlers -----

    const handleRestartTriage = () => {
        // Keep patient info, reset everything else
        setMessages([{ role: 'system', text: 'Sistema de Triagem Reiniciado. Descreva a queixa principal.' }]);
        setInputText('');
        setSuggestedProtocol(null);
        setCurrentNode(null);
        setTriageResult(null);
        setTriageReport(null);
        setSensorInputs({});
        setPendingProtocol(null);
        protocolRef.current = null; // Explicitly clear protocol reference

        // Generate new session ID to avoid history pollution
        setSessionId('session-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
    };

    const handleNewTriage = () => {
        // Reset everything including patient info
        setPatientInfo(null);
        setIsPatientInfoSubmitted(false);
        handleRestartTriage();
    };

    if (triageResult) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: '2rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    padding: '2.5rem',
                    maxWidth: '600px',
                    width: '100%',
                    textAlign: 'center',
                    border: '1px solid #dee2e6'
                }}>
                    <h2 style={{ marginTop: 0, color: '#212529', marginBottom: '0.5rem' }}>Triagem Completa</h2>
                    <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
                        Paciente: <strong>{patientInfo?.name}</strong> ({patientInfo?.age} anos)
                    </p>

                    <div style={{
                        padding: '1.5rem',
                        borderRadius: '8px',
                        marginBottom: '2rem',
                        backgroundColor:
                            triageResult.priority === 'red' ? '#dc3545' :
                                triageResult.priority === 'orange' ? '#fd7e14' :
                                    triageResult.priority === 'yellow' ? '#ffc107' :
                                        triageResult.priority === 'green' ? '#198754' :
                                            triageResult.priority === 'blue' ? '#0d6efd' : '#6c757d',
                        color: '#fff'
                    }}>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', textTransform: 'uppercase' }}>
                            {triageResult.text}
                        </h1>
                    </div>

                    {triageReport && (
                        <div style={{ textAlign: 'left', marginBottom: '2rem', fontSize: '0.95rem' }}>
                            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#495057' }}>Estatísticas da Sessão</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: '#212529' }}>
                                    <span><strong>Início:</strong> {triageReport.stats.start_time ? new Date(triageReport.stats.start_time.endsWith('Z') ? triageReport.stats.start_time : triageReport.stats.start_time + 'Z').toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}</span>
                                    <span><strong>Fim:</strong> {triageReport.stats.end_time ? new Date(triageReport.stats.end_time.endsWith('Z') ? triageReport.stats.end_time : triageReport.stats.end_time + 'Z').toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}</span>
                                    <span style={{ gridColumn: 'span 2' }}>
                                        <strong>Duração:</strong> {triageReport.stats.duration_seconds ? `${Math.floor(triageReport.stats.duration_seconds / 60)}m ${triageReport.stats.duration_seconds % 60}s` : '-'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: '1rem', background: '#e8f4fd', borderRadius: '8px', border: '1px solid #b6effb' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#055160' }}>Raciocínio Clínico (IA)</h4>
                                <p style={{ margin: 0, lineHeight: 1.5, color: '#055160' }}>
                                    {triageReport.reasoning || "Raciocínio não disponível."}
                                </p>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '1rem' }}>


                        <div>
                            <button
                                onClick={handleNewTriage}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#0d6efd',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Nova Triagem
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isPatientInfoSubmitted) {
        return <PatientForm onSubmit={handlePatientSubmit} loading={loading} />;
    }

    return (

        <div style={{
            display: 'grid',
            gridTemplateColumns: '70% 30%',
            gap: '1.5rem',
            height: '100%',
            maxHeight: '100%',
            maxWidth: '1400px', // Increased slightly for better widescreen use
            margin: '0 auto',
            padding: '1.5rem', // Moved padding here from root
            boxSizing: 'border-box',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            color: '#212529',
            overflow: 'hidden' // Prevent global scroll
        }}>

            {/* Left: Chat Interface */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                border: '1px solid #dee2e6',
                height: '100%', // Ensure it fills the grid cell
                maxHeight: '100%'
            }}>
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: '#f8f9fa' }}>
                    {messages.map((msg, idx) => {
                        if (msg.type === 'protocol_confirmation') {
                            return (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{
                                        maxWidth: '85%',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        background: '#ffffff',
                                        border: '1px solid #198754', // Green border to signify action
                                        borderTopLeftRadius: '0',
                                        boxShadow: '0 2px 8px rgba(25, 135, 84, 0.1)'
                                    }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#198754' }}>
                                            {msg.text}
                                        </h4>
                                        <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#555' }}>
                                            Deseja seguir com este protocolo ou selecionar outro?
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => confirmProtocol(msg.protocol)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: '#198754',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                Aceitar
                                            </button>

                                            <select
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        const selected = allProtocols.find(p => p.replace('protocol_', '') === e.target.value) || e.target.value;
                                                        // Construct a protocol object similar to what suggest returns, or just ID
                                                        const pObj = {
                                                            id: selected.startsWith('protocol_') ? selected : `protocol_${selected}`,
                                                            text: selected.replace('protocol_', '').replace(/_/g, ' ') // Simple formatting
                                                        };
                                                        confirmProtocol(pObj);
                                                    }
                                                }}
                                                style={{
                                                    padding: '8px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #ced4da',
                                                    background: '#fff',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Mudar Protocolo...</option>
                                                {allProtocols.map((p, idx) => (
                                                    <option key={`${p}-${idx}`} value={p}>{p.replace('protocol_', '').replace(/_/g, ' ')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                marginBottom: '1rem'
                            }}>
                                <div style={{
                                    maxWidth: '75%',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    background: msg.role === 'user' ? '#0d6efd' : '#ffffff',
                                    color: msg.role === 'user' ? '#ffffff' : '#212529',
                                    border: msg.role === 'user' ? 'none' : '1px solid #dee2e6',
                                    borderTopRightRadius: msg.role === 'user' ? '0' : '12px',
                                    borderTopLeftRadius: msg.role === 'system' ? '0' : '12px',
                                    boxShadow: msg.role === 'user' ? '0 2px 4px rgba(13, 110, 253, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                                    lineHeight: '1.5'
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    {loading && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: '#ffffff',
                                border: '1px solid #dee2e6',
                                borderTopLeftRadius: '0',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                {currentNode?.yesNo && missingSensors.length === 0 && !loading && (
                    <div style={{ padding: '0.5rem 1rem 0', background: '#ffffff', display: 'flex', gap: '8px', borderTop: '1px solid #dee2e6' }}>
                        <button
                            onClick={() => handleSendMessage('Sim')}
                            disabled={loading}
                            style={{
                                padding: '6px 16px',
                                background: '#e9ecef',
                                color: '#495057',
                                border: '1px solid #ced4da',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                opacity: loading ? 0.6 : 1
                            }}
                            onMouseOver={(e) => !loading && (e.target.style.background = '#dee2e6')}
                            onMouseOut={(e) => !loading && (e.target.style.background = '#e9ecef')}
                        >
                            Sim
                        </button>
                        <button
                            onClick={() => handleSendMessage('Não')}
                            disabled={loading}
                            style={{
                                padding: '6px 16px',
                                background: '#e9ecef',
                                color: '#495057',
                                border: '1px solid #ced4da',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                opacity: loading ? 0.6 : 1
                            }}
                            onMouseOver={(e) => !loading && (e.target.style.background = '#dee2e6')}
                            onMouseOut={(e) => !loading && (e.target.style.background = '#e9ecef')}
                        >
                            Não
                        </button>
                    </div>
                )}

                <div style={{ padding: '1rem', background: '#ffffff', display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Digite a queixa do paciente..."
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid #ced4da',
                            fontSize: '1rem',
                            outline: 'none',
                            backgroundColor: '#ffffff',
                            color: '#212529'
                        }}
                    />

                    {/* Microphone Button */}
                    <button
                        onClick={handleToggleRecording}
                        disabled={loading}
                        style={{
                            padding: '0 12px',
                            background: isRecording ? '#dc3545' : 'transparent', // Red when recording
                            color: isRecording ? '#fff' : '#6c757d',
                            border: '1px solid #ced4da',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        title={isRecording ? "Parar Gravação" : "Gravar Áudio"}
                    >
                        {isRecording ? (
                            // Stop Icon (Square)
                            <div style={{ width: 12, height: 12, background: 'currentColor', borderRadius: 2 }} />
                        ) : (
                            // Mic Icon (SVG)
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" />
                                <path d="M19 10C19 13.87 15.87 17 12 17C8.13 17 5 13.87 5 10V9H3V10C3 14.53 6.39 18.26 10.74 18.89L10.99 18.93V21.99H13.01V18.92C17.48 18.37 21 14.54 21 10V9H19V10Z" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={() => handleSendMessage()}
                        disabled={loading}
                        style={{
                            padding: '0 24px',
                            background: '#0d6efd',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'background 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        Enviar
                    </button>
                </div>
            </div>

            {/* Right: Sensors & Info */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                height: '100%',
                maxHeight: '100%',
                overflowY: 'auto', // Enable scrolling for this column
                paddingRight: '4px' // Minor padding for scrollbar aesthetics
            }}>

                {/* Session Info */}
                <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '1.25rem', background: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #dee2e6' }}>
                    <div style={{ marginTop: '0', marginBottom: '10px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {patientInfo ? `${patientInfo.name} (${patientInfo.age} anos, ${patientInfo.sex})` : 'Paciente'}
                    </div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6c757d', letterSpacing: '0.05em', marginBottom: '5px' }}>Protocolo Atual</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#198754', marginBottom: '1rem' }}>{suggestedProtocol ? suggestedProtocol.text : 'Aguardando...'}</div>

                    <button
                        onClick={() => {
                            if (window.confirm("Tem certeza que deseja cancelar esta triagem? O progresso será perdido.")) {
                                handleNewTriage();
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: '#fff',
                            color: '#dc3545',
                            border: '1px solid #dc3545',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.background = '#dc3545';
                            e.target.style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = '#fff';
                            e.target.style.color = '#dc3545';
                        }}
                    >
                        Cancelar Triagem
                    </button>
                </div>

                {/* Sensors */}
                <div style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #dee2e6', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f3f5', paddingBottom: '1rem' }}>
                        <h4 style={{ margin: 0, color: '#212529', fontSize: '1.1rem' }}>Sinais Vitais</h4>
                        <button
                            onClick={handleFillNormals}
                            style={{
                                fontSize: '0.75rem',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                background: '#f8f9fa',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                color: '#6c757d'
                            }}
                            title="Preencher valores normais (Debug)"
                        >
                            Preencher Normais
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '5px' }}>
                        {Object.keys(SENSOR_CONFIG).map(key => {
                            const conf = SENSOR_CONFIG[key];
                            const isMissing = missingSensors.includes(key);

                            // Determine Input Component
                            let inputComponent;
                            if (key === 'pain_scale') {
                                inputComponent = (
                                    <PainInput
                                        value={sensorInputs[key]}
                                        onChange={handleSensorChange}
                                    />
                                );
                            } else if (key === 'gcs') {
                                inputComponent = (
                                    <GCSInput
                                        value={sensorInputs[key]}
                                        onChange={handleSensorChange}
                                    />
                                );
                            } else if (conf.composite) {
                                inputComponent = (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            placeholder="SIS"
                                            name="bp_systolic"
                                            value={sensorInputs.bp_systolic || ''}
                                            onChange={handleSensorChange}
                                            style={{
                                                width: '60px',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                color: '#212529',
                                                backgroundColor: '#ffffff',
                                                textAlign: 'center',
                                                fontSize: '0.95rem', boxSizing: 'border-box'
                                            }}
                                        />
                                        <span style={{ color: '#6c757d', fontWeight: 'bold' }}>/</span>
                                        <input
                                            placeholder="DIA"
                                            name="bp_diastolic"
                                            value={sensorInputs.bp_diastolic || ''}
                                            onChange={handleSensorChange}
                                            style={{
                                                width: '60px',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid #ced4da',
                                                color: '#212529',
                                                backgroundColor: '#ffffff',
                                                textAlign: 'center',
                                                fontSize: '0.95rem', boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                );
                            } else {
                                inputComponent = (
                                    <input
                                        name={key}
                                        value={sensorInputs[key] || ''}
                                        onChange={handleSensorChange}
                                        placeholder="-"
                                        type="number"
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ced4da',
                                            color: '#212529',
                                            backgroundColor: '#ffffff',
                                            fontSize: '0.95rem', boxSizing: 'border-box'
                                        }}
                                    />
                                );
                            }

                            return (
                                <div key={key} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '90px minmax(0, 1fr)',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    backgroundColor: isMissing ? '#fff3f3' : '#f8f9fa',
                                    border: isMissing ? '1px solid #ffc9c9' : '1px solid #e9ecef'
                                }}>
                                    <SensorLabel config={conf} setTooltipState={setTooltipState} />
                                    {inputComponent}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleSendSensors}
                        disabled={loading}
                        style={{
                            marginTop: 'auto',
                            width: '100%',
                            padding: '12px',
                            background: '#198754',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '1rem',
                            boxShadow: '0 2px 4px rgba(25, 135, 84, 0.2)',
                            transition: 'background 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Processando...' : 'Atualizar Sinais Vitais'}
                    </button>
                </div>

            </div>

            {/* Global Tooltip Portal */}
            {tooltipState && (
                <div style={{
                    position: 'fixed',
                    top: tooltipState.y - 8,
                    left: tooltipState.x,
                    transform: 'translate(-50%, -100%)',
                    background: '#333',
                    color: '#fff',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    width: '180px',
                    zIndex: 9999,
                    textAlign: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    pointerEvents: 'none'
                }}>
                    <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>{tooltipState.config.desc}</div>
                    <div>{tooltipState.config.range}</div>
                    {/* Arrow */}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        marginLeft: '-5px',
                        borderWidth: '5px',
                        borderStyle: 'solid',
                        borderColor: '#333 transparent transparent transparent'
                    }} />
                </div>
            )}
        </div>
    );
};

export default ProtocolTriage;
