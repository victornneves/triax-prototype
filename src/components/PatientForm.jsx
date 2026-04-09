import { useState } from 'react';
import { IMaskInput } from 'react-imask';
import { Tooltip } from './ui/Tooltip';
import './PatientForm.css';

function calcAgeFromDDMMYYYY(ddmmyyyy) {
    if (!ddmmyyyy || ddmmyyyy.length !== 10) return null;
    const [dd, mm, yyyy] = ddmmyyyy.split('/').map(Number);
    if (!dd || !mm || !yyyy) return null;
    const today = new Date();
    let age = today.getFullYear() - yyyy;
    const monthDiff = today.getMonth() + 1 - mm;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dd)) age--;
    return age >= 1 && age <= 150 ? String(age) : null;
}

// Lookup stub — wire to real endpoint later (D-06)
// Interface: accepts raw 11-digit CPF string, returns { name, sex, birth_date } or null
async function lookupPatientByCPF(/* cpf */) {
    return null; // stub: always "no match"
}

const PatientForm = ({ onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        cpf: '',
        name: '',
        sex: 'M',
        birth_date: '',
        patient_code: '',
        ticket_number: '',
        insurance: '',
        visit_id: '',
        same: ''
    });

    const [errors, setErrors] = useState({});
    const [isLookingUp, setIsLookingUp] = useState(false);

    function validateField(name, value) {
        switch (name) {
            case 'name':
                if (!value || !value.trim()) return 'Nome e obrigatorio';
                return null;
            case 'birth_date':
                if (!value || value.length < 10) return null;
                {
                    const [dd, mm, yyyy] = value.split('/').map(Number);
                    if (!dd || !mm || !yyyy || dd > 31 || mm > 12 || yyyy < 1900 || yyyy > new Date().getFullYear()) {
                        return 'Data invalida. Use o formato DD/MM/AAAA';
                    }
                }
                return null;
            case 'cpf':
                if (!value) return null;
                if (value.replace(/\D/g, '').length !== 11) return 'CPF deve ter 11 digitos';
                return null;
            default:
                return null;
        }
    }

    function handleBlur(e) {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    }

    const handleCpfBlur = async () => {
        const cpfDigits = formData.cpf;
        const error = validateField('cpf', cpfDigits);
        setErrors(prev => ({ ...prev, cpf: error }));
        if (!error && cpfDigits && cpfDigits.length === 11) {
            setIsLookingUp(true);
            try {
                const result = await lookupPatientByCPF(cpfDigits);
                if (result) {
                    setFormData(prev => ({
                        ...prev,
                        name: result.name || prev.name,
                        sex: result.sex || prev.sex,
                        birth_date: result.birth_date || prev.birth_date,
                    }));
                }
                // D-05: no message on no-match
            } catch {
                // Lookup error — silent for stub (no toast needed until real endpoint)
            } finally {
                setIsLookingUp(false);
            }
        }
    };

    function validateAll() {
        const newErrors = {};
        newErrors.name = validateField('name', formData.name);
        if (formData.birth_date) newErrors.birth_date = validateField('birth_date', formData.birth_date);
        if (formData.cpf) newErrors.cpf = validateField('cpf', formData.cpf);
        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    }

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleBirthDateAccept = (value) => {
        setFormData(prev => ({ ...prev, birth_date: value }));
    };

    // Computed age derived from birth_date (D-10, D-12)
    const computedAge = calcAgeFromDDMMYYYY(formData.birth_date);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateAll()) return;
        const age = calcAgeFromDDMMYYYY(formData.birth_date);
        onSubmit({ ...formData, age: age !== null ? age : undefined });
    };

    return (
        <div className="patient-form-wrapper">
            <form onSubmit={handleSubmit} className="patient-form">
                <h3 className="patient-form__title">Dados do Paciente</h3>

                {/* 1. CPF field — first (D-01) */}
                <div className="patient-form__field">
                    <label htmlFor="patient-cpf" className="patient-form__label">
                        CPF <Tooltip content="Cadastro de Pessoa Fisica — 11 digitos" label="CPF" />
                    </label>
                    <div className="patient-form__cpf-wrapper">
                        <IMaskInput
                            id="patient-cpf"
                            name="cpf"
                            mask="000.000.000-00"
                            unmask={true}
                            value={formData.cpf || ''}
                            onAccept={(unmaskedValue) => setFormData(prev => ({ ...prev, cpf: unmaskedValue }))}
                            onBlur={handleCpfBlur}
                            placeholder="000.000.000-00"
                            className={`patient-form__input${errors.cpf ? ' patient-form__input--error' : ''}`}
                            aria-invalid={!!errors.cpf}
                            aria-describedby={errors.cpf ? 'cpf-error' : undefined}
                        />
                        {isLookingUp && <span className="patient-form__cpf-spinner" aria-label="Buscando paciente..." />}
                    </div>
                    {errors.cpf && (
                        <span id="cpf-error" className="patient-form__error" role="alert">{errors.cpf}</span>
                    )}
                </div>

                {/* 2. Name field (D-08: second tab stop) */}
                <div className="patient-form__field">
                    <label htmlFor="patient-name" className="patient-form__label">
                        Nome Completo <span className="patient-form__required" aria-hidden="true">*</span>
                        <Tooltip content="Nome completo do paciente conforme documento" label="nome" />
                    </label>
                    <input
                        id="patient-name" name="name" value={formData.name}
                        onChange={handleChange} onBlur={handleBlur}
                        placeholder="Ex: Maria Souza"
                        className={`patient-form__input${errors.name ? ' patient-form__input--error' : ''}`}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'patient-name-error' : undefined}
                    />
                    {errors.name && (
                        <span id="patient-name-error" className="patient-form__error" role="alert">{errors.name}</span>
                    )}
                </div>

                {/* 3. Birth Date + Age display + Sex — grid row (D-08, D-10, D-11) */}
                <div className="patient-form__grid-clinical">
                    <div>
                        <label htmlFor="patient-birth_date" className="patient-form__label">
                            Nascimento
                            <Tooltip content="Formato: DD/MM/AAAA. A idade sera calculada automaticamente." label="data de nascimento" />
                        </label>
                        <IMaskInput
                            id="patient-birth_date" name="birth_date"
                            mask="00/00/0000" unmask={false}
                            value={formData.birth_date}
                            onAccept={handleBirthDateAccept}
                            onBlur={handleBlur}
                            placeholder="DD/MM/AAAA"
                            className={`patient-form__input${errors.birth_date ? ' patient-form__input--error' : ''}`}
                            aria-invalid={!!errors.birth_date}
                            aria-describedby={errors.birth_date ? 'birth-date-error' : undefined}
                        />
                        {errors.birth_date && (
                            <span id="birth-date-error" className="patient-form__error" role="alert">{errors.birth_date}</span>
                        )}
                    </div>
                    <div className="patient-form__age-display-wrapper">
                        <span className="patient-form__label">Idade</span>
                        <p className="patient-form__age-display" aria-live="polite">
                            {computedAge !== null ? `${computedAge} anos` : '\u2014'}
                        </p>
                    </div>
                    <div>
                        <label htmlFor="patient-sex" className="patient-form__label">Sexo</label>
                        <select
                            id="patient-sex" name="sex" value={formData.sex}
                            onChange={handleChange} className="patient-form__input"
                        >
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                        </select>
                    </div>
                </div>

                {/* 4. Metadata section (D-13..D-16) — after clinical fields, before submit */}
                <section className="patient-form__metadata" aria-label="Dados Administrativos">
                    <h4 className="patient-form__section-label">Dados Administrativos</h4>
                    <div className="patient-form__metadata-grid">
                        <div>
                            <label htmlFor="patient-patient_code" className="patient-form__meta-label">Cod. Paciente</label>
                            <input id="patient-patient_code" name="patient_code" value={formData.patient_code} onChange={handleChange} placeholder="00000" className="patient-form__meta-input" />
                        </div>
                        <div>
                            <label htmlFor="patient-ticket_number" className="patient-form__meta-label">Senha (Ticket)</label>
                            <input id="patient-ticket_number" name="ticket_number" value={formData.ticket_number} onChange={handleChange} placeholder="Ex: PU0022" className="patient-form__meta-input" />
                        </div>
                        <div>
                            <label htmlFor="patient-insurance" className="patient-form__meta-label">Convenio</label>
                            <input id="patient-insurance" name="insurance" value={formData.insurance} onChange={handleChange} placeholder="Ex: SUS-SIA" className="patient-form__meta-input" />
                        </div>
                        <div>
                            <label htmlFor="patient-visit_id" className="patient-form__meta-label">Atendimento (Visit ID)</label>
                            <input id="patient-visit_id" name="visit_id" value={formData.visit_id} onChange={handleChange} placeholder="Ex: ATEND123" className="patient-form__meta-input" />
                        </div>
                        <div>
                            <label htmlFor="patient-same" className="patient-form__meta-label">SAME</label>
                            <input id="patient-same" name="same" value={formData.same} onChange={handleChange} placeholder="Ex: 45678" className="patient-form__meta-input" />
                        </div>
                    </div>
                </section>

                {/* 5. Sticky submit wrapper (D-09) */}
                <div className="patient-form__submit-wrapper">
                    <button type="submit" disabled={loading} className="patient-form__submit">
                        {loading ? 'Iniciando Triagem...' : 'Iniciar Triagem'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PatientForm;
