import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, BarChart2, CreditCard, Shield, ChevronRight, CheckCircle,
  Users, FileText, Smartphone, AlertTriangle, Zap, MessageCircle,
  ArrowRight, Sparkles, TrendingUp, Star,
} from 'lucide-react';
import { PALETA } from '../components/ThemeSelector';

/* ── Scroll Reveal Hook ─────────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ── RevealSection ──────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Mouse Glow (DOM directo — sin re-renders) ──────────────────────────── */
function useMouseGlow() {
  const glowRef = useRef(null);
  const onMove = useCallback(e => {
    const el = glowRef.current;
    if (!el) return;
    const rect = el.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - 200;
    const y = e.clientY - rect.top - 200;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.opacity = '1';
  }, []);
  const onLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.opacity = '0';
  }, []);
  return { glowRef, onMove, onLeave };
}

/* ── Animated Counter ────────────────────────────────────────────────────── */
function Counter({ target, prefix = '', suffix = '' }) {
  const [ref, visible] = useReveal();
  const [val, setVal] = useState(0);
  const targetNum = parseInt(target.replace(/\D/g, ''), 10);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(targetNum / 60);
    const id = setInterval(() => {
      start = Math.min(start + step, targetNum);
      setVal(start);
      if (start >= targetNum) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [visible, targetNum]);
  const display = targetNum >= 1000 ? `${Math.round(val / 100) / 10}k`.replace('.0k', 'k') : `${val}`;
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

/* ── Live Activity Feed ──────────────────────────────────────────────────── */
const ACTIVITY = [
  { icon: '✅', text: 'Pago confirmado — Club Atlético Verde', time: 'hace 2 min' },
  { icon: '👤', text: 'Nuevo jugador inscrito — FC Medellín Sur', time: 'hace 5 min' },
  { icon: '🪪', text: 'QR de carnet generado — Deportivo Norte', time: 'hace 8 min' },
  { icon: '💬', text: 'WhatsApp enviado — Pago pendiente × 3', time: 'hace 11 min' },
  { icon: '✅', text: 'Inscripción validada — Barranquilla FC', time: 'hace 14 min' },
];

function ActivityFeed() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % ACTIVITY.length), 3000);
    return () => clearInterval(id);
  }, []);
  const item = ACTIVITY[idx];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 999, padding: '8px 18px',
      backdropFilter: 'blur(10px)', maxWidth: '100%',
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
        <span style={{ fontSize: 14, marginRight: 4 }}>{item.icon}</span>
        {item.text}
      </span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{item.time}</span>
    </div>
  );
}

/* ── AnimatedGrid Background ─────────────────────────────────────────────── */
function GridBg({ color }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.045 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: `radial-gradient(ellipse at center, ${color}18 0%, transparent 70%)`, filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', top: '5%', right: '-10%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(0,208,132,0.06) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: 350, height: 350, background: `radial-gradient(ellipse, ${color}08 0%, transparent 70%)` }} />
    </div>
  );
}

