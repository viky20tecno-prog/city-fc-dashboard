import { useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ClipboardList, CheckCircle, AlertCircle, Loader2,
  Upload, User, CreditCard, Phone, Mail, Instagram,
  MapPin, Calendar, Droplets, Building2, Home, UserPlus,
  ChevronDown, X,
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useClubConfigPublic } from '../hooks/useClubConfigPublic';

const CAMPOS = [
  { key: 'tipo_id',           label: 'Tipo de documento',             type: 'select',  required: true,  section: 'personal',   icon: CreditCard,   options: ['Cédula de Ciudadanía', 'Tarjeta de Identidad', 'Cédula de Extranjería', 'Pasaporte', 'NIT'] },
  { key: 'cedula',            label: 'Número de documento',           type: 'text',    required: true,  section: 'personal',   icon: CreditCard,   placeholder: 'Ej: 123456789' },
  { key: 'nombre',            label: 'Nombre(s)',                     type: 'text',    required: true,  section: 'personal',   icon: User,         placeholder: 'Ej: Santiago' },
  { key: 'apellidos',         label: 'Apellido(s)',                   type: 'text',    required: true,  section: 'personal',   icon: User,         placeholder: 'Ej: García Salazar' },
  { key: 'celular',           label: 'Celular (WhatsApp)',            type: 'tel',     required: true,  section: 'contacto',   icon: Phone,        placeholder: '3001234567 (sin código de país)' },
  { key: 'correo_electronico',label: 'Correo electrónico',           type: 'email',   required: true,  section: 'contacto',   icon: Mail,         placeholder: 'correo@ejemplo.com' },
  { key: 'instagram',         label: 'Instagram (opcional)',          type: 'text',    required: false, section: 'contacto',   icon: Instagram,    placeholder: '@tucuenta' },
  { key: 'lugar_de_nacimiento',label:'Lugar de nacimiento',          type: 'text',    required: true,  section: 'adicional',  icon: MapPin,       placeholder: 'Ciudad de México, Lima, Bogotá…' },
  { key: 'fecha_nacimiento',  label: 'Fecha de nacimiento',          type: 'date',    required: true,  section: 'adicional',  icon: Calendar },
  { key: 'tipo_sangre',       label: 'Tipo de sangre',               type: 'select',  required: true,  section: 'adicional',  icon: Droplets,     options: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] },
  { key: 'eps',               label: 'EPS / Seguro médico',          type: 'text',    required: true,  section: 'adicional',  icon: Building2,    placeholder: 'Ej: Sura, Nueva EPS, Sanitas…' },
  { key: 'estatura',          label: 'Estatura (cm)',                type: 'number',  required: false, section: 'adicional',  icon: User,         placeholder: 'Ej: 175' },
  { key: 'peso',              label: 'Peso (kg)',                    type: 'number',  required: false, section: 'adicional',  icon: User,         placeholder: 'Ej: 72' },
  { key: 'municipio',         label: 'Municipio / Ciudad',           type: 'text',    required: true,  section: 'residencia', icon: MapPin,       placeholder: 'Buenos Aires, Santiago, Lima…' },
  { key: 'direccion',         label: 'Dirección',                    type: 'text',    required: false, section: 'residencia', icon: Home,         placeholder: 'Cra 45 #67-89' },
  { key: 'barrio',            label: 'Barrio',                       type: 'text',    required: false, section: 'residencia', icon: Home,         placeholder: 'Ej: Laureles' },
  { key: 'familiar_emergencia',label:'Contacto de emergencia',       type: 'text',    required: true,  section: 'emergencia', icon: User,         placeholder: 'Nombre de un familiar' },
  { key: 'celular_contacto',  label: 'Celular del contacto',         type: 'tel',     required: true,  section: 'emergencia', icon: Phone,        placeholder: 'Número diferente al tuyo' },
];

const SECCIONES = [
  { id: 'personal',   label: 'Datos personales'    },
  { id: 'contacto',   label: 'Contacto'            },
  { id: 'adicional',  label: 'Datos adicionales'   },
  { id: 'residencia', label: 'Lugar de residencia' },
  { id: 'emergencia', label: 'Emergencia'          },
];

const GRID_2 = {
  personal:   [['tipo_id','cedula'],['nombre','apellidos']],
  contacto:   [['celular','correo_electronico'],['instagram']],
  adicional:  [['lugar_de_nacimiento','fecha_nacimiento'],['tipo_sangre','eps'],['estatura','peso']],
  residencia: [['municipio','direccion'],['barrio']],
  emergencia: [['familiar_emergencia','celular_contacto']],
};

