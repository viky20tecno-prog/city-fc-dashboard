import { useState, useRef, useEffect } from 'react';
import { CheckCircle, ChevronRight, DollarSign, X, Phone, Palette, Building2, ChevronDown, Camera, Loader2, AlertTriangle, Info, MessageCircle, Instagram, Facebook, Youtube, Globe, Music } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getClubId } from '../services/api';
import { applyTheme, getStoredTheme, THEMES } from './ThemeSelector';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const PAISES_LIST = [
  { codigo: '57',  bandera: '🇨🇴', nombre: 'Colombia',       moneda: 'COP' },
  { codigo: '52',  bandera: '🇲🇽', nombre: 'México',         moneda: 'MXN' },
  { codigo: '54',  bandera: '🇦🇷', nombre: 'Argentina',      moneda: 'ARS' },
  { codigo: '51',  bandera: '🇵🇪', nombre: 'Perú',           moneda: 'PEN' },
  { codigo: '56',  bandera: '🇨🇱', nombre: 'Chile',          moneda: 'CLP' },
  { codigo: '58',  bandera: '🇻🇪', nombre: 'Venezuela',      moneda: 'USD' },
  { codigo: '593', bandera: '🇪🇨', nombre: 'Ecuador',        moneda: 'USD' },
  { codigo: '598', bandera: '🇺🇾', nombre: 'Uruguay',        moneda: 'UYU' },
  { codigo: '591', bandera: '🇧🇴', nombre: 'Bolivia',        moneda: 'BOB' },
  { codigo: '595', bandera: '🇵🇾', nombre: 'Paraguay',       moneda: 'PYG' },
  { codigo: '507', bandera: '🇵🇦', nombre: 'Panamá',         moneda: 'USD' },
  { codigo: '502', bandera: '🇬🇹', nombre: 'Guatemala',      moneda: 'GTQ' },
  { codigo: '503', bandera: '🇸🇻', nombre: 'El Salvador',    moneda: 'USD' },
  { codigo: '504', bandera: '🇭🇳', nombre: 'Honduras',       moneda: 'HNL' },
  { codigo: '505', bandera: '🇳🇮', nombre: 'Nicaragua',      moneda: 'NIO' },
  { codigo: '506', bandera: '🇨🇷', nombre: 'Costa Rica',     moneda: 'CRC' },
  { codigo: '1',   bandera: '🇺🇸', nombre: 'Estados Unidos', moneda: 'USD' },
];

const COLORES_PRESET = [
  { hex: '#EF4444', nombre: 'Rojo Pasión'     },
  { hex: '#E14924', nombre: 'Naranja Ciudad'  },
  { hex: '#DC2626', nombre: 'Escarlata'       },
  { hex: '#F97316', nombre: 'Naranja Solar'   },
  { hex: '#FB923C', nombre: 'Naranja Fuego'   },
  { hex: '#EAB308', nombre: 'Dorado Campeón'  },
  { hex: '#84CC16', nombre: 'Lima Fresco'     },
  { hex: '#22C55E', nombre: 'Verde Energía'   },
  { hex: '#10B981', nombre: 'Verde Esmeralda' },
  { hex: '#14B8A6', nombre: 'Teal Agua'       },
  { hex: '#06B6D4', nombre: 'Cian Deportivo'  },
  { hex: '#00AAFF', nombre: 'Azul Cobalto'    },
  { hex: '#3B82F6', nombre: 'Azul Eléctrico'  },
  { hex: '#2563EB', nombre: 'Azul Real'       },
  { hex: '#6366F1', nombre: 'Índigo Dinámico' },
  { hex: '#8B5CF6', nombre: 'Violeta Real'    },
  { hex: '#A855F7', nombre: 'Púrpura'         },
  { hex: '#EC4899', nombre: 'Rosa Dinámico'   },
  { hex: '#DB2777', nombre: 'Rosa Fuerte'     },
  { hex: '#64748B', nombre: 'Gris Pizarra'    },
];