/* ── Dashboard Mockup ─────────────────────────────────────────────────────── */
function DashboardMockup({ color }) {
  return (
    <div style={{
      width: '100%', maxWidth: 460,
      borderRadius: 16, overflow: 'hidden',
      border: `1px solid ${color}40`,
      boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 60px ${color}15`,
      background: '#0A0A0A', flexShrink: 0,
      transition: 'border-color 0.4s, box-shadow 0.4s',
    }}>
      {/* Barra superior */}
      <div style={{ height: 48, background: 'rgba(16,16,16,0.98)', borderBottom: `1px solid ${color}30`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
        <div style={{ display: 'flex', gap: 5 }}>
          {['#FF5F57', '#FFBD2E', '#28C840'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ height: 22, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>EN VIVO</span>
        </div>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s' }}>
          <Zap size={12} color={color} />
        </div>
      </div>
      {/* Contenido */}
      <div style={{ display: 'flex', height: 260 }}>
        {/* Sidebar */}
        <div style={{ width: 44, background: 'rgba(12,12,12,0.99)', borderRight: `1px solid ${color}15`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 6 }}>
          {[true, false, false, false, false].map((active, i) => (
            <div key={i} style={{ width: 30, height: 30, borderRadius: 8, background: active ? `${color}18` : 'transparent', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.4s' }}>
              {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2.5, height: 16, background: color, borderRadius: '0 3px 3px 0', boxShadow: `0 0 10px ${color}` }} />}
              <div style={{ width: 12, height: 12, borderRadius: 3, background: active ? color : '#282828', transition: 'background 0.4s' }} />
            </div>
          ))}
        </div>
        {/* Main */}
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
            {[
              { label: 'Inscritos', val: '24', c: color },
              { label: 'Al día',    val: '18', c: '#22C55E' },
              { label: 'Pendiente', val: '6',  c: '#FF5E5E' },
            ].map(s => (
              <div key={s.label} style={{ background: `${s.c}09`, border: `1px solid ${s.c}25`, borderRadius: 9, padding: '8px 10px', transition: 'all 0.4s' }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.c, lineHeight: 1, transition: 'color 0.4s' }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, overflow: 'hidden', flex: 1 }}>
            <div style={{ height: 26, background: `${color}0A`, borderBottom: `1px solid ${color}18`, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 60, height: 5, borderRadius: 3, background: `${color}45` }} />
              <div style={{ width: 40, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ flex: 1 }} />
              <div style={{ padding: '1px 8px', background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 4, fontSize: 7, color, fontWeight: 700, letterSpacing: 0.5 }}>HOY</div>
            </div>
            {[
              { badge: '#22C55E', text: 'CONFIRMADO', name: 'Carlos M.' },
              { badge: color,     text: 'PENDIENTE',  name: 'Laura V.'  },
              { badge: '#FF5E5E', text: 'VENCIDO',    name: 'Juan P.'   },
              { badge: color,     text: 'PENDIENTE',  name: 'Ana R.'    },
            ].map((row, i) => (
              <div key={i} style={{ height: 28, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${row.badge}15`, border: `1px solid ${row.badge}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: row.badge }} />
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', flex: 1 }}>{row.name}</div>
                <div style={{ padding: '2px 7px', borderRadius: 4, background: `${row.badge}15`, border: `1px solid ${row.badge}35`, fontSize: 7, color: row.badge, fontWeight: 700, letterSpacing: 0.5 }}>{row.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── WhatsApp / IA Mockup ─────────────────────────────────────────────────── */
function WhatsAppMockup() {
  const msgs = [
    { from: 'bot',  text: '👋 Hola Carlos, tu inscripción al club está lista.' },
    { from: 'bot',  text: 'Tu pago de $60.000 está pendiente. Adjunta tu comprobante aquí.' },
    { from: 'user', text: '[Comprobante adjunto]' },
    { from: 'bot',  text: '✅ Pago validado. Tu carnet digital ya está disponible.' },
    { from: 'user', text: '¿Ya quedó confirmado mi cupo?' },
    { from: 'bot',  text: '✅ Sí. Tu inscripción fue confirmada. ¡Bienvenido!' },
  ];
  return (
    <div style={{
      width: '100%', maxWidth: 310, flexShrink: 0,
      borderRadius: 20, overflow: 'hidden',
      border: '1px solid rgba(37,211,102,0.22)',
      boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 60px rgba(37,211,102,0.06)',
      background: '#0A0A0A',
    }}>
      <div style={{ background: '#111', borderBottom: '1px solid rgba(37,211,102,0.15)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={17} color="#25D366" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>ZenSports IA</div>
          <div style={{ fontSize: 10, color: '#25D366', letterSpacing: 0.5 }}>● en línea · responde en segundos</div>
        </div>
      </div>
      <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8, background: '#0D0D0D', minHeight: 260 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%', padding: '8px 12px',
              borderRadius: m.from === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
              background: m.from === 'user' ? 'rgba(37,211,102,0.10)' : 'rgba(255,255,255,0.055)',
              border: m.from === 'user' ? '1px solid rgba(37,211,102,0.25)' : '1px solid rgba(255,255,255,0.08)',
              fontSize: 11.5, color: m.from === 'user' ? '#4ADE80' : '#C9D1D9', lineHeight: 1.55,
            }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Testimonials ─────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Alejandro Ríos',
    role: 'Director Técnico',
    club: 'FC Barranquilla Sur',
    text: 'Antes perdíamos horas revisando pagos en WhatsApp. Ahora todo queda registrado automáticamente y los jugadores reciben confirmación al instante.',
    stars: 5,
    avatar: 'AR',
    color: '#00AAFF',
  },
  {
    name: 'Valentina Mora',
    role: 'Coordinadora',
    club: 'Club Atlético Medellín',
    text: 'El carnet digital fue un cambio total. Los padres se sienten seguros, y nosotros podemos verificar cualquier jugador desde el celular.',
    stars: 5,
    avatar: 'VM',
    color: '#00D084',
  },
  {
    name: 'Sebastián Torres',
    role: 'Administrador',
    club: 'Escuela Deportiva Norte',
    text: 'Los cobros automáticos por WhatsApp redujeron la mora en más del 80%. ZenSports se pagó solo en el primer mes.',
    stars: 5,
    avatar: 'ST',
    color: '#F5A623',
  },
];

/* ── Payment helpers ──────────────────────────────────────────────────────── */
const PAYMENT_LINKS = {
  starter: { wompi: 'https://checkout.wompi.co/l/STARTER_REF', mp: 'https://mpago.la/STARTER_REF' },
  pro:     { wompi: 'https://checkout.wompi.co/l/PRO_REF',     mp: 'https://mpago.la/PRO_REF'     },
  total:   { wompi: 'https://checkout.wompi.co/l/TOTAL_REF',   mp: 'https://mpago.la/TOTAL_REF'   },
};
const isPlaceholder = (href) => !href || href.includes('_REF') || href.includes('STARTER') || href.includes('PRO_REF') || href.includes('TOTAL');

function WompiBtn({ href }) {
  if (isPlaceholder(href)) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700 }}>
      Wompi — Próximamente
    </div>
  );
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', borderRadius: 10, background: 'rgba(255,94,37,0.10)', border: '1px solid rgba(255,94,37,0.35)', color: '#FF5E25', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
      Wompi
    </a>
  );
}

function MercadoPagoBtn({ href }) {
  if (isPlaceholder(href)) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700 }}>
      Mercado Pago — Próximamente
    </div>
  );
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', borderRadius: 10, background: 'rgba(0,158,227,0.10)', border: '1px solid rgba(0,158,227,0.35)', color: '#009EE3', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
      Mercado Pago
    </a>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [previewColor, setPreviewColor] = useState(PALETA[0].hex);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { glowRef, onMove, onLeave } = useMouseGlow();

  useEffect(() => { document.title = 'ZenSports — Gestión Deportiva Inteligente'; }, []);

  const colorActivo = PALETA.find(p => p.hex === previewColor) || PALETA[0];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#060810', minHeight: '100vh', color: '#fff', overflowX: 'hidden' }}>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes glow-pulse { 0%,100%{opacity:0.4} 50%{opacity:0.75} }
        .btn-primary:hover { opacity:0.92; transform:translateY(-1px); }
        .btn-primary { transition:all 0.2s; }
        .btn-ghost:hover { background:rgba(255,255,255,0.08) !important; }
        .btn-ghost { transition:background 0.2s; }
        .card-hover:hover { border-color:rgba(255,255,255,0.16) !important; transform:translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,0.4); }
        .card-hover { transition:all 0.25s; }
        .color-swatch:hover { transform:scale(1.15) !important; }
        .color-swatch { transition:all 0.2s !important; }
        @media(max-width:640px){.hero-h1{font-size:32px!important;letter-spacing:-1px!important;}.hide-mobile{display:none!important;}.pricing-grid{grid-template-columns:1fr!important;}}
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'rgba(6,8,16,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${previewColor}, ${previewColor}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${previewColor}50`, transition: 'all 0.3s', flexShrink: 0 }}>
              <Zap size={16} color="#fff" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.5px' }}>ZenSports</span>
          </div>
          <div className="hide-mobile" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {['Producto', 'Automatización', 'Precios', 'ZCUP'].map(label => (
              <button key={label} className="btn-ghost" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 14, cursor: 'pointer', padding: '7px 14px', borderRadius: 8 }}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn-ghost" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer', padding: '7px 14px', borderRadius: 8 }}>
              Iniciar sesión
            </button>
            <button className="btn-primary" onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)} style={{ background: previewColor, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 9, padding: '8px 18px', cursor: 'pointer', boxShadow: `0 0 20px ${previewColor}40`, transition: 'all 0.3s' }}>
              Registrar club
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ position: 'relative', padding: '96px 24px 80px', overflow: 'hidden', minHeight: 600 }}
      >
        <GridBg color={previewColor} />

        {/* Mouse-reactive glow — DOM directo, sin re-render */}
        <div ref={glowRef} style={{
          position: 'absolute', pointerEvents: 'none', zIndex: 0,
          left: -9999, top: -9999, opacity: 0,
          width: 400, height: 400,
          background: `radial-gradient(circle, ${previewColor}20 0%, transparent 70%)`,
          filter: 'blur(40px)',
          transition: 'opacity 0.3s ease',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>

          {/* Badge animado */}
          <div style={{ animation: 'slide-up 0.6s ease 0.1s both', marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `linear-gradient(90deg, ${previewColor}15, rgba(0,208,132,0.10))`,
              border: `1px solid ${previewColor}35`,
              borderRadius: 999, padding: '5px 18px',
              fontSize: 12, color: previewColor, fontWeight: 600, letterSpacing: 0.5,
              transition: 'all 0.4s',
            }}>
              <Sparkles size={13} />
              Plataforma líder en gestión deportiva digital · 5 días gratis
            </span>
          </div>

          {/* Headline */}
          <h1 className="hero-h1" style={{
            fontSize: 'clamp(36px, 6.5vw, 66px)',
            fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-2px', marginBottom: 24,
            animation: 'slide-up 0.6s ease 0.2s both',
          }}>
            La forma moderna de{' '}
            <span style={{
              background: `linear-gradient(90deg, ${previewColor}, ${previewColor}cc, #00D084)`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 4s linear infinite',
            }}>
              gestionar inscripciones
            </span>{' '}
            deportivas.
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7,
            maxWidth: 580, margin: '0 auto 40px',
            animation: 'slide-up 0.6s ease 0.3s both',
          }}>
            Centraliza jugadores, registros, pagos y comunicación. Automatiza validaciones y cobros. Todo desde una experiencia profesional y rápida.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
            animation: 'slide-up 0.6s ease 0.4s both', marginBottom: 36,
          }}>
            <button
              className="btn-primary"
              onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                background: `linear-gradient(135deg, ${previewColor}, ${previewColor}cc)`,
                border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
                borderRadius: 12, padding: '15px 32px', cursor: 'pointer',
                boxShadow: `0 8px 32px ${previewColor}50`,
              }}
            >
              Probar gratis <ArrowRight size={16} />
            </button>
            <button
              className="btn-ghost"
              onClick={() => navigate('/login')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 15, borderRadius: 12, padding: '15px 28px', cursor: 'pointer',
              }}
            >
              Ver demo
            </button>
          </div>

          {/* Live Activity */}
          <div style={{ animation: 'slide-up 0.6s ease 0.5s both' }}>
            <ActivityFeed />
          </div>
        </div>

        {/* Hero dashboard mockup */}
        <div style={{ maxWidth: 940, margin: '64px auto 0', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1, animation: 'slide-up 0.8s ease 0.6s both' }}>
          <div style={{ position: 'relative', animation: 'float 6s ease-in-out infinite' }}>
            <div style={{ position: 'absolute', inset: -2, borderRadius: 18, background: `linear-gradient(135deg, ${previewColor}30, transparent, rgba(0,208,132,0.15))`, filter: 'blur(1px)' }} />
            <DashboardMockup color={previewColor} />
          </div>
        </div>
      </section>

      {/* ── DISCIPLINAS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 72px', maxWidth: 860, margin: '0 auto' }}>
        <Reveal>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 18 }}>
            Funciona para cualquier disciplina deportiva
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {[
              { emoji: '⚽', label: 'Fútbol' }, { emoji: '🏀', label: 'Basketball' },
              { emoji: '🏊', label: 'Natación' }, { emoji: '🚴', label: 'Ciclismo' },
              { emoji: '🥊', label: 'Artes Marciales' }, { emoji: '🏋️', label: 'Gimnasio' },
              { emoji: '🎾', label: 'Tenis' }, { emoji: '🏐', label: 'Voleibol' },
              { emoji: '🤸', label: 'Gimnasia' },
            ].map(d => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999, padding: '6px 14px', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                <span>{d.emoji}</span>{d.label}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: `${previewColor}10`, border: `1px solid ${previewColor}25`, borderRadius: 999, padding: '6px 14px', fontSize: 13, color: previewColor, transition: 'all 0.3s' }}>
              + cualquier deporte con afiliados
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 900, margin: '0 auto' }}>
        <Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
            {[
              { target: '3000', prefix: '+', suffix: '', label: 'registros procesados', color: previewColor, icon: Users },
              { target: '850',  prefix: '+', suffix: '', label: 'pagos gestionados',    color: '#00D084',   icon: CreditCard },
              { target: '95',   prefix: '',  suffix: '%', label: 'menos trabajo manual', color: '#F5A623',   icon: TrendingUp },
              { target: '120',  prefix: '+', suffix: '', label: 'organizaciones activas', color: '#C678FF',   icon: Shield },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}12`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <s.icon size={18} color={s.color} />
                  </div>
                  <div style={{ fontSize: 'clamp(38px, 5vw, 52px)', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 10, letterSpacing: '-1px' }}>
                    <Counter target={s.target} prefix={s.prefix} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── PROBLEMA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 900, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>El problema</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 12, letterSpacing: '-0.8px' }}>
            Administrar inscripciones deportivas<br />no debería ser un caos.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0 }}>Así se ve la realidad de la mayoría de clubes hoy.</p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {[
            { icon: FileText,      label: 'Formularios manuales en papel o Excel'     },
            { icon: MessageCircle, label: 'Pagos recibidos por WhatsApp sin registro'  },
            { icon: AlertTriangle, label: 'Información desordenada o perdida'          },
            { icon: Users,         label: 'Inscripciones sin validación centralizada'  },
            { icon: Smartphone,    label: 'Mala experiencia desde celular'             },
            { icon: BarChart2,     label: 'Sin visibilidad del estado de pagos'        },
          ].map(({ icon: Icon, label }, i) => (
            <Reveal key={label} delay={i * 60}>
              <div className="card-hover" style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,94,94,0.035)', border: '1px solid rgba(255,94,94,0.12)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,94,94,0.09)', border: '1px solid rgba(255,94,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color="#FF5E5E" />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>La solución</p>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.8px' }}>
            ZenSports automatiza toda la experiencia.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            Desde la inscripción hasta el cobro, sin procesos manuales. Eficiencia desde el día uno.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {[
            {
              icon: Bot, color: previewColor,
              title: 'Automatización por WhatsApp',
              desc: 'Cobros preventivos, confirmaciones y recordatorios enviados automáticamente. Cero intervención manual.',
              badge: 'IA',
            },
            {
              icon: Users, color: '#00D084',
              title: 'Inscripciones digitales',
              desc: 'Formularios inteligentes, validación automática y perfiles completos para cada jugador inscrito.',
              badge: 'Digital',
            },
            {
              icon: CreditCard, color: '#F5A623',
              title: 'Pagos y comprobantes QR',
              desc: 'Recibe pagos, genera QR de validación y aprueba comprobantes desde un panel centralizado.',
              badge: 'Pagos',
            },
            {
              icon: Shield, color: '#C678FF',
              title: 'Carnet y perfil digital',
              desc: 'Perfil completo con foto, historial médico y carnet verificable. Experiencia premium para cada miembro.',
              badge: 'Carnet',
            },
          ].map(({ icon: Icon, color, title, desc, badge }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="card-hover" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '26px 22px', height: '100%', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}14`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={color} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 999, padding: '3px 10px', letterSpacing: 0.5 }}>{badge}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── IA / WHATSAPP ─────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 56, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Reveal delay={0}>
            <WhatsAppMockup />
          </Reveal>
          <Reveal delay={100} style={{ maxWidth: 460, flexShrink: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>IA + Automatización</p>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.8px' }}>
              Tu asistente virtual trabaja 24/7 por ti.
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 28 }}>
              ZenSports responde preguntas, confirma pagos, valida inscripciones y envía recordatorios automáticamente por WhatsApp. Sin hojas de cálculo. Sin mensajes manuales.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                'Confirmación automática de inscripciones',
                'Validación inteligente de comprobantes',
                'Recordatorios de pago sin intervención',
                'Respuestas instantáneas a consultas frecuentes',
                'Seguimiento automático de pagos en mora',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={12} color="#25D366" />
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{item}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PERSONALIZACIÓN ──────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>Personalización</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.8px' }}>La interfaz con los colores de tu club.</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0 }}>Elige tu color al registrarte. Toda la app adopta tu identidad visual.</p>
        </Reveal>
        <div style={{ display: 'flex', gap: 56, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Reveal delay={0} style={{ display: 'flex', flexDirection: 'column', gap: 24, flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 46px)', gap: 10 }}>
              {PALETA.map(p => (
                <button key={p.hex} className="color-swatch" onClick={() => setPreviewColor(p.hex)} title={p.nombre} style={{
                  width: 46, height: 46, borderRadius: 12, background: p.hex,
                  border: previewColor === p.hex ? '2.5px solid #fff' : '2.5px solid transparent',
                  boxShadow: previewColor === p.hex ? `0 0 0 2px ${p.hex}, 0 0 20px ${p.hex}80` : `0 2px 8px ${p.hex}40`,
                  cursor: 'pointer',
                  transform: previewColor === p.hex ? 'scale(1.12)' : 'scale(1)',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: previewColor, boxShadow: `0 0 16px ${previewColor}70`, transition: 'all 0.3s', flexShrink: 0 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: previewColor, transition: 'color 0.3s' }}>{colorActivo.nombre}</div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.65, maxWidth: 290, margin: 0 }}>
              El color se aplica al escudo, barras, indicadores y acentos.<br />
              Puedes cambiarlo desde configuración en cualquier momento.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <DashboardMockup color={previewColor} />
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIOS ──────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>Testimonios</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.8px' }}>Lo que dicen los clubes.</h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <div className="card-hover" style={{
                background: 'rgba(255,255,255,0.025)', borderRadius: 20, padding: '28px 26px',
                border: `1px solid rgba(255,255,255,0.07)`,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${t.color}45, transparent)` }} />
                <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
                  {Array(t.stars).fill(0).map((_, si) => <Star key={si} size={14} fill="#F5A623" color="#F5A623" />)}
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 20, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${t.color}18`, border: `1px solid ${t.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: t.color, flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{t.role} · {t.club}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── ZCUP ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 900, margin: '0 auto' }}>
        <Reveal>
          <div style={{
            borderRadius: 22, padding: '44px 44px',
            background: 'linear-gradient(135deg, rgba(198,120,255,0.055) 0%, rgba(0,170,255,0.055) 100%)',
            border: '1px solid rgba(198,120,255,0.2)',
            display: 'flex', flexWrap: 'wrap', gap: 36, alignItems: 'center', justifyContent: 'space-between',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(198,120,255,0.6), rgba(0,170,255,0.4), transparent)' }} />
            <div style={{ maxWidth: 480 }}>
              <div style={{ display: 'inline-block', background: 'rgba(198,120,255,0.10)', border: '1px solid rgba(198,120,255,0.28)', borderRadius: 999, padding: '3px 14px', fontSize: 11, color: '#C678FF', fontWeight: 700, letterSpacing: 1, marginBottom: 18, textTransform: 'uppercase' }}>
                Plataforma hermana
              </div>
              <h2 style={{ fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 800, marginBottom: 14, lineHeight: 1.15, letterSpacing: '-0.5px' }}>
                ¿Necesitas administración completa de torneos?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.75, marginBottom: 0 }}>
                <strong style={{ color: '#C678FF' }}>ZCUP</strong> es la plataforma especializada en fixtures, tablas de posiciones, programación de partidos, arbitraje y control competitivo de campeonatos deportivos.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              {['Fixtures y tablas de posiciones', 'Programación de partidos', 'Control de arbitraje', 'Resultados en tiempo real'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C678FF', flexShrink: 0, boxShadow: '0 0 6px #C678FF' }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                </div>
              ))}
              <button className="btn-primary" style={{ marginTop: 10, background: 'rgba(198,120,255,0.12)', border: '1px solid rgba(198,120,255,0.32)', color: '#C678FF', fontSize: 13, fontWeight: 700, borderRadius: 10, padding: '11px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                Conocer ZCUP <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>Planes</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.8px' }}>Activa solo lo que necesitas.</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0 }}>
            3 planes modulares · 5 días gratis · Sin permanencia
          </p>
        </Reveal>
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'start' }}>

          {/* STARTER */}
          <Reveal delay={0}>
            <div className="card-hover" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 22, padding: '30px 26px' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Starter</p>
              <div style={{ fontSize: 38, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>$59.000<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/mes</span></div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 26 }}>Para clubes que están empezando a organizarse</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 26 }}>
                {[[true,'Dashboard y reportes'],[true,'Gestión de miembros'],[true,'Pagos manuales y mora'],[true,'Carnet digital'],[false,'WhatsApp Bot automático'],[false,'Inscripciones digitales'],[false,'Uniformes y equipamiento'],[false,'Estadísticas avanzadas']].map(([on, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: on ? 1 : 0.3 }}>
                    <CheckCircle size={14} color={on ? '#00D084' : '#4B5563'} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: on ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)' }}>{label}</span>
                  </div>
                ))}
              </div>
              <button className="btn-ghost" onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 11, padding: '13px 0', cursor: 'pointer', marginBottom: 12 }}>
                Probar 5 días gratis
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 14px' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, whiteSpace: 'nowrap' }}>O PAGA DIRECTAMENTE</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <WompiBtn href={PAYMENT_LINKS.starter.wompi} />
                <MercadoPagoBtn href={PAYMENT_LINKS.starter.mp} />
              </div>
            </div>
          </Reveal>

          {/* PRO */}
          <Reveal delay={80}>
            <div className="card-hover" style={{ background: `${previewColor}07`, border: `2px solid ${previewColor}35`, borderRadius: 22, padding: '30px 26px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: previewColor, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '4px 16px', letterSpacing: 1, whiteSpace: 'nowrap', boxShadow: `0 4px 16px ${previewColor}60`, transition: 'all 0.3s' }}>
                ★ MÁS POPULAR
              </div>
              <p style={{ color: previewColor, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, transition: 'color 0.3s' }}>Pro</p>
              <div style={{ fontSize: 38, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>$99.000<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/mes</span></div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 26 }}>Automatización completa de inscripciones y pagos</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 26 }}>
                {[[true,'Dashboard y reportes'],[true,'Gestión de miembros'],[true,'Pagos manuales y mora'],[true,'Carnet digital'],[true,'WhatsApp Bot automático'],[true,'Inscripciones digitales'],[false,'Uniformes y equipamiento'],[false,'Estadísticas avanzadas']].map(([on, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: on ? 1 : 0.3 }}>
                    <CheckCircle size={14} color={on ? '#00D084' : '#4B5563'} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: on ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)' }}>{label}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)} style={{ width: '100%', background: previewColor, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 11, padding: '13px 0', cursor: 'pointer', boxShadow: `0 4px 24px ${previewColor}55`, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.3s' }}>
                Probar 5 días gratis <ChevronRight size={15} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 14px' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, whiteSpace: 'nowrap' }}>O PAGA DIRECTAMENTE</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <WompiBtn href={PAYMENT_LINKS.pro.wompi} />
                <MercadoPagoBtn href={PAYMENT_LINKS.pro.mp} />
              </div>
            </div>
          </Reveal>

          {/* TOTAL */}
          <Reveal delay={160}>
            <div className="card-hover" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 22, padding: '30px 26px' }}>
              <p style={{ color: '#C678FF', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Total</p>
              <div style={{ fontSize: 38, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>$149.000<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/mes</span></div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 26 }}>Acceso completo a todos los módulos</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 26 }}>
                {['Dashboard y reportes','Gestión de miembros','Pagos manuales y mora','Carnet digital','WhatsApp Bot automático','Inscripciones digitales','Uniformes y equipamiento','Estadísticas avanzadas'].map(label => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle size={14} color="#00D084" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{label}</span>
                  </div>
                ))}
              </div>
              <button className="btn-ghost" onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)} style={{ width: '100%', background: 'rgba(198,120,255,0.10)', border: '1px solid rgba(198,120,255,0.30)', color: '#C678FF', fontSize: 14, fontWeight: 700, borderRadius: 11, padding: '13px 0', cursor: 'pointer', marginBottom: 12 }}>
                Probar 5 días gratis
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 14px' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, whiteSpace: 'nowrap' }}>O PAGA DIRECTAMENTE</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <WompiBtn href={PAYMENT_LINKS.total.wompi} />
                <MercadoPagoBtn href={PAYMENT_LINKS.total.mp} />
              </div>
            </div>
          </Reveal>

        </div>
        <Reveal>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 28 }}>
            Todos los planes incluyen soporte por WhatsApp · Cancela cuando quieras · Sin costos ocultos
          </p>
        </Reveal>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div style={{
            borderRadius: 26, padding: '72px 48px',
            background: `linear-gradient(135deg, ${previewColor}09 0%, rgba(0,208,132,0.06) 100%)`,
            border: `1px solid ${previewColor}22`,
            position: 'relative', overflow: 'hidden',
            transition: 'all 0.4s',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${previewColor}55, rgba(0,208,132,0.4), transparent)`, transition: 'background 0.4s' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 300, background: `radial-gradient(ellipse, ${previewColor}06 0%, transparent 70%)`, pointerEvents: 'none', transition: 'all 0.4s' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 18, letterSpacing: '-1px' }}>
                Moderniza la experiencia<br />deportiva de tu organización.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
                Únete a los clubes que ya gestionan inscripciones y pagos de forma profesional y automatizada.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, background: `linear-gradient(135deg, ${previewColor}, ${previewColor}cc)`, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 12, padding: '15px 36px', cursor: 'pointer', boxShadow: `0 8px 32px ${previewColor}50`, transition: 'all 0.3s' }}
                >
                  Solicitar Demo <ArrowRight size={16} />
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 15, borderRadius: 12, padding: '15px 28px', cursor: 'pointer' }}
                >
                  Probar gratis
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: previewColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 12px ${previewColor}50`, transition: 'all 0.3s' }}>
                <Zap size={14} color="#fff" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px' }}>ZenSports</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: '0 0 6px' }}>Gestión deportiva para toda América Latina 🏅</p>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, margin: 0 }}>Creado por <span style={{ color: '#3B82F6', fontWeight: 700 }}>Zenpra</span></p>
          </div>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Producto</p>
              {['Iniciar sesión', 'Registrar club', 'Ver precios'].map(l => (
                <button key={l} className="btn-ghost" onClick={() => navigate(l === 'Iniciar sesión' ? '/login' : `/registro?color=${encodeURIComponent(previewColor)}`)} style={{ display: 'block', background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer', padding: '4px 0', borderRadius: 4, textAlign: 'left' }}>{l}</button>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Plataformas</p>
              {['ZenSports', 'ZCUP'].map(l => (
                <p key={l} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '0 0 8px' }}>{l}</p>
              ))}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: '32px auto 0', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12, margin: 0 }}>© 2026 ZenSports. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* ── MOBILE STICKY CTA ────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
        padding: '12px 16px 16px',
        background: 'rgba(6,8,16,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'none',
      }} className="mobile-sticky-cta">
        <button
          className="btn-primary"
          onClick={() => navigate(`/registro?color=${encodeURIComponent(previewColor)}`)}
          style={{ width: '100%', background: previewColor, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 12, padding: '15px', cursor: 'pointer', boxShadow: `0 4px 20px ${previewColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, transition: 'all 0.3s' }}
        >
          Probar gratis · 5 días <ArrowRight size={16} />
        </button>
      </div>

      <style>{`
        @media(max-width:640px){
          .mobile-sticky-cta { display: block !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
