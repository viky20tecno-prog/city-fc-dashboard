import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, BarChart2, CreditCard, Shield, ChevronRight, CheckCircle,
  Users, FileText, Smartphone, AlertTriangle, Zap, MessageCircle, QrCode,
} from 'lucide-react';
import { PALETA } from '../components/ThemeSelector';

const DEPORTES_STRIP = [
  { emoji: '⚽', label: 'Fútbol'          },
  { emoji: '🏀', label: 'Basketball'      },
  { emoji: '🏊', label: 'Natación'        },
  { emoji: '🚴', label: 'Ciclismo'        },
  { emoji: '🥊', label: 'Artes Marciales' },
  { emoji: '🏋️', label: 'Gimnasio'        },
  { emoji: '🎾', label: 'Tenis'           },
  { emoji: '🏐', label: 'Voleibol'        },
  { emoji: '🤸', label: 'Gimnasia'        },
];

const FEATURES = [
  {
    icon: Bot,
    color: 'var(--cc)',
    title: 'Automatización por WhatsApp',
    desc: 'Cobros preventivos, confirmaciones de inscripción y recordatorios enviados automáticamente. Cero intervención manual.',
  },
  {
    icon: Users,
    color: '#00D084',
    title: 'Inscripciones y registros digitales',
    desc: 'Formularios inteligentes, validación automática y perfiles completos para cada jugador inscrito.',
  },
  {
    icon: CreditCard,
    color: '#F5A623',
    title: 'Pagos, QR y comprobantes',
    desc: 'Recibe pagos, genera QR de validación y aprueba comprobantes desde un panel centralizado.',
  },
  {
    icon: Shield,
    color: '#C678FF',
    title: 'Carnet y perfil digital',
    desc: 'Perfil completo con foto, historial médico y carnet imprimible. Experiencia premium para cada miembro.',
  },
];

const PAIN_POINTS = [
  { icon: FileText,       label: 'Formularios manuales en papel o Excel'         },
  { icon: MessageCircle,  label: 'Pagos recibidos por WhatsApp sin registro'      },
  { icon: AlertTriangle,  label: 'Información desordenada o perdida'              },
  { icon: Users,          label: 'Inscripciones sin validación centralizada'      },
  { icon: Smartphone,     label: 'Mala experiencia desde celular'                 },
  { icon: BarChart2,      label: 'Sin visibilidad del estado de pagos'            },
];

const PAYMENT_LINKS = {
  starter: { wompi: 'https://checkout.wompi.co/l/STARTER_REF', mp: 'https://mpago.la/STARTER_REF' },
  pro:     { wompi: 'https://checkout.wompi.co/l/PRO_REF',     mp: 'https://mpago.la/PRO_REF'     },
  total:   { wompi: 'https://checkout.wompi.co/l/TOTAL_REF',   mp: 'https://mpago.la/TOTAL_REF'   },
};