export default function FormInscripcion() {
  const [searchParams] = useSearchParams();
  const clubId = searchParams.get('club_id') || 'city-fc';

  const { config: clubConfig } = useClubConfigPublic(clubId);
  const [form, setForm]     = useState({});
  const [status, setStatus] = useState('idle');
  const [errorMsg, setError] = useState('');
  const [honeypot, setHoney] = useState('');
  const [photoFile, setPhotoFile]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoDragging, setPhotoDragging] = useState(false);
  const photoInputRef = useRef(null);

  const c        = clubConfig?.color  || '#E88C2A';
  const clubName = clubConfig?.nombre || clubId;

  const totalRequired = CAMPOS.filter(f => f.required).length;
  const filled = CAMPOS.filter(f => f.required && form[f.key]?.toString().trim()).length;
  const progress = Math.round((filled / totalRequired) * 100);

  const handleChange = (key, value) => setForm(p => ({ ...p, [key]: value }));

  const handlePhotoSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { setError('La foto debe pesar máximo 5 MB.'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setPhotoDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePhotoSelect(file);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    if (honeypot) { setTimeout(() => setStatus('success'), 1500); return; }

    const faltantes = CAMPOS.filter(f => f.required && !form[f.key]?.toString().trim());
    if (faltantes.length > 0) {
      setStatus('error');
      setError(`Faltan campos: ${faltantes.map(f => f.label).join(', ')}`);
      return;
    }
    if (!/^\d{7,15}$/.test(form.cedula.trim())) {
      setStatus('error'); setError('El documento debe tener entre 7 y 15 dígitos.'); return;
    }
    if (!/^\d{6,15}$/.test(form.celular.trim())) {
      setStatus('error'); setError('El celular debe tener entre 6 y 15 dígitos.'); return;
    }
    if (form.celular_contacto && form.celular_contacto.trim() === form.celular.trim()) {
      setStatus('error'); setError('El celular de emergencia debe ser diferente al tuyo.'); return;
    }

    let foto_url = null;
    if (photoFile) {
      try {
        const ext  = photoFile.name.split('.').pop();
        const path = `${clubId}/${form.cedula.trim()}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('jugadores-fotos')
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('jugadores-fotos').getPublicUrl(path);
          foto_url = urlData?.publicUrl || null;
        }
      } catch (_) { /* foto no crítica — seguimos sin ella */ }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/inscripcion?club_id=${clubId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...(foto_url ? { foto_url } : {}),
          activo:            'SI',
          tipo_descuento:    'NA',
          fecha_inscripcion: new Date().toISOString().split('T')[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
      } else if (res.status === 409) {
        setStatus('error'); setError('Ya existe un jugador con ese número de documento.');
      } else {
        setStatus('error'); setError(data.message || data.error || 'Error al registrar.');
      }
    } catch {
      setStatus('error'); setError('Error de conexión. Intenta de nuevo.');
    }
  };

  /* ── ÉXITO ─────────────────────────────────────────────────────────── */
  if (status === 'success') {
    return (
      <div style={S.page}>
        <div style={{ ...S.successCard, borderColor: `${c}35` }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${c}18`, border: `1px solid ${c}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: `0 0 32px ${c}30` }}>
            <CheckCircle size={36} color={c} />
          </div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>¡Inscripción exitosa!</h2>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 22 }}>
            Bienvenido a <span style={{ color: c, fontWeight: 700 }}>{clubName}</span>
          </p>
          <div style={{ background: `${c}0E`, border: `1px solid ${c}25`, borderRadius: 14, padding: '16px 18px', textAlign: 'left' }}>
            {[['✅','Tu registro fue procesado correctamente'],['📱','Recibirás un mensaje de bienvenida por WhatsApp'],['🏅','¡Ya eres parte del club!']].map(([ico, txt]) => (
              <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{ico}</span>
                <span style={{ color: '#D1D5DB', fontSize: 13 }}>{txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── FORMULARIO ────────────────────────────────────────────────────── */
  return (
    <div style={S.page}>
      <style>{`
        .fi { width:100%; box-sizing:border-box; padding:10px 12px 10px 36px;
              font-size:14px; background:rgba(255,255,255,0.05);
              border:1.5px solid rgba(255,255,255,0.10); border-radius:10px;
              color:#F0F0F0; outline:none; font-family:inherit;
              transition:border-color .2s,box-shadow .2s; }
        .fi::placeholder { color:#3D4966; }
        .fi:focus { border-color:${c}; box-shadow:0 0 0 3px ${c}22; }
        .fi option { background:#0D1627; color:#F0F0F0; }
        .fi-bare { padding-left:12px; }
        .fi-sel { appearance:none; -webkit-appearance:none; cursor:pointer; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      `}</style>

      <div style={{ ...S.shell, '--c': c }}>

        {/* ── HEADER ── */}
        <div style={S.header}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: `0 8px 24px ${c}55` }}>
            <ClipboardList size={26} color="#fff" strokeWidth={1.8} />
          </div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>
            Únete a <span style={{ color: c }}>{clubName}</span>
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Completa tus datos para inscribirte</p>

          {/* Barra de progreso */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4B5563', marginBottom: 6, letterSpacing: '0.5px' }}>
              <span>Progreso del formulario</span>
              <span style={{ color: progress > 0 ? c : '#4B5563', fontWeight: 600 }}>{progress}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${c}BB, ${c})`, borderRadius: 99, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        {/* ── CUERPO DOS COLUMNAS ── */}
        <div style={S.body}>

          {/* ── COLUMNA FOTO ── */}
          <div style={S.photoCol}>
            <p style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
              Fotografía
            </p>

            {/* Zona de drop */}
            <div
              onClick={() => photoInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setPhotoDragging(true); }}
              onDragLeave={() => setPhotoDragging(false)}
              onDrop={handleDrop}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: 14,
                border: `2px dashed ${photoDragging ? c : 'rgba(255,255,255,0.18)'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', position: 'relative',
                background: photoDragging ? `${c}0A` : 'rgba(255,255,255,0.03)',
                transition: 'border-color .2s, background .2s',
              }}
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(null); }}
                    style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
                  >
                    <X size={13} color="#fff" />
                  </button>
                </>
              ) : (
                <>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <Upload size={20} color="#6B7280" />
                  </div>
                  <span style={{ color: '#9CA3AF', fontSize: 13, fontWeight: 500 }}>Subir foto</span>
                  <span style={{ color: '#4B5563', fontSize: 11, marginTop: 4 }}>o arrastra aquí</span>
                </>
              )}
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => handlePhotoSelect(e.target.files[0])}
            />

            <p style={{ color: '#374151', fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              Formatos: JPG, PNG. Máx 5MB
            </p>
          </div>

          {/* ── COLUMNA FORMULARIO ── */}
          <form onSubmit={handleSubmit} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Honeypot */}
            <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
              <input type="text" value={honeypot} onChange={e => setHoney(e.target.value)} tabIndex={-1} autoComplete="off" />
            </div>

            {SECCIONES.map(sec => {
              const campos = CAMPOS.filter(f => f.section === sec.id);
              const rows   = GRID_2[sec.id] || campos.map(f => [f.key]);
              return (
                <div key={sec.id} style={S.card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 3, height: 16, background: c, borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ color: '#D1D5DB', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                      {sec.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rows.map((row, ri) => (
                      <div key={ri} style={{ display: 'grid', gridTemplateColumns: row.length === 2 ? '1fr 1fr' : '1fr', gap: 10 }}>
                        {row.map(key => {
                          const campo = campos.find(f => f.key === key);
                          if (!campo) return null;
                          return <FieldBox key={key} campo={campo} form={form} onChange={handleChange} c={c} />;
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {status === 'error' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '11px 14px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#F87171', animation: 'fadein .3s ease' }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                width: '100%', marginTop: 4,
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

            <p style={{ textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 2 }}>
              Al inscribirte aceptas ser parte oficial del club 🏅
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Field con ícono ─────────────────────────────────────────────────── */
function FieldBox({ campo, form, onChange, c }) {
  const Icon = campo.icon;
  const isSelect = campo.type === 'select';

  const labelEl = (
    <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 5, fontWeight: 500 }}>
      {campo.label}
      {campo.required && <span style={{ color: '#F87171', marginLeft: 3 }}>*</span>}
    </label>
  );

  const wrapStyle = { position: 'relative' };
  const iconEl = Icon ? (
    <Icon
      size={14}
      color="#4B5563"
      style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
    />
  ) : null;

  if (isSelect) {
    return (
      <div>
        {labelEl}
        <div style={wrapStyle}>
          {iconEl}
          <select
            value={form[campo.key] || ''}
            onChange={e => onChange(campo.key, e.target.value)}
            required={campo.required}
            className="fi fi-sel"
          >
            <option value="">Seleccionar…</option>
            {campo.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={13} color="#4B5563" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {labelEl}
      <div style={wrapStyle}>
        {iconEl}
        <input
          type={campo.type}
          placeholder={campo.placeholder}
          value={form[campo.key] || ''}
          onChange={e => onChange(campo.key, e.target.value)}
          required={campo.required}
          className={`fi${campo.type === 'date' ? ' fi-bare' : ''}`}
          style={campo.type === 'date' ? { paddingLeft: 36, colorScheme: 'dark' } : {}}
        />
      </div>
    </div>
  );
}

/* ── Estilos fijos ────────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#060E1D',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '32px 16px 48px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  shell: {
    width: '100%',
    maxWidth: 900,
    animation: 'fadein .4s ease',
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
  },
  body: {
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start',
  },
  photoCol: {
    width: 200,
    flexShrink: 0,
  },
  card: {
    background: '#0C1524',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: '16px 18px',
  },
  successCard: {
    background: '#0A1020',
    borderRadius: 24,
    border: '1px solid transparent',
    padding: '40px 32px',
    maxWidth: 420,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 8px 60px rgba(0,0,0,0.5)',
    margin: '80px auto 0',
  },
};
