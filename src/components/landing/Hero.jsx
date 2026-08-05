import { useState, useEffect, useMemo, useRef } from 'react';
// `motion` is referenced only via JSX member-expression tags (<motion.div>);
// this project's ESLint config has no eslint-plugin-react, so eslint-scope
// doesn't reference-track that form.
// eslint-disable-next-line no-unused-vars
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Sparkles, ArrowRight, CheckCircle, Users, CreditCard, MessageCircle, ChevronDown,
  BarChart2, Target, Brain, TrendingUp, Database,
} from 'lucide-react';
import { CLUB_LOGOS } from './clubLogos';
import DashboardMockup from './DashboardMockup';
import LightningOverlay from './LightningOverlay';
import ZenSportsLogo from '../brand/ZenSportsLogo';

/* ── Iconos "Análisis / Precisión / IA / Rendimiento / Datos" ────────────────
   Antes vivían quemados como píxeles dentro de og-image.jpg (junto con el
   logo y el copy) — ahora son DOM real: se pueden animar por separado,
   Google los indexa, y no se ven borrosos en pantallas grandes. */
const HERO_STATS = [
  { Icon: BarChart2,  label: 'Análisis'    },
  { Icon: Target,     label: 'Precisión'   },
  { Icon: Brain,      label: 'IA'          },
  { Icon: TrendingUp, label: 'Rendimiento' },
  { Icon: Database,   label: 'Datos'       },
];

/* ── Grid + glow background ──────────────────────────────────────────────── */
function GridBg({ color }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.038 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Glow central — respira */}
      <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 620, background: `radial-gradient(ellipse at center, ${color}14 0%, transparent 65%)`, filter: 'blur(48px)', animation: 'glow-pulse 6s ease-in-out infinite', transition: 'background 0.5s' }} />
      {/* Glow secundario derecho */}
      <div style={{ position: 'absolute', top: '5%', right: '-10%', width: 450, height: 450, background: 'radial-gradient(ellipse, rgba(0,208,132,0.07) 0%, transparent 70%)', filter: 'blur(24px)', animation: 'glow-pulse 8s ease-in-out 2s infinite' }} />
      {/* Glow izquierdo inferior */}
      <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: 380, height: 380, background: `radial-gradient(ellipse, ${color}07 0%, transparent 70%)`, filter: 'blur(24px)', animation: 'glow-pulse 7s ease-in-out 4s infinite', transition: 'background 0.5s' }} />
      {/* Línea horizontal sutil */}
      <div style={{ position: 'absolute', top: '48%', left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent 0%, ${color}10 25%, ${color}06 50%, ${color}10 75%, transparent 100%)`, transition: 'background 0.5s' }} />
    </div>
  );
}

/* ── Particle Field ──────────────────────────────────────────────────────── */
function ParticleField({ color }) {
  const particles = useMemo(() =>
    Array.from({ length: 26 }, (_, i) => ({
      id: i,
      left: `${6 + (i * 37 + 13) % 86}%`,
      top: `${6 + (i * 53 + 7) % 86}%`,
      size: ((i * 17 + 5) % 25) / 10 + 1,
      delay: `${((i * 1.3) % 7).toFixed(1)}s`,
      duration: `${(((i * 2.1) % 5) + 5).toFixed(1)}s`,
      opacity: (((i * 7 + 3) % 35) / 100 + 0.08).toFixed(2),
    })), []);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.left, top: p.top,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: color,
          opacity: p.opacity,
          animation: `particle-float ${p.duration} ease-in-out ${p.delay} infinite`,
          boxShadow: `0 0 ${parseFloat(p.size) * 3}px ${color}`,
          transition: 'background 0.5s, box-shadow 0.5s',
        }} />
      ))}
    </div>
  );
}

/* ── Live Activity Feed ──────────────────────────────────────────────────── */
const ACTIVITY = [
  { Icon: CheckCircle,  color: '#22C55E', text: 'Pago confirmado — Club Atlético Verde', time: 'hace 2 min' },
  { Icon: Users,        color: '#AE68FF', text: 'Nuevo jugador inscrito — FC Medellín Sur', time: 'hace 5 min' },
  { Icon: CreditCard,   color: '#06B6D4', text: 'QR de carnet generado — Deportivo Norte', time: 'hace 8 min' },
  { Icon: MessageCircle,color: '#25D366', text: 'WhatsApp enviado — Pago pendiente × 3', time: 'hace 11 min' },
  { Icon: CheckCircle,  color: '#22C55E', text: 'Inscripción validada — Barranquilla FC', time: 'hace 14 min' },
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
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
        <item.Icon size={13} color={item.color} strokeWidth={2.2} style={{ flexShrink: 0 }} />
        {item.text}
      </span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{item.time}</span>
    </div>
  );
}

/* ── Floating stat cards around the dashboard mockup ─────────────────────── */
const FLOAT_CARDS = [
  { emoji: '✅', text: 'Pago confirmado — $60.000', color: '#22C55E', pos: { top: '12%', right: '2%' },   delay: '0s',   dur: '7s'   },
  { emoji: '👤', text: 'Nuevo jugador inscrito',    color: '#00AAFF', pos: { top: '52%', right: '-2%' },  delay: '1.8s', dur: '8s'   },
  { emoji: '🪪', text: 'Carnet QR generado',        color: '#F5A623', pos: { top: '28%', left: '1%'  },  delay: '2.4s', dur: '7.5s' },
  { emoji: '💬', text: 'WhatsApp enviado × 8',      color: '#25D366', pos: { bottom: '18%', left: '2%' }, delay: '0.9s', dur: '6.5s' },
];

function FloatingCard({ emoji, text, color, pos, delay, dur }) {
  return (
    <div className="float-badge" style={{
      position: 'absolute', ...pos,
      background: 'rgba(6,8,20,0.88)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${color}30`,
      borderRadius: 12,
      padding: '9px 14px',
      alignItems: 'center',
      gap: 8,
      boxShadow: `0 8px 32px rgba(0,0,0,0.45), 0 0 24px ${color}08`,
      animation: `float-card ${dur} ease-in-out ${delay} infinite`,
      zIndex: 3,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 13 }}>{emoji}</span>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>{text}</span>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0, animation: 'pulse-dot 2s ease-in-out infinite' }} />
    </div>
  );
}

