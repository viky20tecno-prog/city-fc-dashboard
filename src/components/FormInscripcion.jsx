import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserPlus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const CAMPOS = [
  { key: 'tipo_id', label: 'Tipo de documento', type: 'select', required: true, section: 'personal', options: ['Cédula de Ciudadanía', 'Tarjeta de Identidad', 'Cédula de Extranjería', 'Pasaporte', 'NIT'] },
  { key: 'cedula', label: 'Número de documento', type: 'text', placeholder: 'Ej: 1234567890', required: true, section: 'personal' },
  { key: 'nombre', label: 'Nombre(s)', type: 'text', placeholder: 'Ej: Santiago', required: true, section: 'personal' },
  { key: 'apellidos', label: 'Apellido(s)', type: 'text', placeholder: 'Ej: García Salazar', required: true, section: 'personal' },
  { key: 'celular', label: 'Celular (WhatsApp)', type: 'tel', placeholder: 'Ej: 3001234567 (sin código de país)', required: true, section: 'contacto' },
  { key: 'correo_electronico', label: 'Correo electrónico', type: 'email', placeholder: 'Ej: correo@ejemplo.com', required: true, section: 'contacto' },
  { key: 'instagram', label: 'Instagram (opcional)', type: 'text', placeholder: 'Ej: @tucuenta', required: false, section: 'contacto' },
  { key: 'lugar_de_nacimiento', label: 'Lugar de nacimiento', type: 'text', placeholder: 'Ej: Ciudad de México, Lima, Bogotá…', required: true, section: 'medica' },
  { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date', required: true, section: 'medica' },
  { key: 'tipo_sangre', label: 'Tipo de sangre', type: 'select', required: true, section: 'medica', options: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] },
  { key: 'eps', label: 'EPS / Seguro médico', type: 'text', placeholder: 'Ej: Sura, Nueva EPS, Sanitas...', required: true, section: 'medica' },
  { key: 'estatura', label: 'Estatura (cm)', type: 'number', placeholder: 'Ej: 175', required: false, section: 'medica' },
  { key: 'peso', label: 'Peso (kg)', type: 'number', placeholder: 'Ej: 72', required: false, section: 'medica' },
  { key: 'direccion', label: 'Dirección', type: 'text', placeholder: 'Ej: Cra 45 #67-89', required: false, section: 'residencia' },
  { key: 'municipio', label: 'Municipio / Ciudad', type: 'text', placeholder: 'Ej: Buenos Aires, Santiago, Lima…', required: true, section: 'residencia' },
  { key: 'barrio', label: 'Barrio', type: 'text', placeholder: 'Ej: Laureles', required: false, section: 'residencia' },
  { key: 'familiar_emergencia', label: 'Contacto de emergencia', type: 'text', placeholder: 'Nombre de un familiar o acudiente', required: true, section: 'emergencia' },
  { key: 'celular_contacto', label: 'Celular del contacto de emergencia', type: 'tel', placeholder: 'Número diferente al tuyo', required: true, section: 'emergencia' },
];

const SECCIONES = [
  { id: 'personal',   label: 'Datos personales',    color: '#60A5FA' },
  { id: 'contacto',   label: 'Contacto',            color: '#34D399' },
  { id: 'medica',     label: 'Datos adicionales',   color: '#FBBF24' },
  { id: 'residencia', label: 'Lugar de residencia', color: '#C084FC' },
  { id: 'emergencia', label: 'Emergencia',          color: '#F87171' },
];

