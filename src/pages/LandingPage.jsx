import { useNavigate } from 'react-router-dom';
import { Bot, BarChart2, CreditCard, Shield, ChevronRight, CheckCircle } from 'lucide-react';

const DEPORTES_STRIP = [
  { emoji: '⚽', label: 'Fútbol'        },
  { emoji: '🏀', label: 'Basketball'    },
  { emoji: '🏊', label: 'Natación'      },
  { emoji: '🚴', label: 'Ciclismo'      },
  { emoji: '🥊', label: 'Artes Marciales'},
  { emoji: '🏋️', label: 'Gimnasio'      },
  { emoji: '🎾', label: 'Tenis'         },
  { emoji: '🏐', label: 'Voleibol'      },
  { emoji: '🏊', label: 'Atletismo'     },
  { emoji: '🤸', label: 'Gimnasia'      },
];

const FEATURES = [
  {
    icon: Bot,
    color: '#00AAFF',
    title: 'Cobros automáticos por WhatsApp',
    desc: 'Avisos preventivos, recordatorios y alertas de mora enviados automáticamente. Sin llamar a nadie.',
  },
  {
    icon: BarChart2,
    color: '#00D084',
    title: 'Control financiero en tiempo real',
    desc: 'Mensualidades, equipamiento y eventos en un solo panel. Aprueba comprobantes con un clic.',
  },
  {
    icon: CreditCard,
    color: '#F5A623',
    title: 'Carnet y perfil digital',
    desc: 'Perfil completo con foto, historial médico y carnet imprimible para cada miembro del club.',
  },
  {
    icon: Shield,
    color: '#C678FF',
    title: 'Multi-club y seguro',
    desc: 'Cada club gestiona sus datos de forma independiente. Acceso protegido con autenticación segura.',
  },
];


