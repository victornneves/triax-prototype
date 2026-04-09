import { useState, useRef, useEffect } from 'react';
import { IMaskInput } from 'react-imask';
import { getAuthHeaders } from '../utils/auth';
import { useTranscribe } from '../useTranscribe'; // Import hook
import { useToast } from './ui/ToastProvider';
import { Tooltip } from './ui/Tooltip';
import { StatusBar } from './ui/StatusBar';
import PatientForm from './PatientForm';
import './ProtocolTriage.css';

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
    // accentColor is a dynamic clinical value (red=severe, yellow=moderate, green=mild) — kept inline
    const accentColor = val > 7 ? 'var(--mts-red)' : (val > 3 ? 'var(--mts-yellow)' : 'var(--mts-green)');
    return (
        <div className="triage-sensors__pain-group">
            <input
                type="range"
                min="0"
                max="10"
                value={val}
                name="pain_scale"
                onChange={onChange}
                className="triage-sensors__pain-range"
                style={{ accentColor }}
            />
            <span className="triage-sensors__pain-value">{val}</span>
        </div>
    );
};

const GCSInput = ({ value, onChange }) => {
    // Border color is a dynamic clinical severity indicator — kept inline per plan guidance
    const getColor = (v) => {
        if (!v) return 'var(--color-border-strong)';
        const num = parseInt(v);
        if (num <= 8) return 'var(--mts-red)';    // Severe
        if (num <= 12) return 'var(--mts-yellow)'; // Moderate
        return 'var(--mts-green)';                  // Mild/Normal
    };

    return (
        <select
            name="gcs"
            value={value || ""}
            onChange={onChange}
            className="triage-sensors__gcs-select"
            style={{
                border: `1px solid ${getColor(value)}`,
                color: value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
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

const SensorLabel = ({ config }) => (
    <div className="triage-sensors__label">
        <span className="triage-sensors__label-text">
            {config.label}
            <Tooltip
                content={`${config.desc} ${config.range}`}
                label={config.label}
            />
        </span>
        <div className="triage-sensors__hint">{config.hint}</div>
    </div>
);

const ProtocolTriage = () => {
    const toast = useToast();
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
    const [sessionId, setSessionId] = useState(() => 'session-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
    const [suggestedProtocol, setSuggestedProtocol] = useState(null);
    const [currentNode, setCurrentNode] = useState(null);
    const [triageResult, setTriageResult] = useState(null);
    const [triageReport, setTriageReport] = useState(null);
    const [sensorInputs, setSensorInputs] = useState({});
    const [allProtocols, setAllProtocols] = useState([]);
    const [sensorPanelOpen, setSensorPanelOpen] = useState(false);
    const [pendingProtocol, setPendingProtocol] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pendingQuestion, setPendingQuestion] = useState(null); // { question, nodeId }
    const [activeShortcut, setActiveShortcut] = useState(null); // 'sim' | 'nao' | 'record' — drives 150ms pulse class

    // -- AUDIO TRANSCRIPTION --
    const {
        isRecording,
        finalTranscript,
        partialTranscript,
        start: startRecording,
        stop: stopRecording,
        reset: resetRecording,
        error: transcribeError,
        audioDataCallbackRef
    } = useTranscribe();

    const [textBeforeRecording, setTextBeforeRecording] = useState("");

    // -- RECORDING PANEL REFS & STATE --
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const latestAudioRef = useRef(new Float32Array(0));
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Wire audio data callback for waveform visualization
    useEffect(() => {
        audioDataCallbackRef.current = (data) => {
            latestAudioRef.current = data;
        };
        return () => { audioDataCallbackRef.current = null; };
    }, [audioDataCallbackRef]);

    // Waveform canvas draw loop
    useEffect(() => {
        if (!isRecording) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            // Draw flat line when not recording
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const W = canvas.width;
                const H = canvas.height;
                ctx.clearRect(0, 0, W, H);
                ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--color-primary').trim() || '#14b8a6';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, H / 2);
                ctx.lineTo(W, H / 2);
                ctx.stroke();
            }
            return;
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        // Resolve --color-primary from computed style (canvas ctx cannot use CSS vars — Pitfall 4)
        const primaryColor = getComputedStyle(canvas).getPropertyValue('--color-primary').trim() || '#14b8a6';

        const draw = () => {
            const data = latestAudioRef.current;
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            if (data.length === 0) {
                ctx.moveTo(0, H / 2);
                ctx.lineTo(W, H / 2);
            } else {
                const sliceWidth = W / data.length;
                let x = 0;
                for (let i = 0; i < data.length; i++) {
                    const v = data[i] * 0.5 + 0.5;
                    const y = v * H;
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    x += sliceWidth;
                }
            }
            ctx.stroke();
            rafRef.current = requestAnimationFrame(draw);
        };
        rafRef.current = requestAnimationFrame(draw);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [isRecording]);

    // Elapsed timer
    useEffect(() => {
        if (!isRecording) {
            setElapsedSeconds(0);
            return;
        }
        const interval = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

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

    const triggerShortcutFeedback = (key) => {
        setActiveShortcut(key);
        setTimeout(() => setActiveShortcut(null), 150);
    };

    // Keyboard shortcuts: Y → Sim, N → Nao, R → toggle recording, Esc → stop recording
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Esc cancels active recording — always fires, even in form fields (D-09)
            if (e.key === 'Escape' && isRecording) {
                e.preventDefault();
                stopRecording();
                return;
            }

            // Suppress other shortcuts when focus is in form fields (D-08)
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            // Y/N shortcuts — only when yes/no question is pending (D-11)
            if (currentNode?.yesNo && !loading) {
                if (e.key === 'y' || e.key === 'Y') {
                    e.preventDefault();
                    triggerShortcutFeedback('sim');
                    handleSendMessage('Sim');
                    return;
                }
                if (e.key === 'n' || e.key === 'N') {
                    e.preventDefault();
                    triggerShortcutFeedback('nao');
                    handleSendMessage('Não');
                    return;
                }
            }

            // R toggles recording (D-10)
            if ((e.key === 'r' || e.key === 'R') && !loading) {
                e.preventDefault();
                triggerShortcutFeedback('record');
                handleToggleRecording();
                return;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [currentNode, loading, isRecording]);

    useEffect(() => {
        getAuthHeaders().then(headers => {
            fetch(`${API_URL}/protocol_names`, { headers })
                .then(res => { if (!res.ok) throw new Error('Erro ao carregar protocolos: ' + res.status); return res.json(); })
                .then(data => {
                    const list = data.protocols || data;
                    // Sort by name (human readable)
                    const sorted = list.sort((a, b) => a.name.localeCompare(b.name));
                    setAllProtocols(sorted);
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

    // ----- Patient Info Handler -----
    const handlePatientSubmit = async (data) => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            // 1. Register patient info (New Endpoint)
            const patientResponse = await fetch(`${API_URL}/patient-info`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    session_id: sessionId,
                    name: data.name,
                    age: data.age,
                    sex: data.sex,
                    patient_code: data.patient_code,
                    birth_date: data.birth_date,
                    ticket_number: data.ticket_number,
                    insurance: data.insurance,
                    visit_id: data.visit_id,
                    same: data.same
                })
            });
            if (!patientResponse.ok) {
                throw new Error(`Erro ao registrar paciente: ${patientResponse.status}`);
            }

            // 2. Log initial context to transcription
            const infoString = `PACIENTE: ${data.name}, IDADE: ${data.age ?? 'nao informada'}, SEXO: ${data.sex === 'M' ? 'Masculino' : 'Feminino'}.`;
            const transcriptionRes = await fetch(`${API_URL}/transcription`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    session_id: sessionId,
                    transcription: `CONTEXTO INICIAL: ${infoString}`
                })
            });
            if (!transcriptionRes.ok) console.error('Transcription context log failed:', transcriptionRes.status);

            setPatientInfo(data);
            setIsPatientInfoSubmitted(true);
        } catch (e) {
            console.error("Error submitting patient info", e);
            toast.error("Erro ao iniciar sessão. Tente novamente.");
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
            const res = await fetch(`${API_URL}/transcription`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    session_id: sessionId,
                    transcription: `Sistema: ${text}`
                })
            });
            if (!res.ok) console.error('Transcription system log failed:', res.status);
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
            }).then(res => { if (!res.ok) console.error('Transcription upload failed:', res.status); }).catch(e => console.error("Transcription upload failed", e));

            // 2. Decide next action based on state
            if (!protocolRef.current) {
                await checkProtocolSuggestion(headers, userMsg);
            } else if (pendingQuestion) {
                const formattedInput = `Pergunta: ${pendingQuestion.question} Resposta: ${userMsg}`;
                const nodeId = pendingQuestion.nodeId;
                setPendingQuestion(null);
                await traverseTree(headers, null, nodeId, formattedInput);
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

    const checkProtocolSuggestion = async (headers, promptText) => {
        // ... (existing code)
        const response = await fetch(`${API_URL}/protocol-suggest`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                prompt: promptText || "",
                session_id: sessionId,
                node_id: currentNode ? currentNode.id : undefined
            })
        });
        if (!response.ok) {
            throw new Error(`Erro na sugestao de protocolo: ${response.status}`);
        }
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
                setCurrentNode({ id: data.reply.node_id, yesNo: true }); // Keep track of node
                addMessage('system', data.reply.text); // Ask the clarification question
                logSystemMessage(data.reply.text);
            } else {
                addMessage('system', "Não foi possível identificar o protocolo. Por favor, dê mais detalhes.");
            }

        } else if (data.error) {
            addMessage('system', "Não foi possível carregar o protocolo. Por favor, tente descrever o sintoma novamente.");
        } else {
            addMessage('system', "Informação insuficiente. Por favor, detalhe melhor a queixa.");
        }
    };

    const submitSensorData = async (headers, sensors) => {
        // Build the payload matching SensorDataRequest schema
        const payload = { session_id: sessionId };

        // Map frontend sensor keys to API schema keys
        if (sensors.blood_glucose) payload.blood_glucose = parseFloat(sensors.blood_glucose);
        if (sensors.bp_systolic && sensors.bp_diastolic) {
            payload.blood_pressure = `${sensors.bp_systolic}/${sensors.bp_diastolic}`;
        }
        if (sensors.gcs) payload.gcs = parseInt(sensors.gcs, 10);
        if (sensors.heart_rate) payload.heart_rate = parseInt(sensors.heart_rate, 10);
        if (sensors.oxygen_saturation) payload.oxygen_saturation = parseInt(sensors.oxygen_saturation, 10);
        if (sensors.pain_scale) payload.pain_scale = parseInt(sensors.pain_scale, 10);
        if (sensors.respiratory_rate) payload.respiratory_rate = parseInt(sensors.respiratory_rate, 10);
        if (sensors.temperature) payload.temperature = parseFloat(sensors.temperature);

        // Only call if we have at least one sensor value beyond session_id
        if (Object.keys(payload).length <= 1) return;

        try {
            const response = await fetch(`${API_URL}/sensor-data`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                console.error("sensor-data submission failed:", response.status);
            } else {
                const data = await response.json();
                console.log("Sensor data saved. Features:", data.features);
            }
        } catch (err) {
            console.error("Error submitting sensor data:", err);
        }
    };

    const fetchProtocolDefinition = async (protocolId) => {
        // Strip 'protocol_' prefix for the path parameter per openapi.yaml spec
        const protocolName = protocolId.replace(/^protocol_/, '');
        try {
            const response = await fetch(`${API_URL}/protocol/${protocolName}`);
            if (!response.ok) {
                console.error("Failed to fetch protocol definition:", response.status);
                return null;
            }
            const data = await response.json();
            console.log("Protocol definition loaded:", protocolName);
            return data;
        } catch (err) {
            console.error("Error fetching protocol definition:", err);
            return null;
        }
    };

    const confirmProtocol = (protocol) => {
        setSuggestedProtocol(protocol);
        protocolRef.current = protocol;
        setPendingProtocol(null);

        // Replace the confirmation message with a standard text or just proceed
        // We can just proceed, user sees they clicked accept.

        addMessage('system', `Protocolo Confirmado: ${protocol.text}`);
        setLoading(true);

        // Fire-and-forget protocol definition fetch (API-07)
        fetchProtocolDefinition(protocol.id);

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

        const MAX_RETRIES = 3;
        const TIMEOUT_MS = 29000;
        let lastError;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
                const response = await fetch(`${API_URL}/protocol-traverse`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                if (response.status === 503 && attempt < MAX_RETRIES) {
                    const delay = attempt * 1000;
                    console.warn(`protocol-traverse 503, retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                if (!response.ok) throw new Error('Erro no protocolo de triagem: ' + response.status);
                const data = await response.json();
                handleTraversalResponse(data);
                return;
            } catch (err) {
                lastError = err;
                if (attempt < MAX_RETRIES) {
                    const delay = attempt * 1000;
                    console.warn(`protocol-traverse error (${err.message}), retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }
        console.error("protocol-traverse failed after retries:", lastError);
        handleTraversalResponse({ error: "service_unavailable" });
    };

    const handleTraversalResponse = (data) => {
        setLoading(false);

        // Handle auto-detected sensors from backend
        if (data.sensor_data) {
            setSensorInputs(prev => {
                const newData = { ...prev };
                Object.entries(data.sensor_data).forEach(([key, value]) => {
                    if (key === 'blood_pressure' && typeof value === 'string' && value.includes('/')) {
                        const [sys, dia] = value.split('/');
                        newData.bp_systolic = sys;
                        newData.bp_diastolic = dia;
                    } else if (key === 'gcs_scale') {
                        newData.gcs = value;
                    } else {
                        newData[key] = value;
                    }
                });
                return newData;
            });
        }

        if (data.status === 'complete') {
            setCurrentNode(data.result);
            setTriageResult(data.result);
            if (data.report) {
                setTriageReport(data.report);
            }
            // addMessage is not strictly needed if we switch view immediately, but kept for history
            addMessage('system', `Triagem Completa! Prioridade: ${data.result.text} (${data.result.priority})`);
            // Finalize session on backend (fire-and-forget)
            finishSession();

        } else if (data.status === 'next_node') {
            const next = data.next_node;
            const nextId = data.next_node_id || (next ? next.id : null);

            if (next) {
                setCurrentNode(next);
            }

            if (next && next.type === 'assignment') {
                setTriageResult(next);
                if (data.report) {
                    setTriageReport(data.report);
                }
                addMessage('system', `Triagem Completa! Prioridade: ${next.text} (${next.priority})`);
                finishSession();
            } else if (nextId) {
                // Recursive traversal with EXPLICIT next node ID
                setLoading(true);
                getAuthHeaders().then(h => traverseTree(h, null, nextId));
            } else {
                console.warn("Status 'next_node' received but no ID available for jump.");
                setLoading(false);
            }

        } else if (data.status === 'ask_user') {
            const question = data.question || data.node?.question || data.node?.text;
            const nodeId = data.current_node_id || data.node?.id || (currentNode ? currentNode.id : null);
            if (question) {
                setPendingQuestion({ question, nodeId });
                addMessage('system', question);
                logSystemMessage(question);
            } else {
                console.warn("Status 'ask_user' received but no question found.", data);
            }
            if (data.node) setCurrentNode(data.node);

        } else if (data.status === 'missing_sensors') {
            if (data.missing_sensors) {
                const translatedSensors = data.missing_sensors.map(s => {
                    const key = s === 'gcs_scale' ? 'gcs' : s;
                    return SENSOR_CONFIG[key]?.full_label || SENSOR_CONFIG[key]?.label || s;
                });
                addMessage('system', `Preciso dos seguintes sinais vitais para continuar: ${translatedSensors.join(', ')}. Por favor, preencha o painel lateral, ou digite os valores.`);
                setMissingSensors(data.missing_sensors);
            }
            if (data.node) {
                setCurrentNode(data.node);
            }
        } else if (data.error) {
            addMessage('system', "Houve um erro no processamento deste passo. Por favor, tente novamente.");
            console.error("Traversal Error:", data.error);
        }
    };

    const finishSession = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/session-finish`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ session_id: sessionId })
            });
            if (!response.ok) {
                console.error("session-finish failed:", response.status);
            } else {
                const data = await response.json();
                console.log("Session finished, S3 key:", data.s3_key);
            }
        } catch (err) {
            console.error("Error finishing session:", err);
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
            .then(async (h) => {
                // Submit sensor data as dedicated call (API-04)
                await submitSensorData(h, sensorInputs);
                // Then proceed with traversal (sensors also included in traverse payload)
                await traverseTree(h);
            })
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

    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/history/${sessionId}/pdf`, {
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

    if (triageResult) {
        // MTS priority colors applied via .priority-{color} CSS classes from App.css
        const priorityClass =
            triageResult.priority === 'red' ? 'priority-red' :
                triageResult.priority === 'orange' ? 'priority-orange' :
                    triageResult.priority === 'yellow' ? 'priority-yellow' :
                        triageResult.priority === 'green' ? 'priority-green' :
                            triageResult.priority === 'blue' ? 'priority-blue' : '';

        return (
            <div className="triage-complete">
                <div className="triage-complete__card">
                    <h2 className="triage-complete__title">Triagem Completa</h2>
                    <p className="triage-complete__patient-info">
                        Paciente: <strong>{patientInfo?.name}</strong> ({patientInfo?.age} anos)
                    </p>

                    <div
                        className={`triage-complete__priority-badge priority-badge ${priorityClass}`}
                    >
                        <div className="triage-complete__priority-label">
                            {triageResult.priority === 'red' ? 'VERMELHO - EMERGÊNCIA' :
                                triageResult.priority === 'orange' ? 'LARANJA - MUITO URGENTE' :
                                    triageResult.priority === 'yellow' ? 'AMARELO - URGENTE' :
                                        triageResult.priority === 'green' ? 'VERDE - POUCO URGENTE' :
                                            triageResult.priority === 'blue' ? 'AZUL - NÃO URGENTE' : 'INDEFINIDO'}
                        </div>
                        <h1 className="triage-complete__priority-text">
                            {triageResult.text}
                        </h1>
                    </div>

                    {triageReport && (
                        <div className="triage-complete__report">
                            <div className="triage-complete__stats-card">
                                <h4 className="triage-complete__stats-title">Estatísticas da Sessão</h4>
                                <div className="triage-complete__stats-grid">
                                    <span><strong>Início:</strong> {triageReport.stats.start_time ? new Date(triageReport.stats.start_time.endsWith('Z') ? triageReport.stats.start_time : triageReport.stats.start_time + 'Z').toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}</span>
                                    <span><strong>Fim:</strong> {triageReport.stats.end_time ? new Date(triageReport.stats.end_time.endsWith('Z') ? triageReport.stats.end_time : triageReport.stats.end_time + 'Z').toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}</span>
                                    <span className="triage-complete__stats-duration">
                                        <strong>Duração:</strong> {triageReport.stats.duration_seconds ? `${Math.floor(triageReport.stats.duration_seconds / 60)}m ${triageReport.stats.duration_seconds % 60}s` : '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="triage-complete__reasoning-card">
                                <h4 className="triage-complete__reasoning-title">Raciocínio Clínico (IA)</h4>
                                <p className="triage-complete__reasoning-text">
                                    {triageReport.reasoning || "Raciocínio não disponível."}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="triage-complete__actions">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={pdfLoading}
                            className="triage-complete__pdf-btn"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            {pdfLoading ? 'Gerando...' : 'Baixar PDF'}
                        </button>

                        <button
                            onClick={handleNewTriage}
                            className="triage-complete__new-btn"
                        >
                            Nova Triagem
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isPatientInfoSubmitted) {
        return <PatientForm onSubmit={handlePatientSubmit} loading={loading} />;
    }

    return (
        <>
        {/* Status bar — visible during active triage */}
        <StatusBar
            sessionId={sessionId}
            protocolName={suggestedProtocol ? suggestedProtocol.text : ''}
        />

        <div className="triage-layout">

            {/* Left: Chat Interface */}
            <section className="triage-chat-column" aria-label="Conversa de triagem">
                <div className="chat-messages">
                    {messages.map((msg, idx) => {
                        if (msg.type === 'protocol_confirmation') {
                            return (
                                <div key={idx} className="chat-message-row chat-message-row--system">
                                    <div className="chat-bubble--confirmation">
                                        <h4 className="chat-bubble__confirmation-title">
                                            {msg.text}
                                        </h4>
                                        <p className="chat-bubble__confirmation-subtitle">
                                            Deseja seguir com este protocolo ou selecionar outro?
                                        </p>
                                        <div className="chat-bubble__confirmation-actions">
                                            <button
                                                onClick={() => confirmProtocol(msg.protocol)}
                                                className="chat-bubble__accept-btn"
                                            >
                                                Aceitar
                                            </button>

                                            <select
                                                onChange={(e) => {
                                                    const selectedId = e.target.value;
                                                    if (selectedId) {
                                                        const p = allProtocols.find(p => p.protocol_id === selectedId);
                                                        const pObj = {
                                                            id: selectedId,
                                                            text: p ? p.name : selectedId
                                                        };
                                                        confirmProtocol(pObj);
                                                    }
                                                }}
                                                className="chat-protocol-select"
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Mudar Protocolo...</option>
                                                {allProtocols.map((p, idx) => (
                                                    <option key={`${p.protocol_id}-${idx}`} value={p.protocol_id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={idx}
                                className={`animate-fade-in chat-message-row chat-message-row--${msg.role}`}
                            >
                                <div className={`chat-bubble chat-bubble--${msg.role}`}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    {loading && (
                        <div className="chat-loading-row">
                            <div className="chat-loading-bubble">
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
                    <div className="chat-quick-replies">
                        <button
                            onClick={() => handleSendMessage('Sim')}
                            disabled={loading}
                            className={`chat-quick-reply-btn${activeShortcut === 'sim' ? ' shortcut-active' : ''}`}
                        >
                            Sim <span className="shortcut-hint">(Y)</span>
                        </button>
                        <button
                            onClick={() => handleSendMessage('Não')}
                            disabled={loading}
                            className={`chat-quick-reply-btn${activeShortcut === 'nao' ? ' shortcut-active' : ''}`}
                        >
                            Não <span className="shortcut-hint">(N)</span>
                        </button>
                    </div>
                )}

                {isRecording ? (
                    <div className="recording-panel">
                        <div className="recording-panel__transcript">
                            {finalTranscript && (
                                <span className="recording-panel__final">{finalTranscript}</span>
                            )}
                            {partialTranscript && (
                                <span className="recording-panel__partial">{partialTranscript}</span>
                            )}
                            {!finalTranscript && !partialTranscript && (
                                <span className="recording-panel__placeholder">Aguardando transcricao...</span>
                            )}
                        </div>
                        <div className="recording-panel__controls">
                            <canvas
                                ref={canvasRef}
                                className="recording-panel__waveform"
                                width={280}
                                height={120}
                            />
                            <span className="recording-panel__timer">{formatTime(elapsedSeconds)}</span>
                            <button
                                onClick={stopRecording}
                                className="btn btn--danger btn--sm recording-panel__stop-btn"
                            >
                                Parar <span className="shortcut-hint">(Esc)</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="chat-input-bar">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Digite a queixa do paciente..."
                            disabled={loading}
                            className="chat-text-input"
                        />
                        <button
                            onClick={handleToggleRecording}
                            disabled={loading}
                            className={`chat-mic-btn${activeShortcut === 'record' ? ' shortcut-active' : ''}`}
                            title="Gravar Audio (R)"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" />
                                <path d="M19 10C19 13.87 15.87 17 12 17C8.13 17 5 13.87 5 10V9H3V10C3 14.53 6.39 18.26 10.74 18.89L10.99 18.93V21.99H13.01V18.92C17.48 18.37 21 14.54 21 10V9H19V10Z" />
                            </svg>
                            Gravar <span className="shortcut-hint">(R)</span>
                        </button>
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={loading}
                            className="chat-send-btn"
                        >
                            Enviar
                        </button>
                    </div>
                )}
            </section>

            {/* Right: Sensors & Info — desktop sidebar */}
            <div className="triage-sensors-column">

                {/* Session Info */}
                <div className="triage-session-info">
                    <div className="triage-session-info__patient-name">
                        {patientInfo ? `${patientInfo.name} (${patientInfo.age} anos, ${patientInfo.sex})` : 'Paciente'}
                    </div>
                    <div className="triage-session-info__protocol-label">Protocolo Atual</div>
                    <div className="triage-session-info__protocol-value">{suggestedProtocol ? suggestedProtocol.text : 'Aguardando...'}</div>

                    <button
                        onClick={() => {
                            if (window.confirm("Tem certeza que deseja cancelar esta triagem? O progresso será perdido.")) {
                                handleNewTriage();
                            }
                        }}
                        className="triage-cancel-btn"
                    >
                        Cancelar Triagem
                    </button>
                </div>

                {/* Sensors */}
                <div className="triage-sensors">
                    <div className="triage-sensors__header">
                        <h4 className="triage-sensors__title">Sinais Vitais</h4>
                        <button
                            onClick={handleFillNormals}
                            className="triage-sensors__fill-btn"
                            title="Preencher valores normais (Debug)"
                        >
                            Preencher Normais
                        </button>
                    </div>

                    <div className="triage-sensors__list">
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
                                    <div className="triage-sensors__bp-group">
                                        <input
                                            placeholder="SIS"
                                            name="bp_systolic"
                                            type="number"
                                            maxLength={3}
                                            min={0}
                                            max={300}
                                            value={sensorInputs.bp_systolic || ''}
                                            onChange={handleSensorChange}
                                            className="triage-sensors__bp-input"
                                        />
                                        <span className="triage-sensors__bp-separator">/</span>
                                        <input
                                            placeholder="DIA"
                                            name="bp_diastolic"
                                            type="number"
                                            maxLength={3}
                                            min={0}
                                            max={300}
                                            value={sensorInputs.bp_diastolic || ''}
                                            onChange={handleSensorChange}
                                            className="triage-sensors__bp-input"
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
                                        className="triage-sensors__input"
                                    />
                                );
                            }

                            return (
                                <div
                                    key={key}
                                    className={`triage-sensors__item${isMissing ? ' triage-sensors__item--missing sensor-missing-pulse' : ''}`}
                                >
                                    <SensorLabel config={conf} />
                                    {inputComponent}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleSendSensors}
                        disabled={loading}
                        className="triage-sensors__submit-btn"
                    >
                        {loading ? 'Processando...' : 'Atualizar Sinais Vitais'}
                    </button>
                </div>

            </div>

            {/* Sensor panel — slide-up aside on mobile */}
            <aside
                id="sensor-panel"
                className={`triage-sensors-aside${sensorPanelOpen ? ' triage-sensors-aside--open' : ''}`}
                aria-label="Painel de sinais vitais"
            >
                {/* Session Info */}
                <div className="triage-session-info">
                    <div className="triage-session-info__patient-name">
                        {patientInfo ? `${patientInfo.name} (${patientInfo.age} anos, ${patientInfo.sex})` : 'Paciente'}
                    </div>
                    <div className="triage-session-info__protocol-label">Protocolo Atual</div>
                    <div className="triage-session-info__protocol-value">{suggestedProtocol ? suggestedProtocol.text : 'Aguardando...'}</div>
                    <button
                        onClick={() => {
                            if (window.confirm("Tem certeza que deseja cancelar esta triagem? O progresso será perdido.")) {
                                handleNewTriage();
                            }
                        }}
                        className="triage-cancel-btn"
                    >
                        Cancelar Triagem
                    </button>
                </div>

                {/* Sensors */}
                <div className="triage-sensors">
                    <div className="triage-sensors__header">
                        <h4 className="triage-sensors__title">Sinais Vitais</h4>
                        <button
                            onClick={handleFillNormals}
                            className="triage-sensors__fill-btn"
                            title="Preencher valores normais (Debug)"
                        >
                            Preencher Normais
                        </button>
                    </div>

                    <div className="triage-sensors__list">
                        {Object.keys(SENSOR_CONFIG).map(key => {
                            const conf = SENSOR_CONFIG[key];
                            const isMissing = missingSensors.includes(key);

                            let inputComponent;
                            if (key === 'pain_scale') {
                                inputComponent = <PainInput value={sensorInputs[key]} onChange={handleSensorChange} />;
                            } else if (key === 'gcs') {
                                inputComponent = <GCSInput value={sensorInputs[key]} onChange={handleSensorChange} />;
                            } else if (conf.composite) {
                                inputComponent = (
                                    <div className="triage-sensors__bp-group">
                                        <input placeholder="SIS" name="bp_systolic" value={sensorInputs.bp_systolic || ''} onChange={handleSensorChange} className="triage-sensors__bp-input" />
                                        <span className="triage-sensors__bp-separator">/</span>
                                        <input placeholder="DIA" name="bp_diastolic" value={sensorInputs.bp_diastolic || ''} onChange={handleSensorChange} className="triage-sensors__bp-input" />
                                    </div>
                                );
                            } else {
                                inputComponent = <input name={key} value={sensorInputs[key] || ''} onChange={handleSensorChange} placeholder="-" type="number" className="triage-sensors__input" />;
                            }

                            return (
                                <div key={key} className={`triage-sensors__item${isMissing ? ' triage-sensors__item--missing sensor-missing-pulse' : ''}`}>
                                    <SensorLabel config={conf} />
                                    {inputComponent}
                                </div>
                            );
                        })}
                    </div>

                    <button onClick={handleSendSensors} disabled={loading} className="triage-sensors__submit-btn">
                        {loading ? 'Processando...' : 'Atualizar Sinais Vitais'}
                    </button>
                </div>
            </aside>

            {/* Compact vitals summary strip — mobile only */}
            <div className="triage-sensors__summary" aria-hidden="true">
                SpO2: {sensorInputs.oxygen_saturation || '\u2014'}% | FC: {sensorInputs.heart_rate || '\u2014'} bpm | T: {sensorInputs.temperature || '\u2014'}°C
            </div>

            {/* Toggle button — mobile only */}
            <button
                className="triage-sensors__toggle"
                onClick={() => setSensorPanelOpen(prev => !prev)}
                aria-expanded={sensorPanelOpen}
                aria-controls="sensor-panel"
            >
                {sensorPanelOpen ? 'Ocultar Sinais Vitais' : 'Mostrar Sinais Vitais'}
            </button>

            {/* Backdrop — mobile only, visible when panel is open */}
            {sensorPanelOpen && (
                <div
                    className="triage-sensors__backdrop"
                    onClick={() => setSensorPanelOpen(false)}
                    aria-hidden="true"
                />
            )}
        </div>
        </>
    );
};

export default ProtocolTriage;
