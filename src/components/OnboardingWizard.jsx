import { useState } from 'react';
import { CheckCircle, ChevronRight, DollarSign, Shirt, Trophy, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getClubId } from '../services/api';
import { getCurrencyLabel, getCodigoPais } from '../lib/formatMoney';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';

const PRENDAS_DEFAULT = [
  'Camiseta titular', 'Camiseta visitante', 'Pantaloneta', 'Medias', 'Chaqueta', 'Guayos',
];

const STEPS = [
  { id: 'mensualidad', icon: DollarSign, label: 'Mensualidad y mora'  },
  { id: 'uniformes',   icon: Shirt,       label: 'Equipamiento'        },
  { id: 'torneos',     icon: Trophy,      label: 'Torneos'             },
  { id: 'done',        icon: CheckCircle, label: 'Listo'               },
];

export default function OnboardingWizard({ color = '#00AAFF', clubConfig, onComplete }) {
  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);

  const [mensualidad, setMensualidad] = useState({
    valor:       clubConfig?.valor_mensualidad || 65000,
    dias_gracia: clubConfig?.dias_gracia_mora  || 7,
    penalidad:   clubConfig?.penalidad_mora    || 5000,
  });

  const [prendas, setPrendas]   = useState(
    clubConfig?.prendas_uniforme?.length ? clubConfig.prendas_uniforme : PRENDAS_DEFAULT,
  );
  const [nuevaPrenda, setNuevaP] = useState('');

  const [torneos, setTorneos]   = useState(clubConfig?.torneos_iniciales || []);
  const [nuevoTorneo, setNuevoT] = useState({ nombre: '', fecha: '', valor: '' });

  const c = color;
  const currencyLabel = getCurrencyLabel(clubConfig?.codigo_pais || getCodigoPais());

  const saveAndFinish = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await fetch(`${API_BASE}/config?club_id=${getClubId()}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          valor_mensualidad:  mensualidad.valor,
          dias_gracia_mora:   mensualidad.dias_gracia,
          penalidad_mora:     mensualidad.penalidad,
          prendas_uniforme:   prendas,
          torneos_iniciales:  torneos,
          onboarding_completed: true,
        }),
      });
    } catch (_) {
      // Si falla el guardado igual cerramos — no bloquear al usuario
    } finally {
      setSaving(false);
      onComplete();
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else saveAndFinish();
  };

  const skip = () => saveAndFinish();

  /* ── Estilos base ─────────────────────────────────────────────────── */
  const overlay = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(4,6,12,0.85)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
  };
  const card = {
    background: '#0D1627', borderRadius: 20,
    border: `1px solid ${c}30`,
    boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 48px ${c}18`,
    width: '100%', maxWidth: 560,
    overflow: 'hidden',
    fontFamily: "'Inter', system-ui, sans-serif",
  };
  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '10px 14px',
    color: '#fff', fontSize: 14, outline: 'none',
  };

  const StepDot = ({ idx }) => (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: idx < step ? c : idx === step ? `${c}25` : 'rgba(255,255,255,0.05)',
      border: `2px solid ${idx <= step ? c : 'rgba(255,255,255,0.1)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700,
      color: idx < step ? '#fff' : idx === step ? c : '#4B5563',
      flexShrink: 0,
      transition: 'all 0.3s',
    }}>
      {idx < step ? '✓' : idx + 1}
    </div>
  );

  return (
    <div style={overlay}>
      <div style={card}>

        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${c}20` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                Configura tu club
              </h2>
              <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>
                Toma menos de 2 minutos · Puedes cambiarlo luego
              </p>
            </div>
            <button onClick={skip} style={{ background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', padding: 4 }} title="Saltar configuración">
              <X size={18} />
            </button>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
            {STEPS.slice(0, -1).map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < STEPS.length - 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StepDot idx={i} />
                  <span style={{ fontSize: 11, color: i === step ? c : '#4B5563', fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap', transition: 'color 0.3s' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 2 && <div style={{ flex: 1, height: 1, background: `${c}25`, minWidth: 20 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>

          {/* ── PASO 1: MENSUALIDAD ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ padding: '12px 16px', background: `${c}0E`, borderRadius: 12, border: `1px solid ${c}25` }}>
                <p style={{ color: c, fontSize: 12, fontWeight: 600, margin: 0, letterSpacing: 0.5 }}>
                  MENSUALIDAD Y MORA
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>
                  Valor de la cuota mensual ({currencyLabel})
                </label>
                <input
                  type="number"
                  value={mensualidad.valor}
                  onChange={e => setMensualidad(m => ({ ...m, valor: +e.target.value }))}
                  style={inp}
                  min={0}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>
                    Días de gracia antes de mora
                  </label>
                  <input
                    type="number"
                    value={mensualidad.dias_gracia}
                    onChange={e => setMensualidad(m => ({ ...m, dias_gracia: +e.target.value }))}
                    style={inp}
                    min={0} max={30}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>
                    Penalidad por mora ({currencyLabel})
                  </label>
                  <input
                    type="number"
                    value={mensualidad.penalidad}
                    onChange={e => setMensualidad(m => ({ ...m, penalidad: +e.target.value }))}
                    style={inp}
                    min={0}
                  />
                </div>
              </div>

              <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertTriangle size={14} color="#F59E0B" style={{ marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
                  La mora se aplica automáticamente cuando un jugador supera los días de gracia sin pagar.
                </p>
              </div>
            </div>
          )}

          {/* ── PASO 2: UNIFORMES ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '12px 16px', background: `${c}0E`, borderRadius: 12, border: `1px solid ${c}25` }}>
                <p style={{ color: c, fontSize: 12, fontWeight: 600, margin: 0, letterSpacing: 0.5 }}>
                  EQUIPAMIENTO DEL CLUB
                </p>
                <p style={{ color: '#6B7280', fontSize: 12, margin: '4px 0 0' }}>
                  Define las prendas disponibles para pedidos de uniformes
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {prendas.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${c}12`, border: `1px solid ${c}30`, borderRadius: 20, padding: '5px 12px' }}>
                    <span style={{ fontSize: 13, color: c }}>{p}</span>
                    <button
                      onClick={() => setPrendas(ps => ps.filter(x => x !== p))}
                      style={{ background: 'none', border: 'none', color: `${c}80`, cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}
                    >×</button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={nuevaPrenda}
                  onChange={e => setNuevaP(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && nuevaPrenda.trim()) {
                      setPrendas(ps => [...ps, nuevaPrenda.trim()]);
                      setNuevaP('');
                    }
                  }}
                  placeholder="Agregar prenda... (Enter)"
                  style={{ ...inp, flex: 1 }}
                />
                <button
                  onClick={() => {
                    if (nuevaPrenda.trim()) {
                      setPrendas(ps => [...ps, nuevaPrenda.trim()]);
                      setNuevaP('');
                    }
                  }}
                  style={{ padding: '10px 16px', background: c, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 3: TORNEOS ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '12px 16px', background: `${c}0E`, borderRadius: 12, border: `1px solid ${c}25` }}>
                <p style={{ color: c, fontSize: 12, fontWeight: 600, margin: 0, letterSpacing: 0.5 }}>
                  TORNEOS Y COMPETENCIAS
                </p>
                <p style={{ color: '#6B7280', fontSize: 12, margin: '4px 0 0' }}>
                  Crea los torneos en los que participa tu club (puedes agregar más luego)
                </p>
              </div>

              {torneos.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Trophy size={14} color={c} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: '#D1D5DB' }}>{t.nombre}</span>
                  {t.fecha && <span style={{ fontSize: 11, color: '#6B7280' }}>{t.fecha}</span>}
                  {t.valor > 0 && <span style={{ fontSize: 11, color: c }}>${t.valor.toLocaleString('es-CO')}</span>}
                  <button
                    onClick={() => setTorneos(ts => ts.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', padding: 0 }}
                  ><X size={14} /></button>
                </div>
              ))}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
                <input
                  value={nuevoTorneo.nombre}
                  onChange={e => setNuevoT(t => ({ ...t, nombre: e.target.value }))}
                  placeholder="Nombre del torneo *"
                  style={inp}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input
                    type="date"
                    value={nuevoTorneo.fecha}
                    onChange={e => setNuevoT(t => ({ ...t, fecha: e.target.value }))}
                    style={{ ...inp, colorScheme: 'dark' }}
                  />
                  <input
                    type="number"
                    value={nuevoTorneo.valor}
                    onChange={e => setNuevoT(t => ({ ...t, valor: e.target.value }))}
                    placeholder={`Inscripción por jugador (${currencyLabel})`}
                    style={inp}
                    min={0}
                  />
                </div>
                <button
                  onClick={() => {
                    if (!nuevoTorneo.nombre.trim()) return;
                    setTorneos(ts => [...ts, { nombre: nuevoTorneo.nombre.trim(), fecha: nuevoTorneo.fecha, valor: +nuevoTorneo.valor || 0 }]);
                    setNuevoT({ nombre: '', fecha: '', valor: '' });
                  }}
                  style={{ padding: '9px', background: `${c}18`, border: `1px solid ${c}35`, borderRadius: 10, color: c, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  + Agregar torneo
                </button>
              </div>

              <p style={{ fontSize: 12, color: '#4B5563', margin: 0 }}>
                Este paso es opcional — puedes saltarlo y crear torneos desde el módulo de Arbitraje.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={skip}
            style={{ background: 'none', border: 'none', color: '#4B5563', fontSize: 13, cursor: 'pointer' }}
          >
            Saltar configuración
          </button>
          <button
            onClick={next}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: c, border: 'none', borderRadius: 12,
              color: '#fff', fontSize: 14, fontWeight: 700,
              padding: '11px 24px', cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: `0 4px 20px ${c}40`,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Guardando…' : step < STEPS.length - 2 ? (
              <><span>Siguiente</span><ChevronRight size={16} /></>
            ) : (
              <><CheckCircle size={15} /><span>Empezar</span></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
