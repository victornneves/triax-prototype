import { Tooltip } from './ui/Tooltip';
import './SensorPanel.css';

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

const SensorPanel = ({ sensorInputs, missingSensors, onSensorChange, onSubmit, loading, getFieldStatus }) => {
    return (
        <div className="triage-sensors">
            <h4 className="triage-sensors__title">Sinais Vitais</h4>

            <div className="triage-sensors__list">
                {Object.keys(SENSOR_CONFIG).map(key => {
                    const conf = SENSOR_CONFIG[key];
                    const isMissing = missingSensors.includes(key);
                    const fieldStatus = getFieldStatus ? getFieldStatus(key, sensorInputs[key]) : null;

                    let inputComponent;
                    if (key === 'pain_scale') {
                        inputComponent = (
                            <PainInput
                                value={sensorInputs[key]}
                                onChange={onSensorChange}
                            />
                        );
                    } else if (key === 'gcs') {
                        inputComponent = (
                            <GCSInput
                                value={sensorInputs[key]}
                                onChange={onSensorChange}
                            />
                        );
                    } else if (conf.composite) {
                        inputComponent = (
                            <div className="triage-sensors__bp-group">
                                <div className="triage-sensors__bp-field">
                                    <label className="triage-sensors__bp-label" htmlFor="bp-systolic-input">SIS</label>
                                    <input
                                        id="bp-systolic-input"
                                        placeholder="SIS"
                                        name="bp_systolic"
                                        type="number"
                                        maxLength={3}
                                        min={0}
                                        max={300}
                                        value={sensorInputs.bp_systolic || ''}
                                        onChange={onSensorChange}
                                        className="triage-sensors__bp-input"
                                    />
                                </div>
                                <span className="triage-sensors__bp-separator">/</span>
                                <div className="triage-sensors__bp-field">
                                    <label className="triage-sensors__bp-label" htmlFor="bp-diastolic-input">DIA</label>
                                    <input
                                        id="bp-diastolic-input"
                                        placeholder="DIA"
                                        name="bp_diastolic"
                                        type="number"
                                        maxLength={3}
                                        min={0}
                                        max={300}
                                        value={sensorInputs.bp_diastolic || ''}
                                        onChange={onSensorChange}
                                        className="triage-sensors__bp-input"
                                    />
                                </div>
                            </div>
                        );
                    } else {
                        inputComponent = (
                            <input
                                name={key}
                                value={sensorInputs[key] || ''}
                                onChange={onSensorChange}
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
                            {...(fieldStatus ? { 'data-field-status': fieldStatus } : {})}
                        >
                            <SensorLabel config={conf} />
                            {inputComponent}
                        </div>
                    );
                })}
            </div>

            <button
                onClick={onSubmit}
                disabled={loading}
                className="triage-sensors__submit-btn"
            >
                {loading ? 'Processando...' : 'Atualizar Sinais Vitais'}
            </button>
        </div>
    );
};

export { SENSOR_CONFIG };
export default SensorPanel;
