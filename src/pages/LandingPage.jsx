import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, BarChart2, CreditCard, Shield, ChevronRight, CheckCircle } from 'lucide-react';
import { PALETA } from '../components/ThemeSelector';

const DEPORTES_STRIP = [
  { emoji: '⚽', label: 'Fútbol'         },
  { emoji: '🏀', label: 'Basketball'     },
  { emoji: '🏊', label: 'Natación'       },
  { emoji: '🚴', label: 'Ciclismo'       },
  { emoji: '🥊', label: 'Artes Marciales'},
  { emoji: '🏋️', label: 'Gimnasio'       },
  { emoji: '🎾', label: 'Tenis'          },
  { emoji: '🏐', label: 'Voleibol'       },
  { emoji: '🏊', label: 'Atletismo'      },
  { emoji: '🤸', label: 'Gimnasia'       },
];

const FEATURES = [
  {
    icon: Bot,
    color: 'var(--cc)',
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


const PAYMENT_LINKS = {
  starter: {
    wompi: 'https://checkout.wompi.co/l/STARTER_REF',
    mp:    'https://mpago.la/STARTER_REF',
  },
  pro: {
    wompi: 'https://checkout.wompi.co/l/PRO_REF',
    mp:    'https://mpago.la/PRO_REF',
  },
  total: {
    wompi: 'https://checkout.wompi.co/l/TOTAL_REF',
    mp:    'https://mpago.la/TOTAL_REF',
  },
};

/* ── Mini Dashboard Mockup ──────────────────────────────────────────────── */
function DashboardMockup({ color }) {
  return (
    <div style={{
      width: '100%', maxWidth: 460,
      borderRadius: 14,
      overflow: 'hidden',
      border: `1px solid ${color}45`,
      boxShadow: `0 24px 64px rgba(0,0,0,0.55), 0 0 48px ${color}18`,
      background: '#0A0A0A',
      transition: 'border-color 0.4s, box-shadow 0.4s',
      flexShrink: 0,
    }}>
      {/* Topbar */}
      <div style={{
        height: 46, background: 'rgba(16,16,16,0.98)',
        borderBottom: `1px solid ${color}35`,
        display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 10,
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${color}80, ${color}50, transparent)`, transition: 'background 0.4s' }} />
        {/* Shield */}
        <svg width="22" height="26" viewBox="0 0 22 26" fill="none" style={{ flexShrink: 0 }}>
          <path d="M11 1.5L2 5.5V13C2 19 6 23 11 24.5C16 23 20 19 20 13V5.5L11 1.5Z"
                fill="#161616" stroke={color} strokeWidth="1.3"/>
          <text x="11" y="16.5" textAnchor="middle" fill={color}
                fontFamily="'Bebas Neue',sans-serif" fontSize="6.5" letterSpacing="1">CFC</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontFamily: 'sans-serif', fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: 2 }}>MI CLUB FC</span>
          <span style={{ fontSize: 8, color: 'var(--text-mut)', letterSpacing: 1.5 }}>DEPORTIVO</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
        <span style={{ fontSize: 8, color: 'var(--text-mut)', letterSpacing: 1 }}>EN VIVO</span>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}18`, border: `1px solid ${color}40`, transition: 'all 0.4s' }} />
        <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}18`, border: `1px solid ${color}40`, transition: 'all 0.4s' }} />
      </div>

      {/* Body */}
      <div style={{ display: 'flex', height: 240 }}>
        {/* Sidebar */}
        <div style={{ width: 42, background: 'rgba(13,13,13,0.99)', borderRight: `1px solid ${color}18`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: 5, transition: 'border-color 0.4s' }}>
          {[true, false, false, false, false, false].map((active, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: 7, background: active ? `${color}1A` : 'transparent', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.4s' }}>
              {active && (
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2.5, height: 14, background: color, borderRadius: '0 2px 2px 0', boxShadow: `0 0 8px ${color}, 0 0 14px ${color}60`, transition: 'background 0.4s, box-shadow 0.4s' }} />
              )}
              <div style={{ width: 11, height: 11, borderRadius: 3, background: active ? color : '#2E2E2E', opacity: active ? 1 : 0.6, transition: 'background 0.4s' }} />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Jugadores', val: '24', c: color    },
              { label: 'Al día',    val: '18', c: '#22C55E'},
              { label: 'Morosos',   val: '6',  c: '#FF5E5E'},
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.c}28`, borderRadius: 8, padding: '7px 9px', transition: 'border-color 0.4s' }}>
                <div style={{ fontSize: 8.5, color: 'var(--text-mut)', marginBottom: 3, letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.c, lineHeight: 1, transition: 'color 0.4s' }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Table mock */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ height: 24, background: `${color}0E`, borderBottom: `1px solid ${color}22`, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.4s, border-color 0.4s' }}>
              <div style={{ width: 55, height: 5, borderRadius: 3, background: `${color}50`, transition: 'background 0.4s' }} />
              <div style={{ width: 35, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ flex: 1 }} />
              <div style={{ width: 28, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            {[
              { badge: '#22C55E', text: 'AL DÍA'  },
              { badge: color,     text: 'PRÓXIMO'  },
              { badge: '#FF5E5E', text: 'MOROSO'   },
              { badge: color,     text: 'PRÓXIMO'  },
            ].map((row, i) => (
              <div key={i} style={{ height: 24, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${row.badge}22`, border: `1px solid ${row.badge}50`, transition: 'all 0.4s' }} />
                <div style={{ width: 65, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.11)' }} />
                <div style={{ flex: 1 }} />
                <div style={{ padding: '2px 6px', borderRadius: 4, background: `${row.badge}18`, border: `1px solid ${row.badge}40`, fontSize: 7, color: row.badge, fontWeight: 700, letterSpacing: 0.5, transition: 'all 0.4s' }}>
                  {row.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Payment buttons ────────────────────────────────────────────────────── */
const isPlaceholder = (href) => !href || href.includes('_REF') || href.includes('STARTER') || href.includes('PRO_REF') || href.includes('TOTAL');

function WompiBtn({ href }) {
  if (isPlaceholder(href)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 700, cursor: 'not-allowed' }}>
        Wompi — Próximamente
      </div>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', borderRadius: 10, background: 'rgba(255,94,37,0.10)', border: '1px solid rgba(255,94,37,0.35)', color: '#FF5E25', fontSize: 13, fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>
      <svg width="56" height="16" viewBox="0 0 56 16" fill="none"><text x="0" y="13" fontFamily="'Inter',system-ui,sans-serif" fontSize="13" fontWeight="800" fill="#FF5E25">Wompi</text></svg>
    </a>
  );
}

function MercadoPagoBtn({ href }) {
  if (isPlaceholder(href)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 700, cursor: 'not-allowed' }}>
        Mercado Pago — Próximamente
      </div>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', borderRadius: 10, background: 'rgba(0,158,227,0.10)', border: '1px solid rgba(0,158,227,0.35)', color: '#009EE3', fontSize: 13, fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>
      <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" fill="#009EE3"/><text x="16" y="21" textAnchor="middle" fontFamily="Arial" fontSize="13" fontWeight="900" fill="#fff">MP</text></svg>
      Mercado Pago
    </a>
  );
}

function PaymentDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 12px' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      <span style={{ fontSize: 11, color: 'var(--text-mut)', letterSpacing: 1, whiteSpace: 'nowrap' }}>O PAGA DIRECTAMENTE</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [previewColor, setPreviewColor] = useState(PALETA[0].hex);

  useEffect(() => { document.title = 'ClubContable — Landing'; }, []);

  const colorActivo = PALETA.find(p => p.hex === previewColor) || PALETA[0];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#0E1B2D', minHeight: '100vh', color: '#fff' }}>

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: '1px solid rgba(0,170,255,0.12)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', fontSize: 14, cursor: 'pointer', padding: '6px 12px' }}>
            Iniciar sesión
          </button>
          <button onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)} style={{ background: previewColor, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 8, padding: '8px 18px', cursor: 'pointer', transition: 'background 0.3s' }}>
            Registrar mi club
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '80px 24px 48px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.25)', borderRadius: 999, padding: '4px 14px', fontSize: 12, color: 'var(--cc)', fontWeight: 600, marginBottom: 20, letterSpacing: 0.5 }}>
          🏅 5 días gratis · Sin tarjeta de crédito
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1px' }}>
          Gestiona tu club deportivo<br />
          <span style={{ color: 'var(--cc)' }}>como un profesional</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
          Cobros automáticos por WhatsApp, control de mora, carnet digital y más.<br />
          Todo en un solo panel, sin hojas de cálculo.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: previewColor, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 12, padding: '14px 28px', cursor: 'pointer', boxShadow: `0 4px 24px ${previewColor}55`, transition: 'all 0.3s' }}>
            Probar 5 días gratis <ChevronRight size={16} />
          </button>
          <button onClick={() => navigate('/login')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, borderRadius: 12, padding: '14px 28px', cursor: 'pointer' }}>
            Ya tengo cuenta
          </button>
        </div>
      </section>

      {/* ── DEPORTES ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 64px', maxWidth: 900, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', color: 'var(--text-mut)', fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
          Funciona para cualquier disciplina
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {DEPORTES_STRIP.map(d => (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 999, padding: '7px 14px', fontSize: 13, color: 'var(--text-sec)' }}>
              <span style={{ fontSize: 16 }}>{d.emoji}</span>
              {d.label}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,170,255,0.07)', border: '1px solid rgba(0,170,255,0.18)', borderRadius: 999, padding: '7px 14px', fontSize: 13, color: 'var(--cc)' }}>
            + cualquier deporte con afiliados
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '24px 20px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PALETA DE COLORES ────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>La interfaz con los colores de tu club</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 15, margin: 0 }}>
            Elige tu color al registrarte. Toda la app adopta tu identidad visual.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 52, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>

          {/* Swatches + nombre */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 46px)', gap: 10 }}>
              {PALETA.map(p => (
                <button
                  key={p.hex}
                  onClick={() => setPreviewColor(p.hex)}
                  title={p.nombre}
                  style={{
                    width: 46, height: 46,
                    borderRadius: 11,
                    background: p.hex,
                    border: previewColor === p.hex ? '2.5px solid #fff' : '2.5px solid transparent',
                    boxShadow: previewColor === p.hex
                      ? `0 0 0 2px ${p.hex}, 0 0 18px ${p.hex}90`
                      : `0 2px 8px ${p.hex}40`,
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                    transform: previewColor === p.hex ? 'scale(1.12)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            {/* Nombre del color activo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: previewColor, boxShadow: `0 0 12px ${previewColor}80`, transition: 'all 0.3s', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: previewColor, transition: 'color 0.3s' }}>{colorActivo.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text-mut)', letterSpacing: 1 }}>{previewColor.toUpperCase()}</div>
              </div>
            </div>

            <p style={{ color: 'var(--text-mut)', fontSize: 12, lineHeight: 1.6, maxWidth: 290, margin: 0 }}>
              El color se aplica al escudo, barras de navegación, indicadores y acentos.<br />
              Puedes cambiarlo desde configuración en cualquier momento.
            </p>
          </div>

          {/* Mini dashboard */}
          <DashboardMockup color={previewColor} />
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>Activa solo lo que necesitas</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 15, margin: 0 }}>
            3 planes modulares · 5 días gratis · Sin permanencia
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'start' }}>

          {/* STARTER */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: '28px 24px' }}>
            <p style={{ color: 'var(--text-sec)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Starter</p>
            <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>$59.000<span style={{ fontSize: 14, color: 'var(--text-sec)', fontWeight: 400 }}>/mes</span></div>
            <p style={{ color: 'var(--text-sec)', fontSize: 13, marginBottom: 24 }}>Para clubes que están empezando a organizarse</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
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
            <button onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 10, padding: '12px 0', cursor: 'pointer' }}>
              Probar 5 días gratis
            </button>
            <PaymentDivider />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <WompiBtn href={PAYMENT_LINKS.starter.wompi} />
              <MercadoPagoBtn href={PAYMENT_LINKS.starter.mp} />
            </div>
          </div>

          {/* PRO */}
          <div style={{ background: 'rgba(0,170,255,0.06)', border: '2px solid rgba(0,170,255,0.35)', borderRadius: 20, padding: '28px 24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--cc)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '4px 14px', letterSpacing: 1, whiteSpace: 'nowrap' }}>
              ★ MÁS POPULAR
            </div>
            <p style={{ color: 'var(--cc)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Pro</p>
            <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>$99.000<span style={{ fontSize: 14, color: 'var(--text-sec)', fontWeight: 400 }}>/mes</span></div>
            <p style={{ color: 'var(--text-sec)', fontSize: 13, marginBottom: 24 }}>Cobro automático por WhatsApp incluido</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
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
            <button onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)} style={{ width: '100%', background: previewColor, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 10, padding: '12px 0', cursor: 'pointer', boxShadow: `0 4px 20px ${previewColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.3s' }}>
              Probar 5 días gratis <ChevronRight size={15} />
            </button>
            <PaymentDivider />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <WompiBtn href={PAYMENT_LINKS.pro.wompi} />
              <MercadoPagoBtn href={PAYMENT_LINKS.pro.mp} />
            </div>
          </div>

          {/* TOTAL */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: '28px 24px' }}>
            <p style={{ color: '#C678FF', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Total</p>
            <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>$149.000<span style={{ fontSize: 14, color: 'var(--text-sec)', fontWeight: 400 }}>/mes</span></div>
            <p style={{ color: 'var(--text-sec)', fontSize: 13, marginBottom: 24 }}>Acceso completo a todos los módulos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
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
                  <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>{label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)} style={{ width: '100%', background: 'rgba(198,120,255,0.12)', border: '1px solid rgba(198,120,255,0.35)', color: '#C678FF', fontSize: 14, fontWeight: 700, borderRadius: 10, padding: '12px 0', cursor: 'pointer' }}>
              Probar 5 días gratis
            </button>
            <PaymentDivider />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <WompiBtn href={PAYMENT_LINKS.total.wompi} />
              <MercadoPagoBtn href={PAYMENT_LINKS.total.mp} />
            </div>
          </div>

        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-mut)', fontSize: 13, marginTop: 28 }}>
          Todos los planes incluyen soporte por WhatsApp · Cancela cuando quieras
        </p>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-mut)', fontSize: 13, margin: '0 0 6px' }}>
          ClubContable · Gestión deportiva para toda América Latina 🏅
        </p>
        <p style={{ color: '#2A3A4A', fontSize: 12, margin: '0 0 14px', letterSpacing: 0.5 }}>
          Creado por{' '}
          <span style={{ color: '#3B82F6', fontWeight: 700 }}>Zenpra</span>
        </p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', fontSize: 13, cursor: 'pointer' }}>Iniciar sesión</button>
          <button onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', fontSize: 13, cursor: 'pointer' }}>Registrar club</button>
        </div>
      </footer>
    </div>
  );
}
