import { useState } from 'react';
import { UserPlus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { APPS_SCRIPT_URL } from '../config';

const CAMPOS = [
  { key: 'tipo_id', label: 'Tipo de documento', type: 'select', required: true, options: ['Cédula de Ciudadanía', 'Tarjeta de Identidad', 'Cédula de Extranjería', 'Pasaporte'] },
  { key: 'cedula', label: 'Número de documento', type: 'text', placeholder: 'Ej: 1234567890', required: true },
  { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Santiago', required: true },
  { key: 'apellidos', label: 'Apellidos', type: 'text', placeholder: 'Ej: García Salazar', required: true },
  { key: 'celular', label: 'Celular (WhatsApp)', type: 'tel', placeholder: 'Ej: 3001234567', required: true },
  { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date', required: true },
  { key: 'municipio', label: 'Municipio', type: 'text', placeholder: 'Ej: Medellín', required: true },
  { key: 'tipo_sangre', label: 'Tipo de sangre', type: 'select', required: true, options: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] },
  { key: 'eps', label: 'EPS', type: 'text', placeholder: 'Ej: Sura, Nueva EPS, Sanitas...', required: true },
  { key: 'estatura', label: 'Estatura (cm)', type: 'number', placeholder: 'Ej: 175', required: false },
  { key: 'peso', label: 'Peso (kg)', type: 'number', placeholder: 'Ej: 72', required: false },
  { key: 'direccion', label: 'Dirección', type: 'text', placeholder: 'Ej: Cra 45 #67-89', required: false },
  { key: 'barrio', label: 'Barrio', type: 'text', placeholder: 'Ej: Laureles', required: false },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'Ej: correo@ejemplo.com', required: false },
  { key: 'familiar_emergencia', label: 'Familiar de emergencia', type: 'text', placeholder: 'Nombre completo del familiar', required: true },
  { key: 'celular_familiar', label: 'Celular del familiar', type: 'tel', placeholder: 'Ej: 3009876543', required: true },
  { key: 'instagram', label: 'Instagram (opcional)', type: 'text', placeholder: 'Ej: @tucuenta', required: false },
];

export default function FormInscripcion() {
  const [form, setForm] = useState({});
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    // Validar campos obligatorios
    const faltantes = CAMPOS.filter(c => c.required && !form[c.key]?.toString().trim());
    if (faltantes.length > 0) {
      setStatus('error');
      setErrorMsg(`Faltan campos obligatorios: ${faltantes.map(c => c.label).join(', ')}`);
      return;
    }

    if (!/^\d{7,10}$/.test(form.cedula.trim())) {
      setStatus('error');
      setErrorMsg('El número de documento debe tener entre 7 y 10 dígitos.');
      return;
    }

    if (!/^\d{10}$/.test(form.celular.trim())) {
      setStatus('error');
      setErrorMsg('El celular debe tener 10 dígitos (ej: 3001234567).');
      return;
    }

    if (form.celular_familiar && !/^\d{10}$/.test(form.celular_familiar.trim())) {
      setStatus('error');
      setErrorMsg('El celular del familiar debe tener 10 dígitos.');
      return;
    }

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'inscribir',
          ...form,
          estado: 'PRUEBA',
          fecha_inscripcion: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Error al registrar. Intenta de nuevo.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Error de conexión. Verifica tu internet e intenta de nuevo.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
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
              <li>✅ Tienes <strong>2 entrenamientos de cortesía</strong></li>
              <li>⚽ Asiste a los entrenos y conoce al equipo</li>
              <li>💪 Si decides quedarte, el presidente te activará y arranca tu mensualidad</li>
            </ul>
          </div>
          <p className="text-xs text-[#8B949E] mt-6">Te contactaremos por WhatsApp con los detalles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4 py-8">
      <div className="bg-[#161B22] rounded-3xl border border-[#30363D] p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D084] to-[#00D084]/60 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-[#E6EDF3]">Únete a City FC</h1>
          <p className="text-[#8B949E] mt-2">Llena tus datos para inscribirte al club</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sección: Datos personales */}
          <div className="border-b border-[#30363D] pb-2 mb-2">
            <p className="text-xs font-semibold text-[#00D084] uppercase tracking-wider">Datos personales</p>
          </div>

          {CAMPOS.slice(0, 4).map(campo => (
            <FormField key={campo.key} campo={campo} form={form} onChange={handleChange} />
          ))}

          {/* Sección: Contacto */}
          <div className="border-b border-[#30363D] pb-2 mb-2 pt-4">
            <p className="text-xs font-semibold text-[#4A9EFF] uppercase tracking-wider">Contacto</p>
          </div>

          {CAMPOS.slice(4, 5).map(campo => (
            <FormField key={campo.key} campo={campo} form={form} onChange={handleChange} />
          ))}

          {/* Sección: Información médica */}
          <div className="border-b border-[#30363D] pb-2 mb-2 pt-4">
            <p className="text-xs font-semibold text-[#F5A623] uppercase tracking-wider">Información médica y personal</p>
          </div>

          {CAMPOS.slice(5, 11).map(campo => (
            <FormField key={campo.key} campo={campo} form={form} onChange={handleChange} />
          ))}

          {/* Sección: Ubicación */}
          <div className="border-b border-[#30363D] pb-2 mb-2 pt-4">
            <p className="text-xs font-semibold text-[#C678FF] uppercase tracking-wider">Ubicación</p>
          </div>

          {CAMPOS.slice(11, 13).map(campo => (
            <FormField key={campo.key} campo={campo} form={form} onChange={handleChange} />
          ))}

          {/* Sección: Contacto adicional */}
          <div className="border-b border-[#30363D] pb-2 mb-2 pt-4">
            <p className="text-xs font-semibold text-[#FF5E5E] uppercase tracking-wider">Emergencia y redes</p>
          </div>

          {CAMPOS.slice(13).map(campo => (
            <FormField key={campo.key} campo={campo} form={form} onChange={handleChange} />
          ))}

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-2 p-3 bg-[rgba(255,94,94,0.12)] rounded-xl text-sm text-[#FF5E5E] border border-[#FF5E5E]/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00D084] text-[#0D1117] rounded-xl font-medium text-sm hover:bg-[#00D084]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Inscribirme
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-[#8B949E] mt-6">
          Al inscribirte recibes 2 entrenamientos de cortesía 🎉
        </p>
      </div>
    </div>
  );
}

function FormField({ campo, form, onChange }) {
  if (campo.type === 'select') {
    return (
      <div>
        <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
          {campo.label} {campo.required && <span className="text-[#FF5E5E]">*</span>}
        </label>
        <select
          value={form[campo.key] || ''}
          onChange={e => onChange(campo.key, e.target.value)}
          required={campo.required}
          className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084] transition-colors"
        >
          <option value="" className="text-[#8B949E]">Seleccionar...</option>
          {campo.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
        {campo.label} {campo.required && <span className="text-[#FF5E5E]">*</span>}
      </label>
      <input
        type={campo.type}
        placeholder={campo.placeholder}
        value={form[campo.key] || ''}
        onChange={e => onChange(campo.key, e.target.value)}
        required={campo.required}
        className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084] transition-colors"
      />
    </div>
  );
}
