import { useNavigate } from 'react-router-dom';
import { Bot, BarChart2, CreditCard, Shield, ChevronRight, CheckCircle } from 'lucide-react';

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
    desc: 'Mensualidades, uniformes y torneos en un solo panel. Aprueba comprobantes con un clic.',
  },
  {
    icon: CreditCard,
    color: '#F5A623',
    title: 'Carnet y hoja de vida digital',
    desc: 'Perfil completo con foto, estadísticas, historial médico y carnet imprimible para cada jugador.',
  },
  {
    icon: Shield,
    color: '#C678FF',
    title: 'Multi-club y seguro',
    desc: 'Cada club gestiona sus datos de forma independiente. Acceso protegido con autenticación segura.',
  },
];

const INCLUYE = [
  'WhatsApp Bot de cobro automático',
  'Dashboard admin ilimitado',
  'Hoja de vida + carnet por jugador',
  'Historial de pagos y comprobantes',
  'Reportes de mora y estado financiero',
  'Uniformes y torneos',
  'Soporte por WhatsApp',
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
      <section style={{ textAlign: 'center', padding: '80px 24px 64px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.25)', borderRadius: 999, padding: '4px 14px', fontSize: 12, color: '#00AAFF', fontWeight: 600, marginBottom: 20, letterSpacing: 0.5 }}>
          ⚽ Hecho para clubes colombianos
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1px' }}>
          Gestiona tu club de fútbol<br />
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
            Registrar mi club gratis <ChevronRight size={16} />
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, borderRadius: 12, padding: '14px 28px', cursor: 'pointer' }}
          >
            Ya tengo cuenta
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 14 }}>
          30 días gratis · Sin tarjeta de crédito · Cancela cuando quieras
        </p>
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
      <section style={{ padding: '0 24px 80px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Un precio, todo incluido</h2>
        <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 32 }}>Sin sorpresas. Sin planes confusos.</p>
        <div style={{ background: 'rgba(0,170,255,0.06)', border: '1px solid rgba(0,170,255,0.2)', borderRadius: 20, padding: '32px 28px' }}>
          <div style={{ fontSize: 42, fontWeight: 800, marginBottom: 2 }}>
            $99.000<span style={{ fontSize: 16, color: '#9CA3AF', fontWeight: 400 }}>/mes</span>
          </div>
          <p style={{ color: '#00AAFF', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>✓ 30 días gratis para tu club</p>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {INCLUYE.map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#D1D5DB' }}>
                <CheckCircle size={15} color="#00D084" style={{ flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/registro')}
            style={{ width: '100%', background: '#00AAFF', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 10, padding: '14px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            Empezar gratis <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center', color: '#4B5563', fontSize: 13 }}>
        <p>ClubContable · Hecho para clubes colombianos ⚽</p>
        <div style={{ marginTop: 8, display: 'flex', gap: 20, justifyContent: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>Iniciar sesión</button>
          <button onClick={() => navigate('/registro')} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>Registrar club</button>
        </div>
      </footer>
    </div>
  );
}