export default function FormInscripcion() {
  const [searchParams] = useSearchParams();
  const clubId = searchParams.get('club_id') || 'city-fc';

  const [clubConfig, setClubConfig] = useState(null);
  const [form, setForm]             = useState({});
  const [status, setStatus]         = useState('idle');
  const [errorMsg, setErrorMsg]     = useState('');
  const [honeypot, setHoneypot]     = useState('');

  const c        = clubConfig?.color  || '#00AAFF';
  const clubName = clubConfig?.nombre || clubId;
  const ciudad   = clubConfig?.ciudad || '';

  useEffect(() => {
    supabase
      .from('clubs')
      .select('config')
      .eq('slug', clubId)
      .single()
      .then(({ data }) => { if (data?.config) setClubConfig(data.config); });
  }, [clubId]);

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    if (honeypot) { setTimeout(() => setStatus('success'), 1500); return; }

    const faltantes = CAMPOS.filter(f => f.required && !form[f.key]?.toString().trim());
    if (faltantes.length > 0) {
      setStatus('error');
      setErrorMsg(`Faltan campos obligatorios: ${faltantes.map(f => f.label).join(', ')}`);
      return;
    }
    if (!/^\d{7,15}$/.test(form.cedula.trim())) {
      setStatus('error');
      setErrorMsg('El número de documento debe tener entre 7 y 15 dígitos.');
      return;
    }
    if (!/^\d{6,15}$/.test(form.celular.trim())) {
      setStatus('error');
      setErrorMsg('El celular debe tener entre 6 y 15 dígitos (sin código de país).');
      return;
    }
    if (form.celular_contacto && !/^\d{6,15}$/.test(form.celular_contacto.trim())) {
      setStatus('error');
      setErrorMsg('El celular del contacto debe tener entre 6 y 15 dígitos.');
      return;
    }
    if (form.celular_contacto && form.celular && form.celular_contacto.trim() === form.celular.trim()) {
      setStatus('error');
      setErrorMsg('El celular de emergencia debe ser diferente al tuyo.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/inscripcion?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          activo: 'SI',
          tipo_descuento: 'NA',
          fecha_inscripcion: new Date().toISOString().split('T')[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
      } else if (res.status === 409) {
        setStatus('error');
        setErrorMsg('Ya existe un jugador inscrito con ese número de documento.');
      } else {
        setStatus('error');
        setErrorMsg(data.message || data.error || 'Error al registrar. Intenta de nuevo.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Error al registrar. Intenta de nuevo.');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: '#060C18', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: '#0A1020', borderRadius: 24, border: `1px solid ${c}30`, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: `0 0 60px ${c}12` }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${c}15`, border: `1px solid ${c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: `0 0 28px ${c}30` }}>
            <CheckCircle size={36} color={c} />
          </div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>¡Inscripción exitosa!</h2>
          <p style={{ color: '#9CA3AF', marginBottom: 4, fontSize: 14 }}>
            Bienvenido a <span style={{ color: c, fontWeight: 700 }}>{clubName}</span>
            {ciudad ? <span style={{ color: '#6B7280' }}> · {ciudad}</span> : null}
          </p>
          <div style={{ background: `${c}0E`, border: `1px solid ${c}25`, borderRadius: 14, padding: '16px 18px', marginTop: 22, textAlign: 'left' }}>
            <p style={{ color: c, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>¿Qué sigue?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['✅', 'Tu registro ha sido procesado correctamente'],
                ['📱', 'Recibirás un mensaje de bienvenida por WhatsApp'],
                ['🏅', '¡Ya eres parte del club!'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                  <span style={{ color: '#D1D5DB', fontSize: 13 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ color: '#4B5563', fontSize: 12, marginTop: 20 }}>
            Te contactaremos por WhatsApp con los detalles del primer pago
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060C18', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px 40px', fontFamily: "'Inter', system-ui, sans-serif" }}>

      <style>{`
        .insc-input {
          width: 100%; box-sizing: border-box;
          padding: 11px 14px; font-size: 14px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 10px; color: #F5F5F5; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .insc-input::placeholder { color: #4B5563; }
        .insc-input:focus {
          border-color: ${c};
          box-shadow: 0 0 0 3px ${c}20;
        }
        .insc-input option { background: #0A1020; color: #F5F5F5; }
      `}</style>

      <div style={{ background: '#0A1020', borderRadius: 24, border: `1px solid ${c}25`, padding: '32px 28px', maxWidth: 520, width: '100%', boxShadow: `0 8px 60px ${c}10, 0 0 0 1px ${c}08` }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: `${c}15`, border: `1px solid ${c}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 26,
            boxShadow: `0 0 24px ${c}20`,
          }}>
            🏅
          </div>
          <h1 style={{ color: '#F5F5F5', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
            Únete a <span style={{ color: c }}>{clubName}</span>
          </h1>
          {ciudad && <p style={{ color: '#6B7280', fontSize: 12, marginBottom: 2 }}>{ciudad}</p>}
          <p style={{ color: '#6B7280', fontSize: 13 }}>Completa tus datos para inscribirte</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Honeypot */}
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
            <input type="text" value={honeypot} onChange={e => setHoneypot(e.target.value)} autoComplete="off" tabIndex={-1} />
          </div>

          {SECCIONES.map(seccion => (
            <div key={seccion.id} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 12, paddingTop: 16 }}>
                <span style={{ width: 4, height: 14, borderRadius: 2, background: seccion.color, flexShrink: 0 }} />
                <p style={{ color: seccion.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, margin: 0 }}>
                  {seccion.label}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {CAMPOS.filter(f => f.section === seccion.id).map(campo => (
                  <FormField key={campo.key} campo={campo} form={form} onChange={handleChange} />
                ))}
              </div>
            </div>
          ))}

          {status === 'error' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '11px 14px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#F87171', marginTop: 16 }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              width: '100%', marginTop: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px', borderRadius: 12, border: 'none',
              background: status === 'loading' ? 'rgba(255,255,255,0.07)' : c,
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              boxShadow: status === 'loading' ? 'none' : `0 4px 24px ${c}44`,
              transition: 'all 0.3s',
            }}
          >
            {status === 'loading'
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Registrando...</>
              : <><UserPlus size={16} /> Inscribirme</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 18 }}>
          Al inscribirte aceptas ser parte oficial del club 🏅
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function FormField({ campo, form, onChange }) {
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#D1D5DB', marginBottom: 5 };

  if (campo.type === 'select') {
    return (
      <div>
        <label style={labelStyle}>{campo.label}{campo.required && <span style={{ color: '#F87171', marginLeft: 3 }}>*</span>}</label>
        <select
          value={form[campo.key] || ''}
          onChange={e => onChange(campo.key, e.target.value)}
          required={campo.required}
          className="insc-input"
        >
          <option value="">Seleccionar…</option>
          {campo.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label style={labelStyle}>{campo.label}{campo.required && <span style={{ color: '#F87171', marginLeft: 3 }}>*</span>}</label>
      <input
        type={campo.type}
        placeholder={campo.placeholder}
        value={form[campo.key] || ''}
        onChange={e => onChange(campo.key, e.target.value)}
        required={campo.required}
        className="insc-input"
      />
    </div>
  );
}