/* ── Dashboard Mockup ───────────────────────────────────────────────────── */
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
      <div style={{
        height: 46, background: 'rgba(16,16,16,0.98)',
        borderBottom: `1px solid ${color}35`,
        display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 10,
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${color}80, ${color}50, transparent)`, transition: 'background 0.4s' }} />
        <svg width="22" height="26" viewBox="0 0 22 26" fill="none" style={{ flexShrink: 0 }}>
          <path d="M11 1.5L2 5.5V13C2 19 6 23 11 24.5C16 23 20 19 20 13V5.5L11 1.5Z"
                fill="#161616" stroke={color} strokeWidth="1.3"/>
          <text x="11" y="16.5" textAnchor="middle" fill={color}
                fontFamily="'Bebas Neue',sans-serif" fontSize="6.5" letterSpacing="1">ZS</text>
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
      <div style={{ display: 'flex', height: 240 }}>
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
        <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Inscritos', val: '24', c: color     },
              { label: 'Al día',    val: '18', c: '#22C55E' },
              { label: 'Pendiente', val: '6',  c: '#FF5E5E' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.c}28`, borderRadius: 8, padding: '7px 9px', transition: 'border-color 0.4s' }}>
                <div style={{ fontSize: 8.5, color: 'var(--text-mut)', marginBottom: 3, letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.c, lineHeight: 1, transition: 'color 0.4s' }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: 24, background: `${color}0E`, borderBottom: `1px solid ${color}22`, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.4s, border-color 0.4s' }}>
              <div style={{ width: 55, height: 5, borderRadius: 3, background: `${color}50`, transition: 'background 0.4s' }} />
              <div style={{ width: 35, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ flex: 1 }} />
              <div style={{ width: 28, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            {[
              { badge: '#22C55E', text: 'CONFIRMADO' },
              { badge: color,     text: 'PENDIENTE'  },
              { badge: '#FF5E5E', text: 'VENCIDO'    },
              { badge: color,     text: 'PENDIENTE'  },
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

/* ── WhatsApp / IA Mockup ────────────────────────────────────────────────── */
function WhatsAppMockup() {
  const msgs = [
    { from: 'bot',  text: '👋 Hola Carlos, tu inscripción al club está lista.' },
    { from: 'bot',  text: 'Tu pago de $60.000 está pendiente. Adjunta tu comprobante aquí.' },
    { from: 'user', text: '[Comprobante adjunto]' },
    { from: 'bot',  text: '✅ Pago validado. Tu carnet digital ya está disponible.' },
    { from: 'user', text: '¿Ya quedó confirmado mi cupo?' },
    { from: 'bot',  text: '✅ Sí. Tu inscripción fue confirmada correctamente. ¡Bienvenido!' },
  ];
  return (
    <div style={{
      width: '100%', maxWidth: 320, flexShrink: 0,
      borderRadius: 18, overflow: 'hidden',
      border: '1px solid rgba(37,211,102,0.25)',
      boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 60px rgba(37,211,102,0.07)',
      background: '#0A0A0A',
    }}>
      <div style={{ background: '#111', borderBottom: '1px solid rgba(37,211,102,0.18)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={17} color="#25D366" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>ZenSports IA</div>
          <div style={{ fontSize: 10, color: '#25D366', letterSpacing: 0.5 }}>● en línea</div>
        </div>
      </div>
      <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8, background: '#0D0D0D', minHeight: 260 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%',
              padding: '8px 12px',
              borderRadius: m.from === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: m.from === 'user' ? 'rgba(37,211,102,0.12)' : 'rgba(255,255,255,0.06)',
              border: m.from === 'user' ? '1px solid rgba(37,211,102,0.28)' : '1px solid rgba(255,255,255,0.09)',
              fontSize: 12, color: m.from === 'user' ? '#4ADE80' : '#D1D5DB', lineHeight: 1.55,
            }}>
              {m.text}
            </div>
          </div>
        ))}
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

  useEffect(() => { document.title = 'ZenSports — Gestión Deportiva'; }, []);

  const colorActivo = PALETA.find(p => p.hex === previewColor) || PALETA[0];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#080C14', minHeight: '100vh', color: '#fff' }}>

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <nav style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 1100, margin: '0 auto', width: '100%',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,12,20,0.92)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.5px' }}>ZenSports</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', fontSize: 14, cursor: 'pointer', padding: '6px 12px' }}>
            Iniciar sesión
          </button>
          <button onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)} style={{ background: previewColor, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 8, padding: '8px 18px', cursor: 'pointer', transition: 'background 0.3s' }}>
            Registrar mi club
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '88px 24px 56px', maxWidth: 780, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,170,255,0.08)', border: '1px solid rgba(0,170,255,0.22)', borderRadius: 999, padding: '4px 16px', fontSize: 12, color: 'var(--cc)', fontWeight: 600, marginBottom: 24, letterSpacing: 0.5 }}>
          🏅 5 días gratis · Sin tarjeta de crédito
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 6vw, 58px)', fontWeight: 800, lineHeight: 1.08, marginBottom: 22, letterSpacing: '-1.5px' }}>
          La plataforma moderna para{' '}
          <span style={{ color: 'var(--cc)' }}>inscripción deportiva</span>{' '}
          y pagos
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-sec)', lineHeight: 1.65, marginBottom: 38, maxWidth: 560, margin: '0 auto 38px' }}>
          Centraliza registros, pagos, validaciones y comunicación con jugadores desde una sola experiencia profesional y automatizada.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: previewColor, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 12, padding: '14px 28px', cursor: 'pointer', boxShadow: `0 4px 28px ${previewColor}55`, transition: 'all 0.3s' }}
          >
            Probar gratis <ChevronRight size={16} />
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, borderRadius: 12, padding: '14px 28px', cursor: 'pointer' }}
          >
            Ya tengo cuenta
          </button>
        </div>
      </section>

      {/* ── DEPORTES ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 72px', maxWidth: 900, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', color: 'var(--text-mut)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 18 }}>
          Funciona para cualquier disciplina
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {DEPORTES_STRIP.map(d => (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 999, padding: '7px 14px', fontSize: 13, color: 'var(--text-sec)' }}>
              <span style={{ fontSize: 15 }}>{d.emoji}</span>
              {d.label}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,170,255,0.06)', border: '1px solid rgba(0,170,255,0.16)', borderRadius: 999, padding: '7px 14px', fontSize: 13, color: 'var(--cc)' }}>
            + cualquier deporte con afiliados
          </div>
        </div>
      </section>

      {/* ── PROBLEMAS ────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ color: 'var(--text-mut)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>El problema</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.5px' }}>
            Administrar inscripciones deportivas<br />no debería ser un caos.
          </h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 15, margin: 0 }}>Así se ve la realidad de la mayoría de clubes hoy.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {PAIN_POINTS.map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,94,94,0.04)', border: '1px solid rgba(255,94,94,0.14)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,94,94,0.10)', border: '1px solid rgba(255,94,94,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color="#FF5E5E" />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.4 }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ color: 'var(--text-mut)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>La solución</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: 10, letterSpacing: '-0.5px' }}>
            ZenSports automatiza toda la experiencia.
          </h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 15, margin: 0 }}>
            Desde la inscripción hasta el cobro, sin procesos manuales.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px 20px' }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── IA / WHATSAPP ─────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 56, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <WhatsAppMockup />
          <div style={{ maxWidth: 460, flexShrink: 0 }}>
            <p style={{ color: 'var(--text-mut)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>IA + Automatización</p>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 20, letterSpacing: '-0.5px' }}>
              Tu asistente virtual trabaja 24/7 por ti.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-sec)', lineHeight: 1.7, marginBottom: 28 }}>
              ZenSports responde preguntas, confirma pagos, valida inscripciones y envía recordatorios automáticamente por WhatsApp.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Confirmación automática de inscripciones',
                'Validación inteligente de comprobantes',
                'Recordatorios de pago sin intervención',
                'Respuestas instantáneas a consultas frecuentes',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircle size={16} color="#25D366" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: 'var(--text-sec)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PALETA DE COLORES ─────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ color: 'var(--text-mut)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>Personalización</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: 10, letterSpacing: '-0.5px' }}>La interfaz con los colores de tu club.</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 15, margin: 0 }}>
            Elige tu color al registrarte. Toda la app adopta tu identidad visual.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 52, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 46px)', gap: 10 }}>
              {PALETA.map(p => (
                <button
                  key={p.hex}
                  onClick={() => setPreviewColor(p.hex)}
                  title={p.nombre}
                  style={{
                    width: 46, height: 46, borderRadius: 11, background: p.hex,
                    border: previewColor === p.hex ? '2.5px solid #fff' : '2.5px solid transparent',
                    boxShadow: previewColor === p.hex ? `0 0 0 2px ${p.hex}, 0 0 18px ${p.hex}90` : `0 2px 8px ${p.hex}40`,
                    cursor: 'pointer', transition: 'all 0.25s',
                    transform: previewColor === p.hex ? 'scale(1.12)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
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
          <DashboardMockup color={previewColor} />
        </div>
      </section>

      {/* ── ZCUP ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          borderRadius: 20,
          padding: '40px 40px',
          background: 'linear-gradient(135deg, rgba(198,120,255,0.06) 0%, rgba(0,170,255,0.06) 100%)',
          border: '1px solid rgba(198,120,255,0.22)',
          display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{ display: 'inline-block', background: 'rgba(198,120,255,0.12)', border: '1px solid rgba(198,120,255,0.3)', borderRadius: 999, padding: '3px 12px', fontSize: 11, color: '#C678FF', fontWeight: 700, letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' }}>
              Plataforma hermana
            </div>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, marginBottom: 12, lineHeight: 1.2, letterSpacing: '-0.5px' }}>
              ¿Necesitas administración completa de torneos?
            </h2>
            <p style={{ color: 'var(--text-sec)', fontSize: 14, lineHeight: 1.7, marginBottom: 0 }}>
              <strong style={{ color: '#C678FF' }}>ZCUP</strong> es la plataforma especializada en fixtures, tablas de posiciones, programación de partidos, arbitraje y control competitivo de campeonatos.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            {['Fixtures y tablas de posiciones', 'Programación de partidos', 'Control de arbitraje', 'Resultados en tiempo real'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C678FF', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>{f}</span>
              </div>
            ))}
            <button style={{ marginTop: 8, background: 'rgba(198,120,255,0.12)', border: '1px solid rgba(198,120,255,0.35)', color: '#C678FF', fontSize: 13, fontWeight: 700, borderRadius: 10, padding: '10px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              Conocer ZCUP <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
          {[
            { num: '+3.000', label: 'registros procesados',    color: 'var(--cc)' },
            { num: '+500',   label: 'pagos gestionados',       color: '#00D084'   },
            { num: '95%',    label: 'menos trabajo manual',    color: '#F5A623'   },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '36px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
              <div style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 10, letterSpacing: '-1px' }}>{s.num}</div>
              <div style={{ fontSize: 14, color: 'var(--text-sec)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ color: 'var(--text-mut)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>Planes</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: 10, letterSpacing: '-0.5px' }}>Activa solo lo que necesitas.</h2>
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
                [false, 'Inscripciones digitales'],
                [false, 'Uniformes y equipamiento'],
                [false, 'Estadísticas avanzadas'],
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
            <p style={{ color: 'var(--text-sec)', fontSize: 13, marginBottom: 24 }}>Automatización completa de inscripciones y pagos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                [true,  'Dashboard y reportes'],
                [true,  'Gestión de miembros'],
                [true,  'Pagos manuales y mora'],
                [true,  'Carnet digital'],
                [true,  'WhatsApp Bot automático'],
                [true,  'Inscripciones digitales'],
                [false, 'Uniformes y equipamiento'],
                [false, 'Estadísticas avanzadas'],
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
                'Dashboard y reportes',
                'Gestión de miembros',
                'Pagos manuales y mora',
                'Carnet digital',
                'WhatsApp Bot automático',
                'Inscripciones digitales',
                'Uniformes y equipamiento',
                'Estadísticas avanzadas',
              ].map(label => (
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

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          borderRadius: 24,
          padding: '64px 40px',
          background: 'linear-gradient(135deg, rgba(0,170,255,0.07) 0%, rgba(0,208,132,0.07) 100%)',
          border: '1px solid rgba(0,170,255,0.18)',
        }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-1px' }}>
            Moderniza la experiencia deportiva<br />de tu organización.
          </h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 16, lineHeight: 1.65, marginBottom: 36 }}>
            Únete a los clubes que ya gestionan inscripciones y pagos de forma profesional.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: previewColor, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 12, padding: '14px 32px', cursor: 'pointer', boxShadow: `0 4px 28px ${previewColor}55`, transition: 'all 0.3s' }}
            >
              Solicitar Demo <ChevronRight size={16} />
            </button>
            <button
              onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 15, borderRadius: 12, padding: '14px 28px', cursor: 'pointer' }}
            >
              Probar gratis
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--cc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={13} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px' }}>ZenSports</span>
        </div>
        <p style={{ color: 'var(--text-mut)', fontSize: 13, margin: '0 0 6px' }}>
          Gestión deportiva para toda América Latina 🏅
        </p>
        <p style={{ color: '#2A3A4A', fontSize: 12, margin: '0 0 18px', letterSpacing: 0.5 }}>
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
