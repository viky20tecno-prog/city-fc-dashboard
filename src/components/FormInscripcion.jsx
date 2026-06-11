import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
import {
  ClipboardList, CheckCircle, AlertCircle, Loader2,
  Upload, User, CreditCard, Phone, Mail, Instagram,
  MapPin, Calendar, Droplets, Building2, Home, UserPlus,
  ChevronDown, X, Info,
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useClubConfigPublic } from '../hooks/useClubConfigPublic';
import PoliticaPrivacidadModal from './PoliticaPrivacidadModal';
import { PAISES_NACIMIENTO } from '../lib/paises';
import { normalizarCategorias } from '../lib/categorias';

const PAISES_TEL = [
  { code: '57',  flag: '🇨🇴', label: '+57 Colombia' },
  { code: '1',   flag: '🇺🇸', label: '+1  EE.UU./CA' },
  { code: '52',  flag: '🇲🇽', label: '+52 México' },
  { code: '34',  flag: '🇪🇸', label: '+34 España' },
  { code: '54',  flag: '🇦🇷', label: '+54 Argentina' },
  { code: '56',  flag: '🇨🇱', label: '+56 Chile' },
  { code: '51',  flag: '🇵🇪', label: '+51 Perú' },
  { code: '593', flag: '🇪🇨', label: '+593 Ecuador' },
  { code: '58',  flag: '🇻🇪', label: '+58 Venezuela' },
  { code: '55',  flag: '🇧🇷', label: '+55 Brasil' },
  { code: '598', flag: '🇺🇾', label: '+598 Uruguay' },
  { code: '595', flag: '🇵🇾', label: '+595 Paraguay' },
  { code: '591', flag: '🇧🇴', label: '+591 Bolivia' },
  { code: '506', flag: '🇨🇷', label: '+506 Costa Rica' },
  { code: '507', flag: '🇵🇦', label: '+507 Panamá' },
];

function CountryCodePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = PAISES_TEL.find(p => p.code === value) || PAISES_TEL[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', width: 120, flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          background: 'var(--input-bg)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '9px 10px', color: 'var(--text-pri)', fontSize: 14,
        }}
      >
        <span style={{ fontSize: 18 }}>{selected.flag}</span>
        <span style={{ color: 'var(--text-sec)', fontSize: 13 }}>+{selected.code}</span>
        <ChevronDown size={11} color="var(--text-mut)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 99,
          width: 210, background: '#161b22', border: '1px solid var(--border)',
          borderRadius: 10, overflow: 'auto', maxHeight: 260,
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
        }}>
          {PAISES_TEL.map(p => (
            <button
              key={p.code}
              type="button"
              onClick={() => { onChange(p.code); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 12px', cursor: 'pointer', textAlign: 'left', border: 'none',
                background: p.code === value ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: 'var(--text-pri)',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{p.flag}</span>
              <span style={{ color: 'var(--text-sec)', fontSize: 12 }}>+{p.code}</span>
              <span style={{ fontSize: 12, color: 'var(--text-pri)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {p.label.split(' ').slice(1).join(' ')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const CAMPOS = [
  { key: 'tipo_id',           label: 'Tipo de documento',             type: 'select',  required: true,  section: 'personal',   icon: CreditCard,   options: ['Cédula de Ciudadanía', 'Tarjeta de Identidad', 'Cédula de Extranjería', 'Pasaporte', 'NIT'] },
  { key: 'cedula',            label: 'Número de documento',           type: 'text',    required: true,  section: 'personal',   icon: CreditCard,   placeholder: 'Ej: 123456789' },
  { key: 'nombre',            label: 'Nombre(s)',                     type: 'text',    required: true,  section: 'personal',   icon: User,         placeholder: 'Ej: Santiago' },
  { key: 'apellidos',         label: 'Apellido(s)',                   type: 'text',    required: true,  section: 'personal',   icon: User,         placeholder: 'Ej: García Salazar' },
  { key: 'celular',           label: 'Celular (WhatsApp)',            type: 'tel-intl', codigoPaisKey: 'codigo_pais_celular',   required: true,  section: 'contacto',   icon: Phone,        placeholder: '3001234567' },
  { key: 'correo_electronico',label: 'Correo electrónico',           type: 'email',   required: true,  section: 'contacto',   icon: Mail,         placeholder: 'correo@ejemplo.com' },
  { key: 'instagram',         label: 'Instagram (opcional)',          type: 'text',    required: false, section: 'contacto',   icon: Instagram,    placeholder: '@tucuenta' },
  { key: 'pais_nacimiento',    label: 'País de nacimiento',           type: 'pais',    required: false, section: 'adicional',  icon: MapPin },
  { key: 'lugar_de_nacimiento',label:'Ciudad de nacimiento',         type: 'text',    required: true,  section: 'adicional',  icon: MapPin,       placeholder: 'Ciudad de México, Lima, Bogotá…' },
  { key: 'fecha_nacimiento',  label: 'Fecha de nacimiento',          type: 'date',    required: true,  section: 'adicional',  icon: Calendar },
  { key: 'tipo_sangre',       label: 'Tipo de sangre',               type: 'select',  required: true,  section: 'adicional',  icon: Droplets,     options: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] },
  { key: 'eps',               label: 'EPS / Seguro médico',          type: 'text',    required: true,  section: 'adicional',  icon: Building2,    placeholder: 'Ej: Sura, Nueva EPS, Sanitas…' },
  { key: 'estatura',          label: 'Estatura (cm)',                type: 'number',  required: false, section: 'adicional',  icon: User,         placeholder: 'Ej: 175' },
  { key: 'peso',              label: 'Peso (kg)',                    type: 'number',  required: false, section: 'adicional',  icon: User,         placeholder: 'Ej: 72' },
  { key: 'municipio',         label: 'Municipio / Ciudad',           type: 'text',    required: true,  section: 'residencia', icon: MapPin,       placeholder: 'Buenos Aires, Santiago, Lima…' },
  { key: 'direccion',         label: 'Dirección',                    type: 'text',    required: false, section: 'residencia', icon: Home,         placeholder: 'Cra 45 #67-89' },
  { key: 'barrio',            label: 'Barrio',                       type: 'text',    required: false, section: 'residencia', icon: Home,         placeholder: 'Ej: Laureles' },
  { key: 'familiar_emergencia',label:'Contacto de emergencia',       type: 'text',    required: true,  section: 'emergencia', icon: User,         placeholder: 'Nombre de un familiar' },
  { key: 'celular_contacto',  label: 'Celular del contacto',         type: 'tel-intl', codigoPaisKey: 'codigo_pais_contacto', required: true,  section: 'emergencia', icon: Phone,        placeholder: 'Número diferente al tuyo' },
];

const SECCIONES = [
  { id: 'personal',   label: 'Datos personales'    },
  { id: 'contacto',   label: 'Contacto',           hint: 'Si el jugador es menor de edad, ingresa los datos del padre, madre o acudiente.' },
  { id: 'adicional',  label: 'Datos adicionales'   },
  { id: 'residencia', label: 'Lugar de residencia' },
  { id: 'emergencia', label: 'Emergencia'          },
];

const GRID_2 = {
  personal:   [['tipo_id','cedula'],['nombre','apellidos']],
  contacto:   [['celular','correo_electronico'],['instagram']],
  adicional:  [['pais_nacimiento','lugar_de_nacimiento'],['fecha_nacimiento','tipo_sangre'],['eps'],['estatura','peso']],
  residencia: [['municipio','direccion'],['barrio']],
  emergencia: [['familiar_emergencia','celular_contacto']],
};

export default function FormInscripcion() {
  const [searchParams] = useSearchParams();
  const clubId = searchParams.get('club_id') || null;

  const { config: clubConfig } = useClubConfigPublic(clubId);
  const [form, setForm]     = useState({});
  const [status, setStatus] = useState('idle');
  const [errorMsg, setError] = useState('');
  const [honeypot, setHoney] = useState('');
  const [photoFile, setPhotoFile]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoDragging, setPhotoDragging] = useState(false);
  const [savedForm, setSavedForm]     = useState(null);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [showPolitica, setShowPolitica]         = useState(false);
  const photoInputRef = useRef(null);

  if (!clubId) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '40px 32px', maxWidth: 400, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Enlace inválido</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Este formulario requiere un enlace válido con el código del club.<br />Contacta al administrador para obtener el enlace correcto.
          </p>
        </div>
      </div>
    );
  }

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
    if (!/^\d{6,12}$/.test((form.celular || '').replace(/\D/g, ''))) {
      setStatus('error'); setError('El celular debe tener entre 6 y 12 dígitos (sin código de país).'); return;
    }
    if (form.nombre && !/^[A-ZÁÉÍÓÚÑa-záéíóúñ\s'\-]{2,60}$/.test(form.nombre.trim())) {
      setStatus('error'); setError('El nombre solo puede contener letras (mínimo 2 caracteres).'); return;
    }
    if (form.apellidos && !/^[A-ZÁÉÍÓÚÑa-záéíóúñ\s'\-]{2,60}$/.test(form.apellidos.trim())) {
      setStatus('error'); setError('Los apellidos solo pueden contener letras (mínimo 2 caracteres).'); return;
    }
    if (form.eps && form.eps.trim().length < 2) {
      setStatus('error'); setError('El nombre de la EPS debe tener al menos 2 caracteres.'); return;
    }
    if (form.direccion && form.direccion.trim().length > 0 && form.direccion.trim().length < 5) {
      setStatus('error'); setError('La dirección debe tener al menos 5 caracteres.'); return;
    }
    const celularFull = `${form.codigo_pais_celular || '57'}${(form.celular || '').replace(/\D/g, '')}`;
    const contactoFull = form.celular_contacto
      ? `${form.codigo_pais_contacto || '57'}${form.celular_contacto.replace(/\D/g, '')}`
      : '';
    if (contactoFull && contactoFull === celularFull) {
      setStatus('error'); setError('El celular de emergencia debe ser diferente al tuyo.'); return;
    }
    if (!aceptaPrivacidad) {
      setStatus('error'); setError('Debes aceptar la Política de Tratamiento de Datos Personales.'); return;
    }

    let foto_url = null;
    if (photoFile) {
      try {
        const ext  = photoFile.name.split('.').pop();
        const path = `${clubId}/${form.cedula.trim()}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('player-photos')
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(path);
          foto_url = urlData?.publicUrl || null;
        }
      } catch (_) { /* foto no crítica — seguimos sin ella */ }
    }

    const up = v => typeof v === 'string' ? v.trim().toUpperCase() : v;

    try {
      const res = await fetch(`${API_BASE_URL}/inscripcion?club_id=${clubId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          nombre:              up(form.nombre),
          apellidos:           up(form.apellidos),
          lugar_de_nacimiento: up(form.lugar_de_nacimiento),
          eps:                 up(form.eps),
          municipio:           up(form.municipio),
          direccion:           up(form.direccion),
          barrio:              up(form.barrio),
          familiar_emergencia: up(form.familiar_emergencia),
          posicion:            up(form.posicion),
          correo_electronico:  form.correo_electronico?.trim().toLowerCase(),
          // Números completos con código de país
          celular:          `${form.codigo_pais_celular || '57'}${(form.celular || '').replace(/\D/g, '')}`,
          celular_contacto: form.celular_contacto
            ? `${form.codigo_pais_contacto || '57'}${form.celular_contacto.replace(/\D/g, '')}`
            : undefined,
          ...(foto_url ? { foto_url } : {}),
          ...(form.categoria ? { categoria: up(form.categoria) } : {}),
          ...(form.equipo    ? { equipo:    up(form.equipo)    } : {}),
          activo:            'SI',
          tipo_descuento:    'NA',
          fecha_inscripcion: new Date().toISOString().split('T')[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedForm({ ...form, foto_url, fotoPreview: photoPreview });
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

  /* ── PDF FICHA ─────────────────────────────────────────────────────── */
  const generarFichaPDF = () => {
    const f    = savedForm || {};
    const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    const fila  = (label, value) => value
      ? `<tr><td style="padding:6px 10px;font-size:12px;color:#6b7280;width:45%">${esc(label)}</td><td style="padding:6px 10px;font-size:12px;font-weight:600;color:#111">${esc(value)}</td></tr>`
      : '';

    const fotoHtml = f.fotoPreview
      ? `<img src="${f.fotoPreview}" alt="Foto" style="width:90px;height:90px;object-fit:cover;border-radius:50%;border:3px solid ${c};float:right;margin-left:16px" />`
      : '';

    const logoUrl   = clubConfig?.logo_url || '';
    const logoHtml  = logoUrl
      ? `<img src="${logoUrl}" alt="" style="height:40px;width:40px;object-fit:contain;border-radius:6px;margin-right:12px;flex-shrink:0" />`
      : '';

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<title>Ficha — ${esc(f.nombre)} ${esc(f.apellidos)}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;background:#fff;}@media print{.no-print{display:none!important}}</style>
</head><body>
<!-- Header banda color club -->
<div style="background:${c};padding:16px 28px;display:flex;align-items:center;justify-content:space-between">
  <div style="display:flex;align-items:center">${logoHtml}
    <div>
      <p style="font-size:16px;font-weight:800;color:#fff">${esc(clubName)}</p>
      <p style="font-size:11px;color:rgba(255,255,255,0.8);margin-top:1px">ZenSports — Gestión deportiva</p>
    </div>
  </div>
  <div style="text-align:right">
    <p style="font-size:12px;font-weight:700;color:#fff">Ficha de Inscripción</p>
    <p style="font-size:11px;color:rgba(255,255,255,0.8);margin-top:2px">Registrado: ${fecha}</p>
  </div>
</div>
<div style="padding:24px 28px">
<div style="clearfix:both;margin-bottom:20px">
  ${fotoHtml}
  <h2 style="font-size:18px;font-weight:800;margin-bottom:4px">${esc(f.nombre)} ${esc(f.apellidos)}</h2>
  <p style="font-size:13px;color:#6b7280">${esc(f.tipo_id || 'Documento')}: ${esc(f.cedula)}</p>
  <div style="clear:both"></div>
</div>
<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px">
  <thead><tr style="background:${c}"><th colspan="2" style="padding:10px 12px;text-align:left;font-size:12px;color:#fff;font-weight:700;letter-spacing:0.05em">DATOS DE CONTACTO</th></tr></thead>
  <tbody>
    ${fila('Celular (WhatsApp)', f.celular)}
    ${fila('Correo electrónico', f.correo_electronico)}
    ${fila('Instagram', f.instagram)}
  </tbody>
</table>
<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px">
  <thead><tr style="background:${c}"><th colspan="2" style="padding:10px 12px;text-align:left;font-size:12px;color:#fff;font-weight:700;letter-spacing:0.05em">DATOS ADICIONALES</th></tr></thead>
  <tbody>
    ${fila('Lugar de nacimiento', f.lugar_de_nacimiento)}
    ${fila('Fecha de nacimiento', f.fecha_nacimiento)}
    ${fila('Tipo de sangre', f.tipo_sangre)}
    ${fila('EPS / Seguro médico', f.eps)}
    ${fila('Estatura', f.estatura ? f.estatura + ' cm' : '')}
    ${fila('Peso', f.peso ? f.peso + ' kg' : '')}
  </tbody>
</table>
<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px">
  <thead><tr style="background:${c}"><th colspan="2" style="padding:10px 12px;text-align:left;font-size:12px;color:#fff;font-weight:700;letter-spacing:0.05em">RESIDENCIA</th></tr></thead>
  <tbody>
    ${fila('Municipio / Ciudad', f.municipio)}
    ${fila('Dirección', f.direccion)}
    ${fila('Barrio', f.barrio)}
  </tbody>
</table>
<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px">
  <thead><tr style="background:${c}"><th colspan="2" style="padding:10px 12px;text-align:left;font-size:12px;color:#fff;font-weight:700;letter-spacing:0.05em">CONTACTO DE EMERGENCIA</th></tr></thead>
  <tbody>
    ${fila('Familiar / Contacto', f.familiar_emergencia)}
    ${fila('Celular emergencia', f.celular_contacto)}
  </tbody>
</table>
<div style="margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">
  <p style="font-size:10px;color:#9ca3af">${clubName} · Documento confidencial</p>
  <p style="font-size:10px;color:#9ca3af">zensports.zenpra.ai</p>
</div>
</div>
<div class="no-print" style="padding:0 28px 24px;text-align:center">
  <button onclick="window.print()" style="background:${c};color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">
    Imprimir / Guardar PDF
  </button>
</div>
</body></html>`;

    const ventana = window.open('', '_blank');
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
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
          <p style={{ color: 'var(--text-sec)', fontSize: 14, marginBottom: 22 }}>
            Bienvenido a <span style={{ color: c, fontWeight: 700 }}>{clubName}</span>
          </p>
          <div style={{ background: `${c}0E`, border: `1px solid ${c}25`, borderRadius: 14, padding: '16px 18px', textAlign: 'left', marginBottom: 20 }}>
            {[['✅','Tu registro fue procesado correctamente'],['📱','Recibirás un mensaje de bienvenida por WhatsApp'],['🏅','¡Ya eres parte del club!']].map(([ico, txt]) => (
              <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{ico}</span>
                <span style={{ color: 'var(--text-sec)', fontSize: 13 }}>{txt}</span>
              </div>
            ))}
          </div>
          {/* Redes sociales del club */}
          {(() => {
            const rs = clubConfig?.redes_sociales || {};
            const ICONS = {
              instagram: (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              ),
              facebook: (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              ),
              tiktok: (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              ),
              youtube: (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              ),
              web: (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1 21.945V18h2v3.945C7.273 21.478 2.522 16.727 2.055 11H6v-2H2.055C2.522 3.273 7.273-.478 13 0v-1c0 .034 0 .067.001.1V4H11V.055C5.728.529 1.529 5.196 1.055 11H1v1h.055C1.529 18.804 5.728 23.471 11 23.945v-2zM13 21.945V18h-2v3.945A9.98 9.98 0 0 0 12 22a9.98 9.98 0 0 0 1-.055zM12 2a9.98 9.98 0 0 1 1 .055V6h2V2.055A9.98 9.98 0 0 1 12 2zm3 19.945V18h-2v3.945c5.272-.474 9.471-5.141 9.945-10.945H19v-1h3.945C22.471 4.196 18.272-.471 13 .055V4h2V.055A9.98 9.98 0 0 1 22 12c0 5.176-3.947 9.449-9 9.945z"/>
                </svg>
              ),
            };
            const links = [
              { key: 'instagram', label: 'Instagram', base: 'https://instagram.com/'  },
              { key: 'facebook',  label: 'Facebook',  base: 'https://facebook.com/'  },
              { key: 'tiktok',    label: 'TikTok',    base: 'https://tiktok.com/@'   },
              { key: 'youtube',   label: 'YouTube',   base: 'https://youtube.com/'   },
              { key: 'web',       label: 'Sitio web', base: 'https://'               },
            ].filter(({ key }) => rs[key]);
            if (!links.length) return null;
            return (
              <div style={{ marginBottom: 14, padding: '14px 16px', background: `${c}0C`, border: `1px solid ${c}25`, borderRadius: 12 }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: '0 0 10px' }}>Síguenos en redes</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {links.map(({ key, label, base }) => {
                    const val = String(rs[key] || '');
                    const href = val.startsWith('http') ? val : base + val.replace(/^@/, '');
                    return (
                      <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: `${c}16`, border: `1px solid ${c}30`, color: c, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                        {ICONS[key]} {label}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* PDF */}
          <button
            onClick={generarFichaPDF}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, border: `1px solid ${c}55`,
              background: `${c}18`, color: c, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 10,
            }}
          >
            📄 Descargar ficha de inscripción (PDF)
          </button>

          {/* Acciones post-registro */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={() => {
                setForm({});
                setPhotoFile(null);
                setPhotoPreview(null);
                setSavedForm(null);
                setError('');
                setStatus('idle');
              }}
              style={{
                padding: '11px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)', color: 'var(--text-sec)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ＋ Registrar otro
            </button>
            <button
              onClick={() => {
                const cerrado = window.close();
                if (cerrado === undefined) setStatus('cerrar');
              }}
              style={{
                padding: '11px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)', color: 'var(--text-sec)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ✓ Listo
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── LISTO (no se pudo cerrar automáticamente) ─────────────────────── */
  if (status === 'cerrar') {
    return (
      <div style={S.page}>
        <div style={{ ...S.successCard, borderColor: 'rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>¡Todo listo!</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 14, lineHeight: 1.6 }}>
            Ya puedes <strong style={{ color: '#fff' }}>cerrar esta pestaña</strong>.
          </p>
        </div>
      </div>
    );
  }

  /* ── FORMULARIO ────────────────────────────────────────────────────── */
  return (
    <div style={S.page}>
      {showPolitica && <PoliticaPrivacidadModal onClose={() => setShowPolitica(false)} />}
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
          <p style={{ color: 'var(--text-sec)', fontSize: 13, margin: 0 }}>Completa tus datos para inscribirte</p>

          {/* Barra de progreso */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mut)', marginBottom: 6, letterSpacing: '0.5px' }}>
              <span>Progreso del formulario</span>
              <span style={{ color: progress > 0 ? c : 'var(--text-mut)', fontWeight: 600 }}>{progress}%</span>
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
            <p style={{ color: 'var(--text-sec)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
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
                    <Upload size={20} color="var(--text-sec)" />
                  </div>
                  <span style={{ color: 'var(--text-sec)', fontSize: 13, fontWeight: 500 }}>Subir foto</span>
                  <span style={{ color: 'var(--text-mut)', fontSize: 11, marginTop: 4 }}>o arrastra aquí</span>
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

            <p style={{ color: 'var(--text-sec)', fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
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
                  {/* Título de sección */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: sec.hint ? 8 : 14 }}>
                    <div style={{ width: 3, height: 16, background: c, borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-sec)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                      {sec.label}
                    </span>
                  </div>

                  {/* Nota de sección (ej: contacto de acudiente) */}
                  {sec.hint && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, background: `${c}0D`, border: `1px solid ${c}25`, marginBottom: 12 }}>
                      <Info size={13} color={c} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.55 }}>{sec.hint}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rows.map((row, ri) => (
                      <>
                        <div key={ri} style={{ display: 'grid', gridTemplateColumns: row.length === 2 ? '1fr 1fr' : '1fr', gap: 10 }}>
                          {row.map(key => {
                            const campo = campos.find(f => f.key === key);
                            if (!campo) return null;
                            return <FieldBox key={key} campo={campo} form={form} onChange={handleChange} c={c} />;
                          })}
                        </div>
                        {/* Nota para Tarjeta de Identidad (menores) */}
                        {sec.id === 'personal' && ri === 0 && form.tipo_id === 'Tarjeta de Identidad' && (
                          <div key="ti-hint" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', animation: 'fadein .25s ease' }}>
                            <Info size={13} color="#FBBF24" style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontSize: 12, color: '#D1A93A', lineHeight: 1.55 }}>
                              La Tarjeta de Identidad es el documento para <strong>menores de edad</strong>. Ingresa el número tal como aparece en el documento del niño o niña.
                            </span>
                          </div>
                        )}
                      </>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Sección categoría y equipo (si el club tiene categorías) */}
            {clubConfig?.categorias_jugadores?.length > 0 && (() => {
              const cats = normalizarCategorias(clubConfig.categorias_jugadores);
              const catSel = cats.find(c => c.nombre === form.categoria);
              return (
                <div style={S.card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 3, height: 16, background: c, borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-sec)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                      Categoría
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-sec)', marginBottom: 5, fontWeight: 500 }}>
                        Categoría
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={form.categoria || ''}
                          onChange={e => setForm(f => ({ ...f, categoria: e.target.value, equipo: '' }))}
                          className="fi fi-sel"
                        >
                          <option value="">— Sin categoría —</option>
                          {cats.map(cat => (
                            <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                          ))}
                        </select>
                        <ChevronDown size={13} color="var(--text-mut)" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-sec)', marginBottom: 5, fontWeight: 500 }}>
                        Equipo
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={form.equipo || ''}
                          onChange={e => setForm(f => ({ ...f, equipo: e.target.value }))}
                          className="fi fi-sel"
                          disabled={!catSel}
                          style={!catSel ? { opacity: 0.5 } : {}}
                        >
                          <option value="">— Sin equipo —</option>
                          {catSel?.equipos.map(eq => (
                            <option key={eq} value={eq}>{eq}</option>
                          ))}
                        </select>
                        <ChevronDown size={13} color="var(--text-mut)" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Aceptación política de privacidad */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
              <input
                type="checkbox"
                id="privacidad-check"
                checked={aceptaPrivacidad}
                onChange={e => setAceptaPrivacidad(e.target.checked)}
                style={{ marginTop: 3, flexShrink: 0, cursor: 'pointer', accentColor: c }}
              />
              <label htmlFor="privacidad-check" style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.55, cursor: 'pointer' }}>
                He leído y acepto la{' '}
                <button
                  type="button"
                  onClick={() => setShowPolitica(true)}
                  style={{ background: 'none', border: 'none', color: c, cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0, textDecoration: 'underline' }}
                >
                  Política de Tratamiento de Datos Personales
                </button>
                {' '}de conformidad con la Ley 1581 de 2012.
              </label>
            </div>

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
                transition: 'background-color 0.2s, box-shadow 0.2s',
              }}
            >
              {status === 'loading'
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Registrando...</>
                : <><UserPlus size={16} /> Inscribirme</>}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--text-sec)', fontSize: 12, marginTop: 2 }}>
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
  const isSelect  = campo.type === 'select';
  const isPais    = campo.type === 'pais';
  const isTelIntl = campo.type === 'tel-intl';

  const labelEl = (
    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-sec)', marginBottom: 5, fontWeight: 500 }}>
      {campo.label}
      {campo.required && <span style={{ color: '#F87171', marginLeft: 3 }}>*</span>}
    </label>
  );

  const wrapStyle = { position: 'relative' };
  const iconEl = Icon ? (
    <Icon
      size={14}
      color="var(--text-mut)"
      style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
    />
  ) : null;

  if (isTelIntl) {
    const codeKey = campo.codigoPaisKey;
    return (
      <div>
        {labelEl}
        <div style={{ display: 'flex', gap: 6 }}>
          <CountryCodePicker
            value={form[codeKey] || '57'}
            onChange={v => onChange(codeKey, v)}
          />
          <div style={{ position: 'relative', flex: 1 }}>
            {iconEl}
            <input
              type="tel"
              placeholder={campo.placeholder}
              value={form[campo.key] || ''}
              onChange={e => onChange(campo.key, e.target.value.replace(/\D/g, ''))}
              required={campo.required}
              className="fi"
            />
          </div>
        </div>
      </div>
    );
  }

  if (isPais) {
    return (
      <div>
        {labelEl}
        <div style={wrapStyle}>
          {iconEl}
          <select
            value={form[campo.key] || ''}
            onChange={e => onChange(campo.key, e.target.value)}
            className="fi fi-sel"
          >
            <option value="">— Seleccionar país —</option>
            {PAISES_NACIMIENTO.map(p => (
              <option key={p.codigo + p.nombre} value={p.nombre}>
                {p.bandera} {p.nombre}
              </option>
            ))}
          </select>
          <ChevronDown size={13} color="var(--text-mut)" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>
    );
  }

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
          <ChevronDown size={13} color="var(--text-mut)" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
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
