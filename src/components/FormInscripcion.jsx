import { useState } from 'react';
import { UserPlus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const CAMPOS = [
  { key: 'tipo_id', label: 'Tipo de documento', type: 'select', required: true, section: 'personal', options: ['Cédula de Ciudadanía', 'Tarjeta de Identidad', 'Cédula de Extranjería', 'Pasaporte', 'NIT'] },
  { key: 'cedula', label: 'Número de documento', type: 'text', placeholder: 'Ej: 1234567890', required: true, section: 'personal' },
  { key: 'nombre', label: 'Nombre(s)', type: 'text', placeholder: 'Ej: Santiago', required: true, section: 'personal' },
  { key: 'apellidos', label: 'Apellido(s)', type: 'text', placeholder: 'Ej: García Salazar', required: true, section: 'personal' },
  { key: 'celular', label: 'Celular (WhatsApp)', type: 'tel', placeholder: 'Ej: 3001234567', required: true, section: 'contacto' },
  { key: 'correo_electronico', label: 'Correo electrónico', type: 'email', placeholder: 'Ej: correo@ejemplo.com', required: true, section: 'contacto' },
  { key: 'instagram', label: 'Instagram (opcional)', type: 'text', placeholder: 'Ej: @tucuenta', required: false, section: 'contacto' },
  { key: 'lugar_de_nacimiento', label: 'Lugar de nacimiento', type: 'text', placeholder: 'Ej: Bogotá', required: true, section: 'medica' },
  { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date', required: true, section: 'medica' },
  { key: 'tipo_sangre', label: 'Tipo de sangre', type: 'select', required: true, section: 'medica', options: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] },
  { key: 'eps', label: 'EPS', type: 'text', placeholder: 'Ej: Sura, Nueva EPS, Sanitas...', required: true, section: 'medica' },
  { key: 'estatura', label: 'Estatura (cm)', type: 'number', placeholder: 'Ej: 175', required: false, section: 'medica' },
  { key: 'peso', label: 'Peso (kg)', type: 'number', placeholder: 'Ej: 72', required: false, section: 'medica' },
  { key: 'direccion', label: 'Dirección', type: 'text', placeholder: 'Ej: Cra 45 #67-89', required: false, section: 'residencia' },
  { key: 'municipio', label: 'Municipio', type: 'text', placeholder: 'Ej: Medellín', required: true, section: 'residencia' },
  { key: 'barrio', label: 'Barrio', type: 'text', placeholder: 'Ej: Laureles', required: false, section: 'residencia' },
  { key: 'familiar_emergencia', label: 'Contacto en caso de emergencia (familiar)', type: 'text', placeholder: 'Nombre de un familiar o acudiente', required: true, section: 'emergencia' },
  { key: 'celular_contacto', label: 'Celular del contacto de emergencia', type: 'tel', placeholder: 'Número diferente al tuyo', required: true, section: 'emergencia' },
];

const SECCIONES = [
  { id: 'personal', label: 'Datos personales', color: '#00D084' },
  { id: 'contacto', label: 'Contacto', color: '#4A9EFF' },
  { id: 'medica', label: 'Datos adicionales', color: '#F5A623' },
  { id: 'residencia', label: 'Lugar de residencia', color: '#C678FF' },
  { id: 'emergencia', label: 'Emergencia', color: '#FF5E5E' },
];

export default function FormInscripcion() {
  const [form, setForm] = useState({});
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    if (honeypot) {
      setTimeout(() => setStatus('success'), 1500);
      return;
    }

    // Validar campos obligatorios
    const faltantes = CAMPOS.filter(c => c.required && !form[c.key]?.toString().trim());
    if (faltantes.length > 0) {
      setStatus('error');
      setErrorMsg(`Faltan campos obligatorios: ${faltantes.map(c => c.label).join(', ')}`);
      return;
    }

    if (!/^\d{7,15}$/.test(form.cedula.trim())) {
      setStatus('error');
      setErrorMsg('El número de documento debe tener entre 7 y 15 dígitos.');
      return;
    }

    if (!/^\d{10}$/.test(form.celular.trim())) {
      setStatus('error');
      setErrorMsg('El celular debe tener 10 dígitos (ej: 3001234567).');
      return;
    }

    if (form.celular_contacto && !/^\d{10}$/.test(form.celular_contacto.trim())) {
      setStatus('error');
      setErrorMsg('El celular del contacto debe tener 10 dígitos.');
      return;
    }

    if (form.celular_contacto && form.celular && form.celular_contacto.trim() === form.celular.trim()) {
      setStatus('error');
      setErrorMsg('El celular de emergencia debe ser diferente al tuyo.');
      return;
    }

    try {
      // ✅ Llama directamente a la API en lugar de Apps Script
      const res = await fetch(`${API_BASE_URL}/inscripcion`, {
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
        setErrorMsg(data.error || data.message || 'Error al registrar. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error completo:', err);
      setStatus('error');
      setErrorMsg('Error al registrar. Intenta de nuevo.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#060C18] flex items-center justify-center p-4">
        <div className="bg-[#161B22] rounded-3xl border border-[#30363D] p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[rgba(0,208,132,0.12)] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#00D084]" />
          </div>
          <h2 className="text-2xl font-bold text-[#E6EDF3] mb-3">¡Inscripción exitosa! ⚽</h2>
          <p className="text-[#8B949E] mb-2">
            Bienvenido a <span className="font-semibold text-[#00D084]">City FC</span>
          </p>
          <div className="bg-[rgba(0,208,132,0.08)] rounded-2xl p-4 mt-6 text-left border border-[#00D084]/20">
            <p className="text-sm text-[#00D084] font-medium mb-2">🎯 ¿Qué sigue?</p>
            <ul className="text-sm text-[#E6EDF3] space-y-1">
              <li>✅ Tu registro ha sido procesado correctamente</li>
              <li>📱 Recibirás un mensaje de bienvenida por WhatsApp</li>
              <li>⚽ ¡Ya eres parte del equipo!</li>
            </ul>
          </div>
          <p className="text-xs text-[#8B949E] mt-6">Te contactaremos por WhatsApp con los detalles de tu primer pago</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060C18] flex items-center justify-center p-4 py-8">
      <div className="bg-[#161B22] rounded-3xl border border-[#30363D] p-8 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D084] to-[#00D084]/60 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-[#E6EDF3]">Únete a City FC</h1>
          <p className="text-[#8B949E] mt-2">Llena tus datos para inscribirte al club</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot */}
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true" tabIndex={-1}>
            <input type="text" value={honeypot} onChange={e => setHoneypot(e.target.value)} autoComplete="off" />
          </div>

          {SECCIONES.map(seccion => (
            <div key={seccion.id}>
              <div className="border-b border-[#30363D] pb-2 mb-2 pt-4 first:pt-0">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: seccion.color }}>
                  {seccion.label}
                </p>
              </div>
              {CAMPOS.filter(c => c.section === seccion.id).map(campo => (
                <FormField key={campo.key} campo={campo} form={form} onChange={handleChange} />
              ))}
            </div>
          ))}

          {status === 'error' && (
            <div className="flex items-start gap-2 p-3 bg-[rgba(255,94,94,0.12)] rounded-xl text-sm text-[#FF5E5E] border border-[#FF5E5E]/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          <button type="submit" disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00D084] text-[#060C18] rounded-xl font-medium text-sm hover:bg-[#00D084]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6">
            {status === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Registrando...</>
            ) : (
              <><UserPlus className="w-4 h-4" />Inscribirme</>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[#8B949E] mt-6">
          Al inscribirte serás parte oficial del club ⚽
        </p>
      </div>
    </div>
  );
}

function FormField({ campo, form, onChange }) {
  if (campo.type === 'select') {
    return (
      <div className="mt-3">
        <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
          {campo.label} {campo.required && <span className="text-[#FF5E5E]">*</span>}
        </label>
        <select value={form[campo.key] || ''} onChange={e => onChange(campo.key, e.target.value)} required={campo.required}
          className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084] transition-colors">
          <option value="">Seleccionar...</option>
          {campo.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
        {campo.label} {campo.required && <span className="text-[#FF5E5E]">*</span>}
      </label>
      <input type={campo.type} placeholder={campo.placeholder} value={form[campo.key] || ''}
        onChange={e => onChange(campo.key, e.target.value)} required={campo.required}
        className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084] transition-colors" />
    </div>
  );
}