export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#060C18', minHeight: '100vh', color: '#fff' }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: '1px solid rgba(0,170,255,0.12)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,170,255,0.15)', border: '1px solid rgba(0,170,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/10894351.png" alt="Logo" style={{ width: 20, height: 20, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.3px' }}>ClubContable</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 14, cursor: 'pointer', padding: '6px 12px' }}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => navigate('/registro')}
            style={{ background: '#00AAFF', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 8, padding: '8px 18px', cursor: 'pointer' }}
          >
            Registrar mi club
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '80px 24px 48px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.25)', borderRadius: 999, padding: '4px 14px', fontSize: 12, color: '#00AAFF', fontWeight: 600, marginBottom: 20, letterSpacing: 0.5 }}>
          🏅 14 días gratis · Sin tarjeta de crédito
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1px' }}>
          Gestiona tu club deportivo<br />
          <span style={{ color: '#00AAFF' }}>como un profesional</span>
        </h1>
        <p style={{ fontSize: 18, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
          Cobros automáticos por WhatsApp, control de mora, carnet digital y más.<br />
          Todo en un solo panel, sin hojas de cálculo.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/registro')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#00AAFF', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 12, padding: '14px 28px', cursor: 'pointer' }}
          >
            Probar 14 días gratis <ChevronRight size={16} />
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, borderRadius: 12, padding: '14px 28px', cursor: 'pointer' }}
          >
            Ya tengo cuenta
          </button>
        </div>
      </section>

      {/* ── STRIP DE DEPORTES ──────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 64px', maxWidth: 900, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', color: '#4B5563', fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
          Funciona para cualquier disciplina
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {DEPORTES_STRIP.map(d => (
            <div key={d.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 999,
              padding: '7px 14px',
              fontSize: 13, color: '#9CA3AF',
            }}>
              <span style={{ fontSize: 16 }}>{d.emoji}</span>
              {d.label}
            </div>
          ))}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,170,255,0.06)',
            border: '1px solid rgba(0,170,255,0.15)',
            borderRadius: 999,
            padding: '7px 14px',
            fontSize: 13, color: '#00AAFF',
          }}>
            + cualquier deporte con afiliados
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px 20px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
              <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>Activa solo lo que necesitas</h2>
          <p style={{ color: '#9CA3AF', fontSize: 15, margin: 0 }}>
            3 planes modulares · 14 días gratis · Sin permanencia
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'start' }}>

          {/* ── STARTER ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 24px' }}>
            <p style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Starter</p>
            <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>$59.000<span style={{ fontSize: 14, color: '#6B7280', fontWeight: 400 }}>/mes</span></div>
            <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>Para clubes que están empezando a organizarse</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {[
                [true,  'Dashboard y reportes'],
                [true,  'Gestión de miembros'],
                [true,  'Pagos manuales y mora'],
                [true,  'Carnet digital'],
                [false, 'WhatsApp Bot automático'],
                [false, 'Conciliación de pagos'],
                [false, 'Uniformes y equipamiento'],
                [false, 'Arbitraje y partidos'],
              ].map(([on, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: on ? 1 : 0.35 }}>
                  <CheckCircle size={14} color={on ? '#00D084' : '#4B5563'} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: on ? '#D1D5DB' : '#6B7280' }}>{label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/registro')} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 10, padding: '12px 0', cursor: 'pointer' }}>
              Comenzar
            </button>
          </div>

          {/* ── PRO ── */}
          <div style={{ background: 'rgba(0,170,255,0.06)', border: '2px solid rgba(0,170,255,0.35)', borderRadius: 20, padding: '28px 24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#00AAFF', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '4px 14px', letterSpacing: 1, whiteSpace: 'nowrap' }}>
              ★ MÁS POPULAR
            </div>
            <p style={{ color: '#00AAFF', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Pro</p>
            <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>$99.000<span style={{ fontSize: 14, color: '#6B7280', fontWeight: 400 }}>/mes</span></div>
            <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>Cobro automático por WhatsApp incluido</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {[
                [true,  'Dashboard y reportes'],
                [true,  'Gestión de miembros'],
                [true,  'Pagos manuales y mora'],
                [true,  'Carnet digital'],
                [true,  'WhatsApp Bot automático'],
                [true,  'Conciliación de pagos'],
                [false, 'Uniformes y equipamiento'],
                [false, 'Arbitraje y partidos'],
              ].map(([on, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: on ? 1 : 0.35 }}>
                  <CheckCircle size={14} color={on ? '#00D084' : '#4B5563'} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: on ? '#D1D5DB' : '#6B7280' }}>{label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/registro')} style={{ width: '100%', background: '#00AAFF', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 10, padding: '12px 0', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,170,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Probar gratis 14 días <ChevronRight size={15} />
            </button>
          </div>

          {/* ── TOTAL ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 24px' }}>
            <p style={{ color: '#C678FF', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Total</p>
            <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>$149.000<span style={{ fontSize: 14, color: '#6B7280', fontWeight: 400 }}>/mes</span></div>
            <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>Acceso completo a todos los módulos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {[
                [true, 'Dashboard y reportes'],
                [true, 'Gestión de miembros'],
                [true, 'Pagos manuales y mora'],
                [true, 'Carnet digital'],
                [true, 'WhatsApp Bot automático'],
                [true, 'Conciliación de pagos'],
                [true, 'Uniformes y equipamiento'],
                [true, 'Arbitraje y partidos'],
              ].map(([on, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={14} color="#00D084" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#D1D5DB' }}>{label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/registro')} style={{ width: '100%', background: 'rgba(198,120,255,0.12)', border: '1px solid rgba(198,120,255,0.35)', color: '#C678FF', fontSize: 14, fontWeight: 700, borderRadius: 10, padding: '12px 0', cursor: 'pointer' }}>
              Comenzar
            </button>
          </div>

        </div>

        <p style={{ textAlign: 'center', color: '#4B5563', fontSize: 13, marginTop: 28 }}>
          Todos los planes incluyen soporte por WhatsApp · Cancela cuando quieras
        </p>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center', color: '#4B5563', fontSize: 13 }}>
        <p>ClubContable · Gestión deportiva para toda América Latina 🏅</p>
        <div style={{ marginTop: 8, display: 'flex', gap: 20, justifyContent: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>Iniciar sesión</button>
          <button onClick={() => navigate('/registro')} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>Registrar club</button>
        </div>
      </footer>
    </div>
  );
}