/* ── Scroll indicator ─────────────────────────────────────────────────────
   Fijo a la ventana (no a la sección) — se desvanece apenas el usuario
   empieza a scrollear y reaparece si vuelve arriba del todo. */
function ScrollIndicator() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 140], [1, 0]);
  return (
    <motion.div
      style={{
        opacity, position: 'fixed', left: '50%', bottom: 22, zIndex: 150,
        pointerEvents: 'none', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4, x: '-50%',
      }}
    >
      <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
        Descubre más
      </span>
      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
      >
        <ChevronDown size={18} color="rgba(255,255,255,0.35)" />
      </motion.div>
    </motion.div>
  );
}

/* ── Entrance choreography ────────────────────────────────────────────────
   Reemplaza los `animation: slide-up ...Xs` con delays a mano por un stagger
   de framer-motion — mismo look, un solo lugar para tunear el timing. */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export default function Hero({ previewColor, openLead }) {
  const sectionRef = useRef(null);
  // Parallax: la imagen se desplaza más lento que el resto del hero al hacer
  // scroll (offset acotado a unos px para no revelar el borde del contenedor
  // — la imagen ya sale con zoom Ken Burns >100%, ver .hero-kenburns).
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 14]);

  return (
    <section ref={sectionRef} style={{ position: 'relative', padding: '100px 24px 80px', overflow: 'hidden' }}>
      <GridBg color={previewColor} />
      <ParticleField color={previewColor} />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}
      >
        {/* Badge */}
        <motion.div variants={staggerItem} style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(90deg, rgba(106,0,255,0.10), rgba(6,182,212,0.07), rgba(106,0,255,0.10))',
            border: '1px solid rgba(106,0,255,0.30)',
            borderRadius: 999, padding: '6px 20px',
            fontSize: 12, color: 'var(--brand-secondary, #AE68FF)', fontWeight: 600, letterSpacing: 0.5,
            boxShadow: '0 0 20px rgba(106,0,255,0.10), inset 0 1px 0 rgba(106,0,255,0.15)',
          }}>
            <Sparkles size={13} />
            Plataforma líder en gestión deportiva digital · 5 días gratis
          </span>
        </motion.div>

        {/* Dos columnas: texto/logo/íconos reales (izq) + foto recortada de
            atletas + rayos animados (der). Antes todo esto era una sola
            imagen plana (og-image.jpg) con el texto quemado como píxeles —
            separarlo lo hace indexable por SEO, editable y animable pieza
            por pieza. */}
        <motion.div variants={staggerItem} className="hero-two-col" style={{
          display: 'flex', alignItems: 'stretch', gap: 40,
        }}>
          {/* Columna de texto — se centra como un solo bloque contra la
              altura completa de la foto (stretch en la fila + justifyContent
              center acá). Antes quedaba pegada arriba y dejaba un vacío
              abajo; probé repartir con space-between pero el hueco solo se
              movía al medio entre los íconos y el botón — se veía a
              contenido faltante, no a diseño. Centrado como bloque único es
              lo que de verdad se ve intencional. */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="hero-text-col"
            style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36 }}
          >
            <div>
              <motion.div variants={staggerItem} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ZenSportsLogo variant="zz" size={76} />
                <div>
                  <div style={{ fontFamily: "'Sport Event',cursive", fontSize: 40, letterSpacing: 1, color: '#fff', lineHeight: 1 }}>
                    <span style={{ opacity: 0.82 }}>ZEN</span><span style={{ color: previewColor }}>SPORTS</span>
                  </div>
                  <div style={{ fontSize: 11.5, letterSpacing: 3, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                    — AI POWERING PERFORMANCE —
                  </div>
                </div>
              </motion.div>

              <motion.p variants={staggerItem} style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', maxWidth: 400, marginTop: 28 }}>
                Transformamos datos en rendimiento. Potenciamos atletas, equipos y organizaciones con inteligencia artificial de vanguardia.
              </motion.p>

              <motion.div variants={staggerItem} style={{ display: 'flex', gap: 20, marginTop: 32 }}>
                {HERO_STATS.map(({ Icon, label }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: `${previewColor}1F`, border: `1px solid ${previewColor}4D`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={17} color={previewColor} strokeWidth={2} />
                    </div>
                    <span style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>

            <div>
              <motion.button
                variants={staggerItem}
                onClick={() => document.getElementById('producto')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${previewColor}59`,
                  color: 'rgba(255,255,255,0.8)', fontSize: 11.5, letterSpacing: 1.5, textTransform: 'uppercase',
                  borderRadius: 999, padding: '11px 22px', cursor: 'pointer',
                }}
              >
                Descubre el futuro del deporte
                <ArrowRight size={13} />
              </motion.button>

              {/* CTAs primarios */}
              <motion.div variants={staggerItem} className="hero-cta-wrap" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
                <button
                  className="btn-primary hero-cta-btn"
                  onClick={() => openLead('free')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    background: `linear-gradient(135deg, ${previewColor}, ${previewColor}cc)`,
                    border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
                    borderRadius: 12, padding: '14px 28px', cursor: 'pointer',
                    boxShadow: `0 8px 32px ${previewColor}60`,
                  }}
                >
                  Comenzar prueba gratis de 5 días <ArrowRight size={16} />
                </button>
                <button
                  className="btn-ghost hero-cta-btn"
                  onClick={() => document.getElementById('automatizacion')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(12px)',
                    color: '#fff', fontSize: 15, borderRadius: 12, padding: '14px 28px', cursor: 'pointer',
                  }}
                >
                  Ver cómo funciona en 2 min
                </button>
              </motion.div>
            </div>
          </motion.div>

          {/* Columna de foto — Ken Burns continuo (CSS, en el wrapper) +
              parallax de scroll (framer) + rayos animados encima. El recorte
              es matemático, no manual: a 500×630 con aspect-ratio fijo, el
              object-position:100% siempre muestra exactamente x:700→1200 del
              original a escala 1:1 (sin upscale) — ahí termina el texto
              quemado en la imagen y empiezan los deportistas limpios. */}
          <motion.div className="hero-photo-col" style={{
            flex: '0 0 500px',
            maxWidth: '100%',
            aspectRatio: '500 / 630',
            position: 'relative',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: `0 0 0 1px rgba(106,0,255,0.25), 0 32px 80px rgba(106,0,255,0.30), 0 8px 32px rgba(0,0,0,0.6)`,
          }}>
            <motion.div style={{ y: imgY, position: 'absolute', inset: 0 }}>
              {/* .hero-kenburns en el wrapper (no en el <img>) para que la
                  imagen y el overlay de rayos escalen pegados, cuadro a
                  cuadro — si cada uno tuviera su propio scale se desalinean. */}
              <div className="hero-kenburns" style={{ position: 'absolute', inset: 0 }}>
                <img
                  src="/og-image.jpg"
                  alt="ZenSports — atletas potenciados por IA"
                  fetchpriority="high"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '100% center' }}
                />
                <LightningOverlay viewBox="700 0 500 630" />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Sub-texto + social proof */}
        <motion.div variants={staggerItem} style={{ textAlign: 'center', marginTop: 28 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', fontStyle: 'italic' }}>
            En menos de 20 minutos tu club completamente digitalizado, sin hojas de cálculo.
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: '0 0 20px' }}>
            5 días gratis · Sin tarjeta · Sin permanencia
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Clubes en Colombia y Latam ya confían en ZenSports</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {CLUB_LOGOS.slice(0, 5).map(club => (
                <div key={club.abbr} style={{ width: 26, height: 26, borderRadius: 6, background: `${club.color}16`, border: `1px solid ${club.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 900, color: club.color }}>
                  {club.abbr}
                </div>
              ))}
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginLeft: 3 }}>+6 más</span>
            </div>
          </div>
        </motion.div>

        {/* Live Activity */}
        <motion.div variants={staggerItem} style={{ marginTop: 24 }}>
          <ActivityFeed />
        </motion.div>
      </motion.div>

      {/* Hero dashboard mockup */}
      <div style={{ maxWidth: 940, margin: '64px auto 0', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1, animation: 'slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both' }}>
        {FLOAT_CARDS.map(c => <FloatingCard key={c.text} {...c} />)}
        <div style={{ position: 'relative', animation: 'float 7s ease-in-out infinite' }}>
          <div style={{ position: 'absolute', inset: -2, borderRadius: 18, background: `linear-gradient(135deg, ${previewColor}35, transparent 50%, rgba(0,208,132,0.18))`, filter: 'blur(1px)', animation: 'border-breathe 5s ease-in-out infinite', transition: 'background 0.5s' }} />
          <div style={{ position: 'absolute', bottom: -40, left: '10%', right: '10%', height: 60, background: `radial-gradient(ellipse at center, ${previewColor}25 0%, transparent 70%)`, filter: 'blur(20px)', transition: 'background 0.5s' }} />
          <DashboardMockup color={previewColor} />
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