const STEPS = [
  { id: 'club',        Icon: Building2,   label: 'Tu club'     },
  { id: 'visual',      Icon: Palette,     label: 'Identidad'   },
  { id: 'mensualidad', Icon: DollarSign,  label: 'Mensualidad' },
  { id: 'whatsapp',    Icon: Phone,       label: 'WhatsApp'    },
  { id: 'done',        Icon: CheckCircle, label: 'Listo'       },
];

const CONTENT_STEPS = STEPS.length - 1; // sin 'done'

export default function OnboardingWizard({ color = '#E14924', clubConfig, onComplete }) {
  const [step, setStep]         = useState(0);
  const [saving, setSaving]     = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef  = useRef(null);
  const bodyRef  = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [step]);

  /* ── Estado por paso ──────────────────────────────────────── */
  const [club, setClub] = useState({
    nombre:      clubConfig?.nombre      || '',
    subtitulo:   clubConfig?.subtitulo   || '',
    ciudad:      clubConfig?.ciudad      || '',
    codigo_pais: clubConfig?.codigo_pais || '57',
  });

  const [deportesSeleccionados, setDeportesSeleccionados] = useState(() => {
    if (Array.isArray(clubConfig?.deportes) && clubConfig.deportes.length > 0) return clubConfig.deportes;
    if (clubConfig?.deporte) return [clubConfig.deporte];
    return ['futbol'];
  });

  const toggleDeporte = (d) => setDeportesSeleccionados(prev =>
    prev.includes(d) ? (prev.length > 1 ? prev.filter(x => x !== d) : prev) : [...prev, d]
  );

  const [colorClub,      setColorClub]      = useState(clubConfig?.color   || '#E14924');
  const [logoUrl,        setLogoUrl]        = useState(clubConfig?.logo_url || '');
  const [selectedTheme,  setSelectedTheme]  = useState(getStoredTheme);

  const [mensualidad, setMensualidad] = useState({
    valor:       clubConfig?.valor_mensualidad || 65000,
    dias_gracia: clubConfig?.dias_gracia_mora  || 7,
    penalidad:   clubConfig?.penalidad_mora    || 5000,
  });

  const [whatsapp,   setWhatsapp]   = useState(clubConfig?.whatsapp    || '');
  const [llavePago,  setLlavePago]  = useState(clubConfig?.llave_pago  || '');
  const [qrPagoUrl,  setQrPagoUrl]  = useState(clubConfig?.qr_pago_url || '');
  const [uploadingQR, setUploadingQR] = useState(false);
  const qrRef = useRef(null);

  const [redes, setRedes] = useState({
    instagram: clubConfig?.redes_sociales?.instagram || '',
    facebook:  clubConfig?.redes_sociales?.facebook  || '',
    tiktok:    clubConfig?.redes_sociales?.tiktok    || '',
    youtube:   clubConfig?.redes_sociales?.youtube   || '',
    web:       clubConfig?.redes_sociales?.web        || '',
  });

  /* ── Helpers ──────────────────────────────────────────────── */
  const c        = colorClub || color;
  const paisActual = PAISES_LIST.find(p => p.codigo === club.codigo_pais) || PAISES_LIST[0];

  const uploadLogo = async (file) => {
    setUploadingLogo(true);
    try {
      const ext  = file.name.split('.').pop();
      const path = `clubs/${getClubId()}/logo.${ext}`;
      const { error } = await supabase.storage.from('player-photos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('player-photos').getPublicUrl(path);
      setLogoUrl(publicUrl);
    } catch (err) {
      console.error('Error subiendo logo:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const uploadQR = async (file) => {
    setUploadingQR(true);
    try {
      const ext  = file.name.split('.').pop();
      const path = `clubs/${getClubId()}/qr-pago.${ext}`;
      const { error } = await supabase.storage.from('club-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('club-assets').getPublicUrl(path);
      setQrPagoUrl(publicUrl);
    } catch (err) {
      console.error('Error subiendo QR:', err);
    } finally {
      setUploadingQR(false);
    }
  };

  const saveToApi = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    await fetch(`${API_BASE}/config?club_id=${getClubId()}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nombre:               club.nombre,
        subtitulo:            club.subtitulo,
        ciudad:               club.ciudad,
        codigo_pais:          club.codigo_pais,
        deportes:             deportesSeleccionados,
        deporte:              deportesSeleccionados[0] || 'futbol',
        color:                colorClub,
        logo_url:             logoUrl || null,
        valor_mensualidad:    mensualidad.valor,
        dias_gracia_mora:     mensualidad.dias_gracia,
        penalidad_mora:       mensualidad.penalidad,
        whatsapp,
        llave_pago:           llavePago  || null,
        qr_pago_url:          qrPagoUrl  || null,
        redes_sociales:       redes,
        onboarding_completed: true,
      }),
    });
  };

  const next = async () => {
    if (step < CONTENT_STEPS - 1) {
      setStep(s => s + 1);
    } else if (step === CONTENT_STEPS - 1) {
      // Último paso de contenido → guardar y mostrar done
      setSaving(true);
      try { await saveToApi(); } catch (_) {} finally { setSaving(false); }
      setStep(CONTENT_STEPS); // done
    } else {
      // Pantalla done → cerrar
      onComplete();
    }
  };

  const back = () => { if (step > 0 && step < CONTENT_STEPS) setStep(s => s - 1); };

  const skip = () => { onComplete(); };

  /* ── Estilos base ─────────────────────────────────────────── */
  const overlay = {
    position: 'fixed', inset: 0, zIndex: 500,
    background: 'rgba(4,6,12,0.88)', backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  };
  const card = {
    background: '#0D1627', borderRadius: 20,
    border: `1px solid ${c}35`,
    boxShadow: `0 24px 64px rgba(0,0,0,0.65), 0 0 60px ${c}15`,
    width: '100%', maxWidth: 580, maxHeight: '94vh',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
    fontFamily: "'Inter', system-ui, sans-serif",
    transition: 'border-color 0.4s',
  };
  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '11px 14px',
    color: '#fff', fontSize: 14, outline: 'none',
  };
  const lbl = { display: 'block', fontSize: 12, color: '#8B95A3', marginBottom: 7, fontWeight: 500, letterSpacing: 0.3 };
  const isDone = step === CONTENT_STEPS;

  return (
    <div style={overlay}>
      <div style={card}>

        {/* ── Header ─────────────────────────────────── */}
        <div style={{ padding: '20px 26px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isDone ? 0 : 16 }}>
            <div>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                {isDone ? `¡${club.nombre || 'Tu club'} está listo!` : 'Configura tu club'}
              </h2>
              <p style={{ color: '#8B95A3', fontSize: 12, margin: '3px 0 0' }}>
                {isDone
                  ? 'Configuración guardada. Puedes editarla en cualquier momento.'
                  : `Paso ${step + 1} de ${CONTENT_STEPS} · ${STEPS[step].label}`}
              </p>
            </div>
            {!isDone && (
              <button onClick={skip}
                style={{ background: 'none', border: 'none', color: '#8B95A3', cursor: 'pointer', padding: 4 }}
                title="Saltar configuración">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Barra de progreso */}
          {!isDone && (
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 4 }}>
              <div style={{
                background: c, borderRadius: 99, height: 4,
                width: `${((step + 1) / CONTENT_STEPS) * 100}%`,
                transition: 'width 0.4s ease, background 0.4s',
              }} />
            </div>
          )}
        </div>

        {/* ── Cuerpo ─────────────────────────────────── */}
        <div ref={bodyRef} style={{ padding: '22px 26px', overflowY: 'auto', flex: 1, minHeight: 0 }}>

          {/* PASO 1 — TU CLUB */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <StepBadge color={c} Icon={Building2} title="Información básica" desc="Aparecerá en toda la aplicación y en los recibos" />

              <div>
                <label style={lbl}>Nombre del club *</label>
                <input value={club.nombre}
                  onChange={e => setClub(cl => ({ ...cl, nombre: e.target.value }))}
                  placeholder="Ej: City FC, Deportivo Los Alpes…" style={inp} />
              </div>

              <div>
                <label style={lbl}>Subtítulo / categoría</label>
                <input value={club.subtitulo}
                  onChange={e => setClub(cl => ({ ...cl, subtitulo: e.target.value }))}
                  placeholder="Ej: Fútbol 7 · Masculino · Sub-20" style={inp} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Ciudad</label>
                  <input value={club.ciudad}
                    onChange={e => setClub(cl => ({ ...cl, ciudad: e.target.value }))}
                    placeholder="Ej: Medellín" style={inp} />
                </div>
                <div>
                  <label style={lbl}>País / Moneda</label>
                  <PaisDropdown
                    value={club.codigo_pais}
                    onChange={v => setClub(cl => ({ ...cl, codigo_pais: v }))}
                    inp={inp}
                    c={c}
                  />
                </div>
              </div>

              <div>
                <label style={lbl}>Deportes del club (selecciona uno o más)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { id: 'futbol',     label: 'Fútbol'     },
                    { id: 'baloncesto', label: 'Baloncesto' },
                    { id: 'voleibol',   label: 'Voleibol'   },
                    { id: 'natacion',   label: 'Natación'   },
                    { id: 'tenis',      label: 'Tenis'      },
                    { id: 'beisbol',    label: 'Béisbol'    },
                    { id: 'ciclismo',   label: 'Ciclismo'   },
                    { id: 'rugby',      label: 'Rugby'      },
                    { id: 'general',    label: 'Otro'       },
                  ].map(({ id, label }) => {
                    const sel = deportesSeleccionados.includes(id);
                    return (
                      <button key={id} type="button" onClick={() => toggleDeporte(id)} style={{
                        padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                        fontWeight: sel ? 700 : 500,
                        background: sel ? c : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${sel ? c : 'rgba(255,255,255,0.12)'}`,
                        color: sel ? '#fff' : '#8B95A3',
                        transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                      }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: 11, color: '#8B95A3', marginTop: 7, marginBottom: 0 }}>
                  Mínimo uno. Para clubs multi-deporte selecciona todos los que practican.
                </p>
              </div>

              <InfoBox>El país define la moneda y el formato de los números en toda la app.</InfoBox>
            </div>
          )}

          {/* PASO 2 — IDENTIDAD VISUAL */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <StepBadge color={c} Icon={Palette} title="Identidad visual" desc="Personaliza los colores y el logo de tu club" />

              {/* Color */}
              <div>
                <label style={lbl}>Color principal del club</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
                  {COLORES_PRESET.map(({ hex, nombre }) => (
                    <button key={hex} title={nombre} onClick={() => setColorClub(hex)} style={{
                      width: 32, height: 32, borderRadius: '50%', background: hex,
                      border: 'none', cursor: 'pointer', flexShrink: 0,
                      outline: colorClub === hex ? `3px solid ${hex}` : '3px solid transparent',
                      outlineOffset: 3,
                      boxShadow: colorClub === hex ? `0 0 14px ${hex}90` : 'none',
                      transition: 'box-shadow 0.2s, outline 0.15s',
                    }} />
                  ))}
                  {/* Selector personalizado */}
                  <label title="Color personalizado" style={{
                    width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                    border: '2px dashed rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: 'rgba(255,255,255,0.4)', position: 'relative', overflow: 'hidden',
                  }}>
                    +
                    <input type="color" value={colorClub} onChange={e => setColorClub(e.target.value)}
                      style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }} />
                  </label>
                </div>

                {/* Preview color */}
                <div style={{ padding: '12px 16px', borderRadius: 12, background: `${c}12`, border: `1px solid ${c}35`, display: 'flex', alignItems: 'center', gap: 12, transition: 'background-color 0.4s, border-color 0.4s' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: c, flexShrink: 0, transition: 'background 0.4s' }} />
                  <div>
                    <p style={{ color: '#fff', fontWeight: 700, margin: 0, fontSize: 14 }}>{club.nombre || 'Mi Club'}</p>
                    <p style={{ color: c, fontSize: 11, margin: '2px 0 0', fontWeight: 600, transition: 'color 0.4s' }}>
                      {COLORES_PRESET.find(p => p.hex === colorClub)?.nombre || 'Color personalizado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fondo */}
              <div>
                <label style={lbl}>Fondo de la aplicación</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {THEMES.map(t => {
                    const isActive = selectedTheme === t.id;
                    return (
                      <button key={t.id} onClick={() => { setSelectedTheme(t.id); applyTheme(t.id); }}
                        style={{
                          padding: '6px', borderRadius: 10,
                          border: `2px solid ${isActive ? c : 'rgba(255,255,255,0.08)'}`,
                          background: isActive ? `${c}10` : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5,
                          transition: 'border-color 0.2s, background 0.2s',
                        }}>
                        <DashboardMini theme={t} accent={c} />
                        <span style={{ fontSize: 10, color: isActive ? c : '#8B95A3', fontWeight: isActive ? 700 : 500, transition: 'color 0.2s', textAlign: 'center' }}>
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logo */}
              <div>
                <label style={lbl}>Logo del club</label>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {/* Preview */}
                  <div onClick={() => logoRef.current?.click()}
                    style={{
                      width: 76, height: 76, borderRadius: 14, flexShrink: 0, overflow: 'hidden', cursor: 'pointer',
                      background: logoUrl ? 'transparent' : `${c}10`,
                      border: `2px dashed ${c}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {logoUrl
                      ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setLogoUrl('')} />
                      : uploadingLogo
                        ? <Loader2 size={26} color={c} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Camera size={26} color={`${c}80`} strokeWidth={1.5} />}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                      style={{ padding: '9px 14px', background: `${c}18`, border: `1px solid ${c}35`, borderRadius: 10, color: c, fontWeight: 600, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                      {uploadingLogo ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Subiendo…</> : <><Camera size={13} /> Subir imagen</>}
                    </button>
                    <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
                      placeholder="O pega un URL de imagen"
                      style={{ ...inp, padding: '9px 12px', fontSize: 12 }} />
                  </div>
                </div>
                <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                <p style={{ fontSize: 11, color: '#8B95A3', marginTop: 8, marginBottom: 0 }}>PNG, JPG o SVG. Recomendado: fondo transparente.</p>
              </div>
            </div>
          )}

          {/* PASO 3 — MENSUALIDADES */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <StepBadge color={c} Icon={DollarSign} title="Mensualidades y mora" desc="Define cuánto y cuándo cobrar a los jugadores" />

              <div>
                <label style={lbl}>Valor de la cuota mensual ({paisActual.moneda})</label>
                <input type="text" inputMode="numeric" value={mensualidad.valor === 0 ? '' : mensualidad.valor} min={0}
                  onChange={e => { const v = parseInt(e.target.value.replace(/\D/g,''),10); setMensualidad(m => ({ ...m, valor: isNaN(v) ? 0 : v })); }} style={inp} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Días de gracia antes de mora</label>
                  <input type="text" inputMode="numeric" value={mensualidad.dias_gracia === 0 ? '' : mensualidad.dias_gracia} min={0} max={30}
                    onChange={e => { const v = parseInt(e.target.value.replace(/\D/g,''),10); setMensualidad(m => ({ ...m, dias_gracia: isNaN(v) ? 0 : Math.min(v,30) })); }} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Penalidad por mora ({paisActual.moneda})</label>
                  <input type="text" inputMode="numeric" value={mensualidad.penalidad === 0 ? '' : mensualidad.penalidad} min={0}
                    onChange={e => { const v = parseInt(e.target.value.replace(/\D/g,''),10); setMensualidad(m => ({ ...m, penalidad: isNaN(v) ? 0 : v })); }} style={inp} />
                </div>
              </div>

              <InfoBox warn>
                La mora se aplica automáticamente cuando un jugador supera los días de gracia sin pagar. Puedes ajustar estos valores en cualquier momento.
              </InfoBox>
            </div>
          )}

          {/* PASO 4 — COBROS POR WHATSAPP */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <StepBadge color={c} Icon={MessageCircle} title="Cobro automático por WhatsApp" desc="ZenSports envía recordatorios de pago a tus jugadores automáticamente" />

              {/* Cómo funciona */}
              <div style={{ padding: '14px 16px', background: `${c}08`, borderRadius: 12, border: `1px solid ${c}20` }}>
                <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: '0 0 8px' }}>⚡ ¿Cómo funciona?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { dia: 'Día 27', msg: 'Aviso preventivo — se acerca la cuota del próximo mes' },
                    { dia: 'Día 1',  msg: 'Cuota activa — valor exacto y fecha límite de pago' },
                    { dia: 'Día 4',  msg: 'Recordatorio — quedan 3 días para pagar sin penalidad' },
                    { dia: 'Día 7',  msg: 'Último aviso — hoy vence el plazo' },
                    { dia: 'Día 8',  msg: 'Mora aplicada — se notifica al jugador y al admin' },
                  ].map(({ dia, msg }) => (
                    <div key={dia} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: c, background: `${c}18`, padding: '2px 8px', borderRadius: 6, flexShrink: 0, marginTop: 1 }}>{dia}</span>
                      <span style={{ fontSize: 12, color: '#8B95A3', lineHeight: 1.5 }}>{msg}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Número WA del admin */}
              <div>
                <label style={lbl}>Tu número de WhatsApp (recibe alertas de mora)</label>
                <input
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                  placeholder={`Ej: ${club.codigo_pais}3001234567`}
                  style={inp} type="tel"
                />
                <p style={{ fontSize: 11, color: '#8B95A3', marginTop: 5, marginBottom: 0 }}>
                  Con código de país (+{club.codigo_pais}), sin el símbolo +. Recibirás el reporte de morosos cada mes.
                </p>
              </div>

              {/* Llave de pago */}
              <div>
                <label style={lbl}>Llave de pago (Nequi / Bancolombia / PSE)</label>
                <input
                  value={llavePago}
                  onChange={e => setLlavePago(e.target.value.trim())}
                  placeholder="Ej: 0087276387 o 3001234567"
                  style={inp}
                />
                <p style={{ fontSize: 11, color: '#8B95A3', marginTop: 5, marginBottom: 0 }}>
                  Se incluye en cada mensaje de cobro para que el jugador pague directo.
                </p>
              </div>

              {/* QR de pago */}
              <div>
                <label style={lbl}>QR de pago (opcional)</label>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div onClick={() => qrRef.current?.click()}
                    style={{
                      width: 76, height: 76, borderRadius: 14, flexShrink: 0, overflow: 'hidden', cursor: 'pointer',
                      background: qrPagoUrl ? 'transparent' : `${c}10`,
                      border: `2px dashed ${c}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {qrPagoUrl
                      ? <img src={qrPagoUrl} alt="QR pago" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setQrPagoUrl('')} />
                      : uploadingQR
                        ? <Loader2 size={26} color={c} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Camera size={26} color={`${c}80`} strokeWidth={1.5} />}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button onClick={() => qrRef.current?.click()} disabled={uploadingQR}
                      style={{ padding: '9px 14px', background: `${c}18`, border: `1px solid ${c}35`, borderRadius: 10, color: c, fontWeight: 600, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                      {uploadingQR ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Subiendo…</> : <><Camera size={13} /> Subir QR</>}
                    </button>
                    <input value={qrPagoUrl} onChange={e => setQrPagoUrl(e.target.value)}
                      placeholder="O pega un URL del QR"
                      style={{ ...inp, padding: '9px 12px', fontSize: 12 }} />
                  </div>
                </div>
                <input ref={qrRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && uploadQR(e.target.files[0])} />
                <p style={{ fontSize: 11, color: '#8B95A3', marginTop: 8, marginBottom: 0 }}>
                  Si subes el QR de Nequi o Bancolombia, se adjunta automáticamente a los mensajes de cobro.
                </p>
              </div>

              <InfoBox>Todos estos campos son opcionales — puedes completarlos luego desde Configuración. Cuantos más datos configures, más completos serán los mensajes automáticos.</InfoBox>

              {/* Redes sociales */}
              <div style={{ marginTop: 4 }}>
                <label style={{ ...lbl, marginBottom: 10 }}>REDES SOCIALES DEL CLUB (opcional)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { key: 'instagram', Icon: Instagram, label: 'Instagram', placeholder: '@tuclub' },
                    { key: 'facebook',  Icon: Facebook,  label: 'Facebook',  placeholder: 'facebook.com/tuclub' },
                    { key: 'tiktok',    Icon: Music,     label: 'TikTok',    placeholder: '@tuclub' },
                    { key: 'youtube',   Icon: Youtube,   label: 'YouTube',   placeholder: 'youtube.com/@tuclub' },
                    { key: 'web',       Icon: Globe,     label: 'Sitio web', placeholder: 'www.tuclub.com' },
                  ].map(({ key, Icon, label, placeholder }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${c}14`, border: `1px solid ${c}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={15} color={c} strokeWidth={1.8} />
                      </div>
                      <input
                        value={redes[key]}
                        onChange={e => setRedes(r => ({ ...r, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={{ ...inp, flex: 1 }}
                      />
                    </div>
                  ))}
                </div>
                <InfoBox>Estas redes se muestran en la pantalla de bienvenida del formulario de inscripción, para que los jugadores te empiecen a seguir.</InfoBox>
              </div>
            </div>
          )}

          {/* DONE */}
          {step === CONTENT_STEPS && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, padding: '8px 0' }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', background: `${c}18`, border: `2px solid ${c}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                🎉
              </div>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
                  ¡Todo configurado!
                </h3>
                <p style={{ color: '#8B95A3', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
                  Tu club está listo. Puedes ajustar cualquier dato en el módulo de Configuración.
                </p>
              </div>

              {/* Resumen */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { label: 'Club',       val: club.nombre || '—' },
                  { label: 'Deportes',   val: deportesSeleccionados.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') || '—' },
                  { label: 'Ciudad',     val: club.ciudad || '—' },
                  { label: 'País',       val: `${paisActual.bandera} ${paisActual.nombre} · ${paisActual.moneda}` },
                  { label: 'Mensualidad', val: `${paisActual.moneda} ${mensualidad.valor.toLocaleString()}` },
                  { label: 'Mora',       val: `${mensualidad.dias_gracia} días gracia · ${paisActual.moneda} ${mensualidad.penalidad.toLocaleString()}` },
                  { label: 'WhatsApp',   val: whatsapp  ? `+${whatsapp}`  : 'No configurado' },
                  { label: 'Llave pago', val: llavePago ? llavePago       : 'No configurada' },
                  { label: 'QR pago',    val: qrPagoUrl ? '✓ Subido'      : 'No configurado' },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#8B95A3', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, textAlign: 'right' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <div style={{ padding: '14px 26px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {isDone ? (
            <div /> // spacer
          ) : step === 0 ? (
            <button onClick={skip}
              style={{ background: 'none', border: 'none', color: '#8B95A3', fontSize: 13, cursor: 'pointer', padding: '8px 4px' }}>
              Saltar configuración
            </button>
          ) : (
            <button onClick={back}
              style={{ background: 'none', border: 'none', color: '#8B95A3', fontSize: 13, cursor: 'pointer', padding: '8px 4px' }}>
              ← Atrás
            </button>
          )}

          <button onClick={next} disabled={saving} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: c, border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 14, fontWeight: 700,
            padding: '11px 24px', cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: `0 4px 20px ${c}45`,
            opacity: saving ? 0.7 : 1,
            transition: 'background 0.4s, box-shadow 0.4s',
          }}>
            {saving ? 'Guardando…' : isDone ? (
              <><CheckCircle size={15} /><span>¡Empezar!</span></>
            ) : step === CONTENT_STEPS - 1 ? (
              <><CheckCircle size={15} /><span>Finalizar</span></>
            ) : (
              <><span>Siguiente</span><ChevronRight size={16} /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Componentes auxiliares ────────────────────────────────── */

function PaisDropdown({ value, onChange, inp, c }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const selected = PAISES_LIST.find(p => p.codigo === value) || PAISES_LIST[0];
  const filtrados = PAISES_LIST.filter(p =>
    p.nombre.toLowerCase().includes(query.toLowerCase()) ||
    p.moneda.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button type="button" onClick={() => { setOpen(o => !o); setQuery(''); }}
        style={{ ...inp, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{selected.bandera}</span>
          <span style={{ color: '#fff', fontSize: 14 }}>{selected.nombre}</span>
          <span style={{ color: '#8B95A3', fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '2px 7px', borderRadius: 6 }}>{selected.moneda}</span>
        </span>
        <ChevronDown size={14} color="#8B95A3" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
          background: '#0D1627', border: `1px solid ${c}35`, borderRadius: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          maxHeight: 240, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar país…"
              style={{ ...inp, padding: '7px 10px', fontSize: 13, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtrados.map(p => (
              <button key={p.codigo} type="button"
                onClick={() => { onChange(p.codigo); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 14px', background: p.codigo === value ? `${c}18` : 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}>
                <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{p.bandera}</span>
                <span style={{ flex: 1, color: '#fff', fontSize: 13 }}>{p.nombre}</span>
                <span style={{ color: '#8B95A3', fontSize: 11, background: 'rgba(255,255,255,0.07)', padding: '2px 7px', borderRadius: 6 }}>{p.moneda}</span>
              </button>
            ))}
            {filtrados.length === 0 && (
              <p style={{ color: '#8B95A3', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StepBadge({ color, Icon, title, desc }) {
  return (
    <div style={{ padding: '12px 16px', background: `${color}0E`, borderRadius: 12, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>{title}</p>
        <p style={{ color: '#8B95A3', fontSize: 12, margin: '2px 0 0' }}>{desc}</p>
      </div>
    </div>
  );
}

function InfoBox({ children, warn = false }) {
  return (
    <div style={{ padding: '10px 14px', background: warn ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.04)', borderRadius: 10, border: warn ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      {warn
        ? <AlertTriangle size={14} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
        : <Info size={14} color="#8B95A3" style={{ flexShrink: 0, marginTop: 1 }} />}
      <p style={{ fontSize: 12, color: '#8B95A3', margin: 0, lineHeight: 1.65 }}>{children}</p>
    </div>
  );
}

function DashboardMini({ theme: t, accent }) {
  const bars = [0.35, 0.55, 0.45, 0.75, 0.6, 1.0];
  return (
    <div style={{
      width: '100%', height: 72, borderRadius: 6, overflow: 'hidden',
      display: 'flex', background: t.app,
    }}>
      {/* Sidebar */}
      <div style={{ width: 14, background: t.card, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 7, gap: 4, flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: 2, background: accent }} />
        {[1,0,0,0,0].map((active, i) => (
          <div key={i} style={{ width: 6, height: 3, borderRadius: 1, background: active ? accent : `${t.text}20` }} />
        ))}
      </div>
      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, padding: '5px 5px 4px' }}>
        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ flex: 1, height: 5, borderRadius: 2, background: `${t.text}12` }} />
          <div style={{ width: 18, height: 5, borderRadius: 2, background: accent, opacity: 0.85 }} />
        </div>
        {/* Cards */}
        <div style={{ display: 'flex', gap: 3 }}>
          {[accent, '#22C55E', '#EF4444'].map((clr, i) => (
            <div key={i} style={{
              flex: 1, height: 18, borderRadius: 3,
              background: `${clr}12`, border: `1px solid ${clr}28`,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 3px 2px',
            }}>
              <div style={{ height: 2, borderRadius: 1, background: clr, opacity: 0.7, width: '60%' }} />
            </div>
          ))}
        </div>
        {/* Chart */}
        <div style={{
          flex: 1, borderRadius: 3, background: `${t.text}06`,
          display: 'flex', alignItems: 'flex-end', padding: '0 3px 2px', gap: 2,
        }}>
          {bars.map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h * 100}%`, borderRadius: '1px 1px 0 0',
              background: i === bars.length - 1 ? accent : `${accent}45`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
