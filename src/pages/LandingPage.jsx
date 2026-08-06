import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, BarChart2, CreditCard, Shield, ChevronRight, CheckCircle,
  Users, FileText, Smartphone, AlertTriangle, Zap, MessageCircle,
  ArrowRight, TrendingUp, Star, Sun, Moon, X, Loader2, Menu, QrCode,
} from 'lucide-react';
import { PALETA } from '../lib/themes';
import { API_BASE_URL } from '../config';
import ZenSportsLogo from '../components/brand/ZenSportsLogo';
import Hero from '../components/landing/Hero';
import DashboardMockup from '../components/landing/DashboardMockup';
import { CLUB_LOGOS } from '../components/landing/clubLogos';

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
      transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
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
    el.style.left = `${e.clientX - 200}px`;
    el.style.top = `${e.clientY - 200}px`;
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

/* ── WhatsApp / IA Mockup ─────────────────────────────────────────────────── */
function WhatsAppMockup() {
  const msgs = [
    { from: 'bot',  text: '👋 Hola Carlos, tu inscripción al club está lista.' },
    { from: 'bot',  text: 'Tu pago de $60.000 está pendiente. Adjunta tu comprobante aquí.' },
    { from: 'user', text: '[Comprobante adjunto]' },
    { from: 'bot',  text: '✅ Pago validado. Tu carnet digital ya está disponible.' },
    { from: 'user', text: 'Profe, se me pasó la fecha de pago, ¿puedo pagar el viernes?' },
    { from: 'bot',  text: '👍 Claro, te programo un recordatorio para el jueves y te envío el enlace seguro de pago.' },
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
    text: 'Las alertas de cobro automáticas nos avisan quién debe pagar antes de que se atrase. Redujimos la mora más del 80% sin perseguir a nadie.',
    stars: 5,
    avatar: 'ST',
    color: '#F5A623',
  },
];

/* ── Casos de éxito ──────────────────────────────────────────────────────── */
const CASOS = [
  {
    club: 'Escuela Deportiva Barranquilla Sur',
    deporte: 'Fútbol',
    color: '#00AAFF',
    avatar: 'EB',
    problema: 'El director pasaba 4 horas diarias revisando pagos en WhatsApp y actualizando hojas de cálculo. Cada mes perdían entre 2 y 4 cupos por pagos no registrados.',
    solucion: 'Implementaron ZenSports en 20 minutos. El bot de WhatsApp comenzó a confirmar pagos automáticamente desde el primer día y el carnet QR eliminó los cobros duplicados.',
    quote: 'En la primera semana recuperamos dos inscripciones que antes se perdían. El bot trabaja mientras yo duermo.',
    persona: 'Alejandro R. · Director Técnico',
    antes: [
      { label: 'Horas/día en cobros', val: '4 h' },
      { label: 'Mora promedio',        val: '38%' },
      { label: 'Cupos perdidos/mes',   val: '3'   },
    ],
    despues: [
      { label: 'Horas/día en cobros', val: '20 min' },
      { label: 'Mora promedio',        val: '7%'    },
      { label: 'Cupos perdidos/mes',   val: '0'     },
    ],
  },
  {
    club: 'Club Atlético Medellín Central',
    deporte: 'Fútbol · Natación',
    color: '#00D084',
    avatar: 'AM',
    problema: 'No tenían forma de verificar si un jugador estaba al día antes de un partido. Los padres discutían con los coordinadores en la cancha cada fin de semana.',
    solucion: 'El carnet digital QR resolvió la verificación en segundos. Cualquier coordinador confirma el estado de un jugador desde el celular sin llamar a nadie.',
    quote: 'La primera vez que usamos el QR en un partido, los padres quedaron impresionados. Fue un cambio inmediato de imagen del club.',
    persona: 'Valentina M. · Coordinadora',
    antes: [
      { label: 'Tiempo verificación', val: '10 min'  },
      { label: 'Conflictos de pago',  val: 'Semanal' },
      { label: 'Imagen del club',     val: 'Baja'    },
    ],
    despues: [
      { label: 'Tiempo verificación', val: '5 seg' },
      { label: 'Conflictos de pago',  val: 'Cero'  },
      { label: 'Imagen del club',     val: 'Alta'  },
    ],
  },
  {
    club: 'Academia Deportiva Norte',
    deporte: 'Múltiples disciplinas',
    color: '#F5A623',
    avatar: 'AN',
    problema: 'Con 80 inscritos, la mora superaba el 40% mensual. El administrador enviaba más de 60 mensajes manuales por semana y muchos aún ignoraban los cobros.',
    solucion: 'El sistema calcula automáticamente quién debe pagar y arma el recordatorio listo para cada jugador en los días clave del ciclo. El admin los manda con un clic desde su propio WhatsApp — sin escribir nada de cero. Los jugadores con mora quedan suspendidos automáticamente hasta regularizar su estado.',
    quote: 'Ya no tengo que acordarme de nada ni escribir uno por uno — el sistema me arma todo, yo solo confirmo el envío. Bajé la mora al 8% sin arriesgar mi número de WhatsApp.',
    persona: 'Sebastián T. · Administrador',
    antes: [
      { label: 'Mora mensual',         val: '42%'     },
      { label: 'Mensajes manuales',    val: '+60/mes' },
      { label: 'Tiempo admin. cobros', val: '6 h/sem' },
    ],
    despues: [
      { label: 'Mora mensual',         val: '8%'      },
      { label: 'Mensajes manuales',    val: '0'       },
      { label: 'Tiempo admin. cobros', val: '30 min'  },
    ],
  },
];

function CasoExito({ caso, delay }) {
  return (
    <Reveal delay={delay}>
      <div className="card-hover" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${caso.color}, ${caso.color}60, transparent)` }} />
        <div style={{ padding: '28px 32px', display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: `${caso.color}16`, border: `1px solid ${caso.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: caso.color, flexShrink: 0 }}>
                {caso.avatar}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{caso.club}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{caso.deporte}</div>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#FF5E5E', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>El problema</p>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>{caso.problema}</p>
            </div>
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: caso.color, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Con ZenSports</p>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>{caso.solucion}</p>
            </div>
            <div style={{ background: `${caso.color}08`, border: `1px solid ${caso.color}20`, borderRadius: 12, padding: '14px 18px' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', lineHeight: 1.65, margin: '0 0 10px' }}>"{caso.quote}"</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{caso.persona}</p>
            </div>
          </div>
          <div style={{ flexShrink: 0, minWidth: 280 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,94,94,0.7)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>Antes</p>
                {caso.antes.map(m => (
                  <div key={m.label} style={{ textAlign: 'center', marginBottom: 10, background: 'rgba(255,94,94,0.05)', border: '1px solid rgba(255,94,94,0.14)', borderRadius: 12, padding: '13px 8px' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#FF5E5E', marginBottom: 4 }}>{m.val}</div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#00D084', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>Después</p>
                {caso.despues.map(m => (
                  <div key={m.label} style={{ textAlign: 'center', marginBottom: 10, background: 'rgba(0,208,132,0.05)', border: '1px solid rgba(0,208,132,0.20)', borderRadius: 12, padding: '13px 8px' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#00D084', marginBottom: 4 }}>{m.val}</div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ── Trust Logos ─────────────────────────────────────────────────────────── */
function TrustLogos() {
  return (
    <section style={{ padding: '0 24px 72px', maxWidth: 960, margin: '0 auto' }}>
      <Reveal>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 11, fontWeight: 700, letterSpacing: 3.5, textTransform: 'uppercase', marginBottom: 28 }}>
          Construido para organizaciones deportivas como
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
          {CLUB_LOGOS.map((club, i) => (
            <Reveal key={club.abbr} delay={i * 50}>
              <div className="card-hover" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '10px 18px',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 7,
                  background: `${club.color}16`,
                  border: `1px solid ${club.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 900, color: club.color, letterSpacing: 0.3, flexShrink: 0,
                }}>
                  {club.abbr}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', fontWeight: 500 }}>{club.name}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>{club.country}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ── Payment helpers ──────────────────────────────────────────────────────── */
const WA_NUMBER = '573023903192';
const WA_PAYMENT_MSG = {
  starter: encodeURIComponent('Hola, quiero activar el plan Starter de ZenSports ($149.000/mes). ¿Me puedes enviar los datos de pago?'),
  pro:     encodeURIComponent('Hola, quiero escalar mi club con el plan Pro de ZenSports ($399.000/mes). ¿Me puedes enviar los datos de pago?'),
  scale:   encodeURIComponent('Hola, quiero el plan Scale de ZenSports ($799.000/mes). ¿Me puedes enviar los datos de pago?'),
  enterprise: encodeURIComponent('Hola, quiero hablar sobre el plan Enterprise de ZenSports para mi organización.'),
};

function WhatsAppPayBtn({ plan }) {
  return (
    <a
      href={`https://wa.me/${WA_NUMBER}?text=${WA_PAYMENT_MSG[plan]}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '11px 0', borderRadius: 10, background: 'rgba(37,211,102,0.10)', border: '1px solid rgba(37,211,102,0.35)', color: '#25D366', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
    >
      <MessageCircle size={15} />
      Activar por WhatsApp
    </a>
  );
}

/* ── FAQ Item ──────────────────────────────────────────────────────────────── */
function FaqItem({ q, a, delay }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 14, padding: '18px 22px', cursor: 'pointer',
          transition: 'background-color 0.2s, border-color 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: open ? '#fff' : 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>{q}</span>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none' }}>
            <span style={{ fontSize: 16, lineHeight: 1, color: 'rgba(255,255,255,0.6)', fontWeight: 300 }}>+</span>
          </div>
        </div>
        {open && (
          <p style={{ margin: '14px 0 0', fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{a}</p>
        )}
      </div>
    </Reveal>
  );
}

/* ── Flow Diagram ──────────────────────────────────────────────────────────── */
function FlowDiagram() {
  const steps = [
    { Icon: Smartphone,    color: '#00AAFF', num: '01', title: 'Jugador se inscribe',  sub: 'Formulario digital desde el celular' },
    { Icon: CreditCard,    color: '#00D084', num: '02', title: 'Paga su mensualidad',  sub: 'PSE, tarjeta o código QR'            },
    { Icon: MessageCircle, color: '#25D366', num: '03', title: 'WhatsApp confirma',    sub: 'y te prepara los recordatorios de cobro' },
    { Icon: QrCode,        color: '#F5A623', num: '04', title: 'Carnet QR en cancha',  sub: 'Verificación en segundos'            },
  ];
  return (
    <section style={{ padding: '0 24px 96px', maxWidth: 1100, margin: '0 auto' }}>
      <Reveal style={{ textAlign: 'center', marginBottom: 52 }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>Cómo funciona</p>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.8px' }}>
          Cuatro pasos para que tu club cobre a tiempo.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0 }}>Y elimine el desorden administrativo de una vez por todas.</p>
      </Reveal>
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap', gap: 0 }}>
          {steps.map((step, i) => (
            <div key={step.title} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 20px', maxWidth: 200 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: `${step.color}12`, border: `1px solid ${step.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative' }}>
                  <step.Icon size={28} color={step.color} />
                  <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#060810' }}>
                    {step.num}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: '#fff' }}>{step.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{step.sub}</div>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight size={20} color="rgba(255,255,255,0.15)" style={{ flexShrink: 0, marginBottom: 36 }} />
              )}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ── Tech Trust ────────────────────────────────────────────────────────────── */
function TechTrust() {
  return (
    <Reveal delay={150} style={{ marginTop: 40 }}>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '28px 36px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,170,255,0.12)', border: '1px solid rgba(0,170,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={15} color="#00AAFF" />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Tecnología que da confianza</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {[
            'Bot de WhatsApp pensado para clubes deportivos de Latam',
            'IA entrenada para entender mensajes reales de jugadores y padres',
            'Infraestructura en la nube con alta disponibilidad y seguridad de datos',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: '1 1 200px', minWidth: 200 }}>
              <CheckCircle size={14} color="#00D084" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/* ── Highlighted Testimonial ─────────────────────────────────────────────── */
function HighlightedTestimonial() {
  const t = TESTIMONIALS[0];
  return (
    <section style={{ padding: '0 24px 72px', maxWidth: 800, margin: '0 auto' }}>
      <Reveal>
        <div style={{ background: `linear-gradient(135deg, ${t.color}08, rgba(255,255,255,0.02))`, border: `1px solid ${t.color}22`, borderRadius: 24, padding: '52px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${t.color}60, transparent)` }} />
          <div style={{ fontSize: 72, lineHeight: 1, color: `${t.color}30`, marginBottom: 16, fontFamily: 'Georgia, serif' }}>"</div>
          <p style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 700, color: '#fff', lineHeight: 1.5, maxWidth: 600, margin: '0 auto 32px' }}>
            Desde que usamos ZenSports dejamos de discutir pagos en la cancha.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${t.color}22, ${t.color}08)`, border: `2px solid ${t.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: t.color }}>
                {t.avatar}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{t.role} · {t.club}</div>
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${t.color}12`, border: `1px solid ${t.color}28`, borderRadius: 999, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: t.color, letterSpacing: 0.5 }}>
              ✅ Resultado real · Colombia
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── Impact Table ────────────────────────────────────────────────────────── */
function ImpactTable() {
  const rows = [
    { metric: 'Tiempo en cobros diarios',  antes: '4 h/día',   despues: '20 min/día' },
    { metric: 'Mora mensual promedio',      antes: '38%',       despues: '7%'         },
    { metric: 'Cupos perdidos por mes',     antes: '2-4 cupos', despues: '0 cupos'    },
  ];
  return (
    <section style={{ padding: '0 24px 88px', maxWidth: 700, margin: '0 auto' }}>
      <Reveal style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>Impacto real</p>
        <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.5px' }}>Antes y después de ZenSports.</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0, fontStyle: 'italic' }}>Resultados típicos en clubes que migran de Excel + WhatsApp a ZenSports.</p>
      </Reveal>
      <Reveal>
        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Métrica</div>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', borderLeft: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,94,94,0.7)', letterSpacing: 1.5, textTransform: 'uppercase', background: 'rgba(255,94,94,0.04)' }}>Antes</div>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', borderLeft: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#00D084', letterSpacing: 1.5, textTransform: 'uppercase', background: 'rgba(0,208,132,0.05)' }}>Con ZenSports</div>
          </div>
          {rows.map((row, i) => (
            <div key={row.metric} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <div style={{ padding: '16px 20px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{row.metric}</div>
              <div style={{ padding: '16px 20px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderLeft: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', background: 'rgba(255,94,94,0.03)', fontSize: 14, fontWeight: 800, color: '#FF5E5E' }}>{row.antes}</div>
              <div style={{ padding: '16px 20px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderLeft: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', background: 'rgba(0,208,132,0.04)', fontSize: 14, fontWeight: 800, color: '#00D084' }}>{row.despues}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ── Mini Comparison Table ───────────────────────────────────────────────── */
function MiniComparisonTable() {
  const rows = [
    { need: 'Inscripciones',         old: 'Formularios manuales + papel',            zs: 'Formulario digital + validación automática' },
    { need: 'Cobros y morosidad',    old: 'Mensajes 1 a 1 y recordatorios manuales', zs: 'Seguimiento automático + recordatorio con un clic' },
    { need: 'Control en cancha',     old: 'Llamadas, discusiones y papeles',          zs: 'Carnet QR verificado en segundos'           },
    { need: 'Dinero perdido al mes', old: 'Hasta $500.000+ en cupos no cobrados',     zs: 'Control en tiempo real · cero cupos fantasma' },
  ];
  return (
    <Reveal style={{ marginBottom: 20 }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16 }}>
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', minWidth: 480 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'rgba(255,255,255,0.025)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Necesidad</div>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', borderLeft: '1px solid rgba(255,255,255,0.05)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center' }}>Excel + WhatsApp</div>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', borderLeft: '1px solid rgba(106,0,255,0.2)', fontSize: 10, fontWeight: 700, color: '#AE68FF', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center', background: 'rgba(106,0,255,0.06)' }}>ZenSports</div>
        </div>
        {rows.map((row, i) => (
          <div key={row.need} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
            <div style={{ padding: '13px 16px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{row.need}</div>
            <div style={{ padding: '13px 16px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderLeft: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>{row.old}</div>
            <div style={{ padding: '13px 16px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderLeft: '1px solid rgba(106,0,255,0.15)', fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', background: 'rgba(106,0,255,0.035)', fontWeight: 600 }}>{row.zs}</div>
          </div>
        ))}
      </div>
      </div>
    </Reveal>
  );
}

/* ── Expandable Comparison ───────────────────────────────────────────────── */
function ExpandableComparison({ children }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      {expanded ? (
        <div>
          {children}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={() => setExpanded(false)}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 13, borderRadius: 10, padding: '8px 22px', cursor: 'pointer' }}
            >
              Ocultar detalle ↑
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setExpanded(true)}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, borderRadius: 12, padding: '12px 28px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Ver comparativa completa ↓
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Security Section ────────────────────────────────────────────────────── */
function SecuritySection() {
  return (
    <section style={{ padding: '0 24px 88px', maxWidth: 900, margin: '0 auto' }}>
      <Reveal>
        <div style={{ background: 'rgba(0,170,255,0.04)', border: '1px solid rgba(0,170,255,0.15)', borderRadius: 22, padding: '52px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(0,170,255,0.5), rgba(0,208,132,0.3), transparent)' }} />
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,170,255,0.10)', border: '1px solid rgba(0,170,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Shield size={26} color="#00AAFF" />
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.5px' }}>
            Seguridad y confianza para tu club
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, marginBottom: 12, maxWidth: 580, margin: '0 auto 12px', lineHeight: 1.7 }}>
            Sabemos que trabajas con datos sensibles de jugadores y familias. Por eso diseñamos ZenSports con seguridad desde el día uno.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Diseñado para proteger la información de tu club, tus jugadores y sus familias.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, maxWidth: 760, margin: '0 auto' }}>
            {[
              { icon: Shield,      color: '#00AAFF', text: 'Datos de jugadores, padres y staff protegidos y respaldados en la nube.' },
              { icon: Users,       color: '#00D084', text: 'Control de acceso por roles: directores, administradores y entrenadores.' },
              { icon: CheckCircle, color: '#F5A623', text: 'Buenas prácticas de privacidad pensadas para clubes con menores de edad.' },
            ].map(({ icon: Icon, color, text }) => (
              <div key={text} style={{ background: `${color}07`, border: `1px solid ${color}20`, borderRadius: 16, padding: '20px 22px', textAlign: 'left', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}14`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color={color} />
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── Lead Capture Modal ─────────────────────────────────────────────────── */
function LeadModal({ open, onClose, plan = 'free', color = '#00AAFF' }) {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ nombre: '', whatsapp: '', email: '', nombre_club: '', ciudad: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  if (!open) return null;

  const planLabel = { free: 'gratis', starter: 'Starter', pro: 'Pro', scale: 'Scale', enterprise: 'Enterprise', demo: 'Demo gratuita' }[plan] || plan;
  const isDemo = plan === 'demo';

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.whatsapp.trim()) { setError('Nombre y WhatsApp son requeridos'); return; }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError('Email inválido'); return; }
    setLoading(true); setError('');
    try {
      await fetch(`${API_BASE_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan_interes: plan, fuente: 'landing' }),
      });
    } catch { /* continúa aunque falle */ }
    if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { plan_interes: plan });
    setLoading(false);
    if (isDemo) {
      const msg = encodeURIComponent(`¡Hola ZenSports! 👋 Soy ${form.nombre}${form.nombre_club ? ` del ${form.nombre_club}` : ''}${form.ciudad ? ` en ${form.ciudad}` : ''}. Me interesa solicitar una demo gratuita. ¿Cuándo podríamos coordinarla?`);
      window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
      onClose();
    } else {
      navigate(`/registro?color=${encodeURIComponent(color)}&plan=${plan}&nombre=${encodeURIComponent(form.nombre_club)}&wa=${encodeURIComponent(form.whatsapp)}&admin=${encodeURIComponent(form.nombre)}&email=${encodeURIComponent(form.email)}&ciudad=${encodeURIComponent(form.ciudad)}`);
    }
  };

  const inp = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', background: '#0F1219', border: `1px solid ${color}30`, borderRadius: 22, padding: '32px 28px', width: '100%', maxWidth: 420, boxShadow: `0 0 60px ${color}20, 0 24px 60px rgba(0,0,0,0.6)` }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
          <X size={18} />
        </button>

        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'inline-block', background: `${color}18`, border: `1px solid ${color}35`, borderRadius: 999, padding: '4px 14px', fontSize: 11, fontWeight: 700, color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
            Plan {planLabel}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            {isDemo ? 'Agenda tu demo gratuita' : 'Un paso para empezar'}
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
            {isDemo
              ? 'Te contactamos por WhatsApp para coordinar una demo personalizada de ZenSports con tu equipo.'
              : 'Ingresa tus datos y en segundos tienes acceso. Sin tarjeta de crédito.'}
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input name="nombre" aria-label="Tu nombre" placeholder="Tu nombre *" value={form.nombre} onChange={handle} style={inp} required />
          <input name="whatsapp" aria-label="Número de WhatsApp" placeholder="WhatsApp (ej: 3001234567) *" value={form.whatsapp} onChange={handle} style={inp} required inputMode="tel" />
          <input name="email" aria-label="Correo electrónico" placeholder="Email (opcional)" value={form.email} onChange={handle} style={inp} inputMode="email" />
          <input name="nombre_club" aria-label="Nombre de tu club" placeholder="Nombre de tu club" value={form.nombre_club} onChange={handle} style={inp} />
          <input name="ciudad" aria-label="Ciudad" placeholder="Ciudad" value={form.ciudad} onChange={handle} style={inp} />

          {error && <p style={{ color: '#EF4444', fontSize: 12, margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ marginTop: 4, padding: '13px 0', background: `linear-gradient(135deg, ${color}, ${color}cc)`, border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 6px 24px ${color}50`, opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {loading ? 'Procesando…' : isDemo ? 'Solicitar demo por WhatsApp →' : 'Comenzar ahora →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: 0 }}>
            5 días gratis · Sin permanencia · Cancela cuando quieras
          </p>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [previewColor, setPreviewColor] = useState(PALETA[4].hex); // Violeta Real por defecto
  const [previewModo,  setPreviewModo]  = useState('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leadModal, setLeadModal]       = useState({ open: false, plan: 'free' });
  const [publicStats, setPublicStats]   = useState({ jugadores: 2500, clubs: 11 });

  useEffect(() => {
    fetch(`${API_BASE_URL}/publico/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.jugadores) setPublicStats(data); })
      .catch(() => {});
  }, []);
  const { glowRef, onMove, onLeave } = useMouseGlow();

  const openLead = useCallback((plan) => setLeadModal({ open: true, plan, color: previewColor }), [previewColor]);

  useEffect(() => { document.title = 'ZenSports — Gestión Deportiva Inteligente'; }, []);

  const colorActivo = PALETA.find(p => p.hex === previewColor) || PALETA[0];

  return (
    <div className="landing-page" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#060810', minHeight: '100vh', color: '#fff', overflowX: 'hidden' }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {/* Mouse-reactive glow — sigue al cursor en toda la página */}
      <div ref={glowRef} style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 0,
        left: -9999, top: -9999, opacity: 0,
        width: 400, height: 400,
        background: `radial-gradient(circle, ${previewColor}18 0%, transparent 70%)`,
        filter: 'blur(40px)',
        transition: 'opacity 0.3s ease',
      }} />

      <LeadModal
        open={leadModal.open}
        plan={leadModal.plan}
        color={previewColor}
        onClose={() => setLeadModal(m => ({ ...m, open: false }))}
      />

      <style>{`
        :root {
          --dur-fast: 150ms;
          --dur-med: 250ms;
          --dur-slow: 400ms;
          --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
          --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
        }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float-card { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes glow-pulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.08)} }
        @keyframes particle-float {
          0%,100%{transform:translateY(0) translateX(0)}
          33%{transform:translateY(-18px) translateX(8px)}
          66%{transform:translateY(-8px) translateX(-12px)}
        }
        @keyframes border-breathe { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes hero-kenburns { 0%,100%{transform:scale(1.03)} 50%{transform:scale(1.08)} }
        .hero-kenburns { animation: hero-kenburns 22s ease-in-out infinite; transform-origin: center; will-change: transform; }
        @keyframes hero-spark {
          0%,88%,100% { opacity:0; transform:translate(-50%,-50%) scale(0.5); }
          92% { opacity:1; transform:translate(-50%,-50%) scale(1.4); }
          95% { opacity:0.5; transform:translate(-50%,-50%) scale(0.9); }
        }
        @keyframes hero-sweep {
          0%,75% { transform:rotate(12deg) translateX(-120%); opacity:0; }
          78% { opacity:0.8; }
          90% { transform:rotate(12deg) translateX(220%); opacity:0.8; }
          94%,100% { transform:rotate(12deg) translateX(220%); opacity:0; }
        }
        .hero-sweep {
          position:absolute; top:-20%; left:-20%; width:60%; height:140%;
          background:linear-gradient(90deg, transparent, rgba(196,181,253,0.35), transparent);
          mix-blend-mode:screen; pointer-events:none;
          animation:hero-sweep 9s ease-in-out infinite;
        }
        .btn-primary:hover { opacity:0.9; transform:translateY(-2px); box-shadow: 0 12px 36px rgba(0,0,0,0.4); }
        .btn-primary { transition:all var(--dur-med) var(--ease-out); }
        .btn-ghost:hover { background:rgba(255,255,255,0.09) !important; border-color:rgba(255,255,255,0.22) !important; color:rgba(255,255,255,0.95) !important; }
        .btn-ghost { transition:background var(--dur-fast), border-color var(--dur-fast), color var(--dur-fast); }
        .card-hover:hover { transform:translateY(-4px); box-shadow:0 20px 48px rgba(0,0,0,0.5); }
        .card-hover { transition:all 0.3s var(--ease-out); }
        .color-swatch:hover { transform:scale(1.18) !important; box-shadow: 0 0 0 3px rgba(255,255,255,0.2) !important; }
        .color-swatch { transition:all 0.2s var(--ease-out) !important; }
        .float-badge { display:flex; }
        .bento-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:16px; }
        .bento-wide { grid-column:span 4; }
        .bento-narrow { grid-column:span 2; }
        @media(max-width:900px){ .bento-wide,.bento-narrow { grid-column:span 3 !important; } }
        @media(max-width:768px){
          .float-badge { display:none !important; }
          .hero-sparks,.hero-sweep { display:none !important; }
        }
        @media(max-width:820px){
          .hero-photo-stage{min-height:clamp(460px,74vh,620px)!important;}
          .hero-content{max-width:100%!important;}
          .hero-scrim-x{background:linear-gradient(180deg, rgba(6,8,20,0.85) 0%, rgba(6,8,20,0.68) 45%, rgba(6,8,20,0.9) 100%)!important;}
        }
        @media(max-width:640px){
          .hero-h1{font-size:32px!important;letter-spacing:-1px!important;}
          .hide-mobile{display:none!important;}
          .show-mobile{display:flex!important;}
          .pricing-grid{grid-template-columns:1fr!important;}
          .bento-wide,.bento-narrow{grid-column:span 6!important;}
          .mobile-menu{display:flex!important;}
          .hero-cta-btn{font-size:13px!important;padding:12px 18px!important;border-radius:10px!important;gap:5px!important;}
          .footer-grid{grid-template-columns:1fr!important;gap:32px!important;}
          .site-footer{padding-bottom:100px!important;}
          .wa-float{bottom:92px!important;right:16px!important;}
        }
        .show-mobile{display:none;}
        .mobile-menu{display:none;}
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)', maxWidth: 1100, zIndex: 200,
        background: 'rgba(6,8,16,0.92)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 16, padding: '0 20px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset',
      }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 10 }}
            aria-label="Ir al inicio"
          >
            <ZenSportsLogo variant="icon-svg" size={32} />
            <span style={{ fontFamily: "'Sport Event', sans-serif", fontSize: 20, letterSpacing: 3, color: '#fff', lineHeight: 1 }}>ZENSPORTS</span>
          </button>
          <div className="hide-mobile" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {[
              { label: 'Inicio',         anchor: null             },
              { label: 'Producto',       anchor: 'producto'       },
              { label: 'Automatización', anchor: 'automatizacion' },
              { label: 'Precios',        anchor: 'precios'        },
            ].map(({ label, anchor }) => (
              <button
                key={label}
                className="btn-ghost"
                onClick={() => anchor ? document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 14, cursor: 'pointer', padding: '10px 16px', borderRadius: 8, minHeight: 44 }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn-ghost hide-mobile" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer', padding: '10px 16px', borderRadius: 8, minHeight: 44 }}>
              Iniciar sesión
            </button>
            <button className="btn-primary hide-mobile" onClick={() => openLead('free')} style={{ background: previewColor, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 9, padding: '10px 20px', cursor: 'pointer', boxShadow: `0 0 20px ${previewColor}40`, transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s', minHeight: 44 }}>
              Registrar club
            </button>
            {/* Hamburger — solo visible en móvil */}
            <button
              className="show-mobile btn-ghost"
              onClick={() => setMobileMenuOpen(v => !v)}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#fff', alignItems: 'center', justifyContent: 'center', minHeight: 40, minWidth: 40 }}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MENÚ MÓVIL ──────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="mobile-menu" style={{
          position: 'fixed', top: 84, left: 16, right: 16, zIndex: 199,
          background: 'rgba(6,8,16,0.97)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16, padding: '12px 8px',
          flexDirection: 'column', gap: 4,
        }}>
          {[
            { label: 'Inicio',         anchor: null             },
            { label: 'Producto',       anchor: 'producto'       },
            { label: 'Automatización', anchor: 'automatizacion' },
            { label: 'Precios',        anchor: 'precios'        },
          ].map(({ label, anchor }) => (
            <button key={label} className="btn-ghost"
              onClick={() => { anchor ? document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }}
              style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', fontSize: 15, cursor: 'pointer', padding: '12px 16px', borderRadius: 10, textAlign: 'left', display: 'block' }}
            >
              {label}
            </button>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 8px' }} />
          <button className="btn-ghost"
            onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
            style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', fontSize: 15, cursor: 'pointer', padding: '12px 16px', borderRadius: 10, textAlign: 'left', display: 'block' }}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => { openLead('free'); setMobileMenuOpen(false); }}
            style={{ width: '100%', background: previewColor, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', padding: '13px 16px', borderRadius: 10, textAlign: 'center', display: 'block', marginTop: 4, boxShadow: `0 4px 20px ${previewColor}40` }}
          >
            Registrar club →
          </button>
        </div>
      )}

      <Hero previewColor={previewColor} openLead={openLead} />

      {/* ── DISCIPLINAS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 72px', maxWidth: 860, margin: '0 auto' }}>
        <Reveal>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 18 }}>
            Funciona para cualquier disciplina deportiva
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {[
              { emoji: '⚽', label: 'Fútbol' },       { emoji: '🏀', label: 'Basketball' },
              { emoji: '🏐', label: 'Voleibol' },      { emoji: '🎾', label: 'Pádel' },
              { emoji: '🏊', label: 'Natación' },      { emoji: '🚴', label: 'Ciclismo' },
              { emoji: '🥊', label: 'Boxeo' },         { emoji: '🥋', label: 'Artes Marciales' },
              { emoji: '🏋️', label: 'Fitness' },      { emoji: '🤸', label: 'Gimnasia' },
              { emoji: '🏑', label: 'Hockey' },        { emoji: '🏒', label: 'Hockey hielo' },
              { emoji: '🏈', label: 'Fútbol Americano' }, { emoji: '⚾', label: 'Béisbol' },
              { emoji: '🎿', label: 'Esquí' },         { emoji: '🏄', label: 'Surf' },
              { emoji: '🏇', label: 'Equitación' },    { emoji: '🤼', label: 'Lucha' },
              { emoji: '🏸', label: 'Bádminton' },     { emoji: '🥏', label: 'Ultimate' },
            ].map(d => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999, padding: '6px 14px', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                <span>{d.emoji}</span>{d.label}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: `${previewColor}10`, border: `1px solid ${previewColor}25`, borderRadius: 999, padding: '6px 14px', fontSize: 13, color: previewColor, transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s' }}>
              + cualquier deporte con afiliados
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 900, margin: '0 auto' }}>
        <Reveal>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>
            Resultados típicos de clubes que usan ZenSports
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
            {[
              { target: String(publicStats.jugadores), prefix: '+', suffix: '', label: 'jugadores gestionados', color: previewColor, icon: Users },
              { target: '8',   prefix: '',  suffix: 'h',   label: 'ahorradas por semana por club',        color: '#00D084',   icon: TrendingUp  },
              { target: '100', prefix: '',  suffix: '%',   label: 'cobros con seguimiento automático',    color: '#F5A623',   icon: CreditCard  },
              { target: '5',   prefix: '',  suffix: ' min',label: 'para configurar e iniciar',            color: '#AE68FF',   icon: Zap         },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div className="card-hover" style={{ textAlign: 'center', padding: '40px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)', borderRadius: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${s.color}50, transparent)`, animation: 'border-breathe 4s ease-in-out infinite' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 80, height: 80, background: `radial-gradient(circle, ${s.color}08 0%, transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: `${s.color}12`, border: `1px solid ${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: `0 0 20px ${s.color}10` }}>
                    <s.icon size={19} color={s.color} />
                  </div>
                  <div style={{ fontSize: 'clamp(40px, 5vw, 54px)', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 10, letterSpacing: '-1.5px', textShadow: `0 0 30px ${s.color}30` }}>
                    <Counter target={s.target} prefix={s.prefix} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{s.label}</div>
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
            { icon: FileText,      label: 'Pierdes horas en formularios manuales en papel o Excel'          },
            { icon: MessageCircle, label: 'Gastas 3 horas diarias persiguiendo pagos por WhatsApp'          },
            { icon: AlertTriangle, label: 'Pierdes $500.000+ al mes por pagos no registrados o cupos fantasma' },
            { icon: Users,         label: 'Inscripciones sin validación — cualquiera dice que pagó'          },
            { icon: Smartphone,    label: 'Tus jugadores tienen mala experiencia desde el celular'           },
            { icon: BarChart2,     label: 'No sabes quién pagó, quién debe o quién está activo hoy'         },
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

      <Reveal>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', maxWidth: 560, margin: '-40px auto 56px', lineHeight: 1.6 }}>
          Eso es más de lo que pagas por ZenSports cada mes en la mayoría de los planes.
        </p>
      </Reveal>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="producto" style={{ padding: '0 24px 88px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>La solución</p>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.8px' }}>
            ZenSports automatiza toda la experiencia.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            Desde la inscripción hasta el cobro, sin procesos manuales. Eficiencia desde el día uno.
          </p>
        </Reveal>
        <div className="bento-grid">
          {[
            {
              icon: Bot, color: previewColor,
              title: 'Automatización por WhatsApp',
              desc: 'El sistema calcula y prepara cada recordatorio de cobro automáticamente. Vos lo enviás con un clic desde tu propio WhatsApp — sin arriesgar tu número.',
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
            <div key={title} className={i === 0 || i === 3 ? 'bento-wide' : 'bento-narrow'}>
              <Reveal delay={i * 80} style={{ height: '100%' }}>
                <div style={{ background: `linear-gradient(135deg, ${color}40, rgba(255,255,255,0.06) 55%, ${color}18)`, borderRadius: 19, padding: '1px', height: '100%' }}>
                  <div className="card-hover" style={{ background: 'rgba(8,8,12,0.97)', borderRadius: 18, padding: '28px 24px', height: '100%', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}14`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} color={color} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 999, padding: '3px 10px', letterSpacing: 0.5 }}>{badge}</span>
                    </div>
                    <h3 style={{ fontSize: i === 0 || i === 3 ? 17 : 15, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>{title}</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* ── ASÍ FUNCIONA ─────────────────────────────────────────────────── */}
      <FlowDiagram />

      {/* ── IA / WHATSAPP ─────────────────────────────────────────────────── */}
      <section id="automatizacion" style={{ padding: '0 24px 96px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 56, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Reveal delay={0}>
            <WhatsAppMockup />
          </Reveal>
          <Reveal delay={100} style={{ maxWidth: 460, flexShrink: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>IA + Automatización</p>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 10, letterSpacing: '-0.8px' }}>
              Tu asistente virtual trabaja 24/7 por ti.
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 16, lineHeight: 1.5 }}>
              Reduce drásticamente el trabajo manual de admins y coordinadores sin contratar más personal.
            </p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 28 }}>
              ZenSports responde preguntas por WhatsApp y lee automáticamente cada comprobante de pago que te mandan tus jugadores — vos solo confirmás con un clic desde Conciliación. Y te prepara cada recordatorio de cobro listo para enviar. Sin hojas de cálculo. Sin escribir mensajes de cero.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                'Confirmación automática de inscripciones',
                'Validación inteligente de comprobantes',
                'Recordatorios de pago listos para enviar con un clic',
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
        <TechTrust />
        <Reveal delay={200}>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', maxWidth: 600, margin: '32px auto 0', lineHeight: 1.6 }}>
            La mayoría de clubes recuperan su inversión en ZenSports en el primer mes solo por reducción de mora y horas administrativas.
          </p>
        </Reveal>
      </section>

      {/* ── PERSONALIZACIÓN ──────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${previewColor}14 0%, rgba(6,8,16,0) 45%, ${previewColor}09 100%)`,
        borderTop: `1px solid ${previewColor}22`,
        borderBottom: `1px solid ${previewColor}18`,
        transition: 'background 0.55s cubic-bezier(0.16,1,0.3,1), border-color 0.55s',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow de fondo reactivo */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700, height: 400,
          background: `radial-gradient(ellipse, ${previewColor}0A 0%, transparent 70%)`,
          filter: 'blur(48px)', pointerEvents: 'none',
          transition: 'background 0.55s',
        }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 96px', position: 'relative', zIndex: 1 }}>
          <Reveal style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>Personalización</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.8px' }}>La interfaz con los colores de tu club.</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0 }}>Prueba los colores aquí mismo — así se verá tu app al registrarte.</p>
          </Reveal>

          {/* Botones de color */}
          <Reveal style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {PALETA.map(p => {
                const active = previewColor === p.hex;
                return (
                  <button
                    key={p.hex}
                    onClick={() => setPreviewColor(p.hex)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: active ? `${p.hex}1E` : 'rgba(255,255,255,0.04)',
                      border: active ? `1.5px solid ${p.hex}70` : '1.5px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                      transform: active ? 'scale(1.06)' : 'scale(1)',
                      boxShadow: active ? `0 0 18px ${p.hex}30` : 'none',
                      transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: 4, background: p.hex, flexShrink: 0,
                      boxShadow: active ? `0 0 8px ${p.hex}` : 'none',
                      transition: 'box-shadow 0.25s',
                    }} />
                    <span style={{
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      color: active ? p.hex : 'rgba(255,255,255,0.45)',
                      whiteSpace: 'nowrap', transition: 'color 0.25s',
                    }}>
                      {p.nombre}
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          <div style={{ display: 'flex', gap: 56, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Reveal delay={0} style={{ display: 'flex', flexDirection: 'column', gap: 20, flexShrink: 0, maxWidth: 290 }}>
              {/* Indicador color activo */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: `${previewColor}0E`, border: `1px solid ${previewColor}30`,
                borderRadius: 12, padding: '12px 18px',
                transition: 'background-color 0.35s, box-shadow 0.35s',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: previewColor, boxShadow: `0 0 14px ${previewColor}80`, transition: 'background-color 0.35s, box-shadow 0.35s', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: previewColor, transition: 'color 0.35s' }}>{colorActivo.nombre}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Color activo del club</div>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.7, margin: 0 }}>
                El color se aplica al escudo, barras, indicadores y acentos de toda la plataforma.<br />
                Puedes cambiarlo desde configuración en cualquier momento.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                {/* Toggle Oscuro / Claro */}
                <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 3, border: '1px solid rgba(255,255,255,0.10)' }}>
                  {[
                    { id: 'dark',  Icon: Moon, label: 'Oscuro' },
                    { id: 'light', Icon: Sun,  label: 'Claro'  },
                  ].map(({ id, Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setPreviewModo(id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 14px', borderRadius: 16, border: 'none',
                        background: previewModo === id ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: previewModo === id ? '#fff' : 'rgba(255,255,255,0.38)',
                        fontSize: 11, fontWeight: previewModo === id ? 700 : 400,
                        cursor: 'pointer', transition: 'background-color 0.2s, border-color 0.2s',
                      }}
                    >
                      <Icon size={11} /> {label}
                    </button>
                  ))}
                </div>
                <DashboardMockup color={previewColor} modo={previewModo} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── IMPACTO ANTES/DESPUÉS ─────────────────────────────────────────── */}
      <ImpactTable />

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
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${t.color}55, transparent)`, animation: 'border-breathe 5s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle, ${t.color}05 0%, transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', gap: 3, marginBottom: 18 }}>
                  {Array(t.stars).fill(0).map((_, si) => <Star key={si} size={13} fill="#F5A623" color="#F5A623" />)}
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 1.8, marginBottom: 22, fontStyle: 'italic', letterSpacing: 0.1 }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${t.color}22, ${t.color}08)`, border: `1.5px solid ${t.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: t.color, flexShrink: 0, boxShadow: `0 0 16px ${t.color}15` }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{t.name}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.38)' }}>{t.role} · {t.club}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── COMPARATIVA ──────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>Comparación</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.8px' }}>
            ¿Por qué no más Excel ni WhatsApp?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            Los clubes que migran a ZenSports recuperan en promedio 8 horas semanales de trabajo administrativo.
          </p>
        </Reveal>
        <MiniComparisonTable />

        <ExpandableComparison>
          <Reveal>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 200px', minWidth: 640 }}>

              {/* ─ Encabezados ─ */}
              <div style={{ padding: '18px 22px', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.08)' }} />
              {[
                { name: 'Google Sheets', sub: 'Hojas de cálculo' },
                { name: 'WhatsApp', sub: 'Gestión manual' },
              ].map(h => (
                <div key={h.name} style={{ padding: '18px 16px', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.08)', borderLeft: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{h.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>{h.sub}</div>
                </div>
              ))}
              <div style={{ padding: '18px 16px', background: 'rgba(106,0,255,0.10)', borderBottom: '1px solid rgba(106,0,255,0.28)', borderLeft: '1px solid rgba(106,0,255,0.22)', textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #6A00FF, #AE68FF)' }} />
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>ZenSports</div>
                <div style={{ fontSize: 10, color: '#AE68FF', marginTop: 3, fontWeight: 600 }}>The Sports OS</div>
              </div>

              {/* ─ Filas de datos ─ */}
              {[
                { feature: 'Inscripciones digitales',  sheets: { ok: false,     text: 'Manual, sin validación'              }, wa: { ok: false,     text: 'Por mensaje, sin historial'           }, zs: { ok: true, text: 'Formulario + validación automática' } },
                { feature: 'Cobros automáticos',        sheets: { ok: false,     text: 'No existe'                           }, wa: { ok: 'partial', text: 'Recordatorio manual, copiar/pegar'    }, zs: { ok: true, text: 'Cálculo automático + envío con un clic'} },
                { feature: 'Carnet digital QR',         sheets: { ok: false,     text: 'No disponible'                       }, wa: { ok: false,     text: 'No disponible'                        }, zs: { ok: true, text: 'QR verificable, descarga PDF'       } },
                { feature: 'Reporte financiero',        sheets: { ok: 'partial', text: 'Manual, propenso a errores'          }, wa: { ok: false,     text: 'No disponible'                        }, zs: { ok: true, text: 'Dashboard en tiempo real'           } },
                { feature: 'Portal del atleta',         sheets: { ok: false,     text: 'No disponible'                       }, wa: { ok: false,     text: 'No disponible'                        }, zs: { ok: true, text: 'App web + historial + pagos'        } },
                { feature: 'Control de morosidad',      sheets: { ok: false,     text: 'Sin automatización'                  }, wa: { ok: 'partial', text: 'Depende de recordar cada caso'        }, zs: { ok: true, text: 'Alertas automáticas + recordatorio con un clic' } },
                { feature: 'Multi-equipo / categorías', sheets: { ok: 'partial', text: 'Archivo por categoría, desconectado' }, wa: { ok: false,     text: 'Grupos separados sin control'        }, zs: { ok: true, text: 'Todo centralizado en una plataforma'} },
                { feature: 'Soporte dedicado',          sheets: { ok: false,     text: 'Solo tú'                             }, wa: { ok: false,     text: 'Solo tú'                              }, zs: { ok: true, text: 'Equipo Zenpra por WA siempre'       } },
              ].map(({ feature, sheets, wa, zs }, idx, arr) => {
                const isLast = idx === arr.length - 1;
                const rowBg = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)';
                const border = isLast ? 'none' : '1px solid rgba(255,255,255,0.05)';
                const cell = (s, isZs = false) => {
                  const Ic = s.ok === true ? CheckCircle : s.ok === 'partial' ? AlertTriangle : X;
                  const ic = s.ok === true ? '#00D084' : s.ok === 'partial' ? '#F5A623' : 'rgba(239,68,68,0.55)';
                  return (
                    <div style={{ padding: '14px 16px', background: isZs ? `rgba(106,0,255,${idx % 2 === 0 ? '0.04' : '0.07'})` : rowBg, borderBottom: border, borderLeft: isZs ? '1px solid rgba(106,0,255,0.15)' : '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textAlign: 'center' }}>
                      <Ic size={14} color={ic} strokeWidth={2.5} />
                      <span style={{ fontSize: 11, color: isZs ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)', lineHeight: 1.35 }}>{s.text}</span>
                    </div>
                  );
                };
                return (
                  <div key={feature} style={{ display: 'contents' }}>
                    <div style={{ padding: '14px 22px', background: rowBg, borderBottom: border, display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>{feature}</span>
                    </div>
                    {cell(sheets)}
                    {cell(wa)}
                    {cell(zs, true)}
                  </div>
                );
              })}
            </div>
          </div>
          </Reveal>
        </ExpandableComparison>
        <Reveal>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', maxWidth: 520, margin: '24px auto 0', lineHeight: 1.6 }}>
            Muchos clubes recuperan lo que pagan por ZenSports solo con 1–2 jugadores que dejan de "perderse" cada mes.
          </p>
        </Reveal>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="precios" style={{ padding: '0 24px 88px', maxWidth: 1200, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>Planes</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.8px' }}>Un plan para cada etapa.</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0 }}>
            Gratis · Trial · Starter · Pro · Scale · Sin permanencia
          </p>
        </Reveal>

        <Reveal style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            Precios en COP (pesos colombianos). <span style={{ color: 'rgba(255,255,255,0.2)' }}>Clientes fuera de Colombia: contáctanos para precios en tu moneda.</span>
          </p>
        </Reveal>

        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 18, alignItems: 'start' }}>

          {/* TRIAL */}
          <Reveal delay={0}>
            <div className="card-hover" style={{ background: 'rgba(0,208,132,0.03)', border: '1px solid rgba(0,208,132,0.15)', borderRadius: 22, padding: '28px 22px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(0,208,132,0.5), transparent)', borderRadius: '22px 22px 0 0' }} />
              <p style={{ color: '#00D084', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Trial</p>
              <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>$0<span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}> / 5 días</span></div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 14 }}>Prueba completa de la plataforma, sin tarjeta</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {['5 días gratis','Sin tarjeta','Todos los módulos','Soporte incluido'].map(l => (
                  <span key={l} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(0,208,132,0.07)', border: '1px solid rgba(0,208,132,0.18)', color: '#00D084' }}>{l}</span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
                {['Dashboard completo','Gestión de jugadores','Recordatorios de cobro listos en 1 clic','Carnet digital QR','Inscripciones digitales','Finanzas y estadísticas','Soporte por WhatsApp'].map(label => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <CheckCircle size={13} color="#00D084" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{label}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={() => openLead('free')} style={{ width: '100%', background: 'rgba(0,208,132,0.15)', border: '1px solid rgba(0,208,132,0.35)', color: '#00D084', fontSize: 13, fontWeight: 700, borderRadius: 11, padding: '11px 0', cursor: 'pointer', marginBottom: 8 }}>
                Comenzar 5 días gratis
              </button>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>Al finalizar el trial, elige tu plan</p>
            </div>
          </Reveal>

          {/* STARTER */}
          <Reveal delay={60}>
            <div className="card-hover" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 22, padding: '28px 22px' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Starter</p>
              <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>$149.000<span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/mes</span></div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14 }}>Clubes que empiezan a profesionalizarse</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {['120 jugadores','3 admins','5 entrenadores'].map(l => (
                  <span key={l} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.55)' }}>{l}</span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
                {[[true,'Dashboard completo'],[true,'Gestión de jugadores'],[true,'Pagos manuales y mora'],[true,'Carnet digital'],[true,'Inscripciones digitales'],[true,'Exportación CSV/PDF'],[true,'Recordatorios de cobro listos en 1 clic'],[false,'Finanzas y estadísticas']].map(([on, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9, opacity: on ? 1 : 0.28 }}>
                    <CheckCircle size={13} color={on ? '#00D084' : '#4B5563'} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: on ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)' }}>{label}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginBottom: 14, lineHeight: 1.5 }}>
                Con recuperar solo 2 mensualidades atrasadas al mes, este plan se paga solo.
              </p>
              <button className="btn-ghost" onClick={() => openLead('starter')} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 13, fontWeight: 600, borderRadius: 11, padding: '11px 0', cursor: 'pointer', marginBottom: 6 }}>
                Activar Starter
              </button>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '0 0 10px', lineHeight: 1.4 }}>Te ayudamos a activar por WhatsApp en minutos. Sin contratos.</p>
              <WhatsAppPayBtn plan="starter" />
            </div>
          </Reveal>

          {/* PRO ⭐ MOST POPULAR */}
          <Reveal delay={120}>
            <div className="card-hover" style={{ background: `linear-gradient(160deg, ${previewColor}10 0%, ${previewColor}06 100%)`, border: `2px solid ${previewColor}45`, borderRadius: 22, padding: '32px 22px', position: 'relative', boxShadow: `0 0 40px ${previewColor}20, 0 8px 32px rgba(0,0,0,0.4)`, transform: 'scale(1.03)', transition: 'background 0.4s, border-color 0.4s, box-shadow 0.4s, transform 0.4s' }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(90deg, ${previewColor}, ${previewColor}cc)`, color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '5px 18px', letterSpacing: 1, whiteSpace: 'nowrap', boxShadow: `0 4px 20px ${previewColor}70`, transition: 'background 0.3s, box-shadow 0.3s' }}>
                ⭐ Más elegido · Recomendado para clubes en crecimiento
              </div>
              <p style={{ color: previewColor, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, transition: 'color 0.3s' }}>Pro</p>
              <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>$399.000<span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/mes</span></div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Academias competitivas y clubes serios</p>
              <p style={{ fontSize: 11, color: `${previewColor}99`, fontWeight: 600, marginBottom: 14, transition: 'color 0.3s' }}>La mayoría de clubes competitivos empieza aquí.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {['350 jugadores','10 admins','20 entrenadores'].map(l => (
                  <span key={l} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: `${previewColor}15`, border: `1px solid ${previewColor}30`, color: previewColor, transition: 'background 0.3s, border-color 0.3s, color 0.3s' }}>{l}</span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
                {[[true,'Todo Starter'],[true,'Finanzas e ingresos/gastos'],[true,'Uniformes y equipamiento'],[true,'Gestión de torneos'],[true,'Soporte prioritario']].map(([, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <CheckCircle size={13} color="#00D084" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{label}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', marginBottom: 14, lineHeight: 1.5 }}>
                Con evitar perder 1 jugador al mes por desorden administrativo, el plan Pro ya es rentable.
              </p>
              <button className="btn-primary" onClick={() => openLead('pro')} style={{ width: '100%', background: `linear-gradient(135deg, ${previewColor}, ${previewColor}cc)`, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 11, padding: '13px 0', cursor: 'pointer', boxShadow: `0 6px 28px ${previewColor}60`, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 0.3s, box-shadow 0.3s' }}>
                Escalar mi club <ChevronRight size={15} />
              </button>
              <WhatsAppPayBtn plan="pro" />
            </div>
          </Reveal>

          {/* SCALE */}
          <Reveal delay={180}>
            <div className="card-hover" style={{ background: 'rgba(198,120,255,0.04)', border: '1px solid rgba(198,120,255,0.18)', borderRadius: 22, padding: '28px 22px' }}>
              <p style={{ color: '#C678FF', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Scale</p>
              <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>$799.000<span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/mes</span></div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14 }}>Academias premium y multi sede</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {['1.000 jugadores','Admins ilimitados','Entrenadores ilimitados'].map(l => (
                  <span key={l} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(198,120,255,0.08)', border: '1px solid rgba(198,120,255,0.22)', color: '#C678FF' }}>{l}</span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
                {['Todo Pro','Conciliación bancaria','Jugadores y administradores ilimitados','Soporte VIP','Capacitación personalizada'].map(label => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <CheckCircle size={13} color="#00D084" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{label}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'rgba(198,120,255,0.5)', fontStyle: 'italic', marginBottom: 14, lineHeight: 1.5 }}>
                Pensado para academias que no quieren perder NI UN jugador ni un peso por falta de control.
              </p>
              <button className="btn-ghost" onClick={() => openLead('scale')} style={{ width: '100%', background: 'rgba(198,120,255,0.08)', border: '1px solid rgba(198,120,255,0.28)', color: '#C678FF', fontSize: 13, fontWeight: 700, borderRadius: 11, padding: '11px 0', cursor: 'pointer', marginBottom: 10 }}>
                Probar 5 días gratis
              </button>
              <WhatsAppPayBtn plan="scale" />
            </div>
          </Reveal>

        </div>

        {/* GRATIS — franja horizontal */}
        <Reveal delay={0}>
          <div style={{ marginTop: 14, borderRadius: 18, padding: '20px 28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            {/* Label + precio */}
            <div style={{ minWidth: 120 }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 3px' }}>Gratis</p>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>$0<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}> / siempre</span></div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '4px 0 0' }}>Para clubes pequeños</p>
            </div>

            {/* Separador */}
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} className="hide-mobile" />

            {/* Límites */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['20 jugadores','1 admin','Sin tarjeta'].map(l => (
                <span key={l} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>{l}</span>
              ))}
            </div>

            {/* Separador */}
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} className="hide-mobile" />

            {/* Features incluidas */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', flex: 1 }}>
              {['Dashboard básico','Gestión de jugadores','Carnet digital QR','Inscripciones digitales'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={12} color="#6A9FFF" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button onClick={() => openLead('free')} style={{ flexShrink: 0, padding: '10px 22px', borderRadius: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Crear cuenta gratis
            </button>
          </div>
        </Reveal>

        {/* Value message */}
        <Reveal>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', margin: '16px 0 4px', lineHeight: 1.6 }}>
            Por menos de lo que cuesta un balón profesional al mes, tienes tu club 100% organizado y cobrando a tiempo.
          </p>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic', margin: '0 0 0', lineHeight: 1.6 }}>
            Muchos clubes recuperan la inversión en ZenSports en el primer mes solo por reducción de mora y horas administrativas.
          </p>
        </Reveal>

        {/* ENTERPRISE */}
        <Reveal delay={240}>
          <div style={{ marginTop: 20, borderRadius: 22, padding: '32px 40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Enterprise</p>
              <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Custom Pricing</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>Para ligas, federaciones, franquicias y organizaciones globales</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flex: 1, justifyContent: 'center' }}>
              {['Infraestructura dedicada','SLA enterprise','Multi región','Soporte dedicado','Integraciones custom','API'].map(f => (
                <span key={f} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>{f}</span>
              ))}
            </div>
            <a href={`https://wa.me/${WA_NUMBER}?text=${WA_PAYMENT_MSG.enterprise}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              <MessageCircle size={15} /> Hablar con ventas
            </a>
          </div>
        </Reveal>

        {/* Trust badges */}
        <Reveal>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 24, marginTop: 36 }}>
            {['✅ Setup gratuito','✅ Migración incluida','✅ Soporte por WhatsApp','✅ Sin permanencia','✅ Activa tu club en 24 horas'].map(b => (
              <span key={b} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.3 }}>{b}</span>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>
            Te guiamos paso a paso por WhatsApp para activar tu plan en minutos, sin contratos ni papeleo.
          </p>
        </Reveal>
      </section>

      {/* ── SEGURIDAD Y CONFIANZA ────────────────────────────────────────── */}
      <SecuritySection />

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px', maxWidth: 760, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>Preguntas frecuentes</p>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, letterSpacing: '-0.5px' }}>Todo lo que necesitas saber.</h2>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              q: '¿Necesito conocimientos técnicos para usar ZenSports?',
              a: 'No. ZenSports está diseñado para directores de club, no para ingenieros. El onboarding toma menos de 10 minutos y tienes soporte por WhatsApp incluido.',
            },
            {
              q: '¿Mis datos de jugadores están seguros?',
              a: 'Sí. Los datos están almacenados en servidores seguros con cifrado. Solo tú y los administradores de tu club tienen acceso. No compartimos información con terceros.',
            },
            {
              q: '¿Puedo cancelar en cualquier momento?',
              a: 'Absolutamente. Sin permanencia, sin letra pequeña. Si decides cancelar, tus datos siguen disponibles por 30 días para que puedas exportarlos.',
            },
            {
              q: '¿Funciona para deportes distintos al fútbol?',
              a: 'Sí. ZenSports funciona para cualquier organización con miembros: escuelas de natación, gimnasios, academias de artes marciales, clubes de tenis y más.',
            },
            {
              q: '¿Qué pasa al terminar los 5 días de prueba?',
              a: 'Te avisamos con anticipación y puedes elegir un plan. Si decides no continuar, no se cobra nada. No pedimos tarjeta de crédito para la prueba.',
            },
            {
              q: '¿El bot de WhatsApp reemplaza a mi administrador?',
              a: 'Lo complementa. El bot responde preguntas y lee cada comprobante de pago automáticamente, dejándolo listo para que lo confirmes con un clic. Para el cobro, te prepara cada recordatorio — vos das el envío final con un clic, así protegemos tu número de WhatsApp.',
            },
          ].map(({ q, a }, i) => (
            <FaqItem key={i} q={q} a={a} delay={i * 50} />
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div style={{
            borderRadius: 26, padding: '72px 48px',
            background: `linear-gradient(135deg, ${previewColor}09 0%, rgba(0,208,132,0.06) 100%)`,
            border: `1px solid ${previewColor}22`,
            position: 'relative', overflow: 'hidden',
            transition: 'background-color 0.4s, border-color 0.4s, box-shadow 0.4s, color 0.4s',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${previewColor}55, rgba(0,208,132,0.4), transparent)`, transition: 'background 0.4s' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 300, background: `radial-gradient(ellipse, ${previewColor}06 0%, transparent 70%)`, pointerEvents: 'none', transition: 'background-color 0.4s, border-color 0.4s, box-shadow 0.4s, color 0.4s' }} />
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
                  onClick={() => openLead('demo')}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, background: `linear-gradient(135deg, ${previewColor}, ${previewColor}cc)`, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 12, padding: '15px 36px', cursor: 'pointer', boxShadow: `0 8px 32px ${previewColor}50`, transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s' }}
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
      <footer className="site-footer" style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(4,4,12,0.95)', overflow: 'hidden' }}>
        {/* Glow decorativo */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 1, background: `linear-gradient(90deg, transparent, ${previewColor}60, rgba(0,208,132,0.4), transparent)`, transition: 'background 0.4s' }} />
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 700, height: 300, background: `radial-gradient(ellipse, ${previewColor}07 0%, transparent 70%)`, pointerEvents: 'none', transition: 'background 0.4s' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '60px 24px 40px' }}>
          {/* Fila principal */}
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>

            {/* Marca */}
            <div>
              <div style={{ marginBottom: 16 }}>
                <ZenSportsLogo variant="icon-svg" size={40} />
              </div>
              <p style={{ fontSize: 18, fontFamily: "'Sport Event','Space Grotesk',sans-serif", letterSpacing: 3, color: '#fff', margin: '0 0 8px' }}>ZENSPORTS</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 220 }}>
                La plataforma de gestión deportiva con IA para clubes de toda Latinoamérica.
              </p>
              {/* Stats mini */}
              <div style={{ display: 'flex', gap: 20 }}>
                {[['5★', 'Valoración'], ['24h', 'Soporte'], ['5d', 'Trial gratis']].map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: previewColor, transition: 'color 0.4s' }}>{v}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Producto */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 18 }}>Producto</p>
              {[
                { label: 'Iniciar sesión', action: () => navigate('/login') },
                { label: 'Registrar club', action: () => openLead('free') },
                { label: 'Ver precios', action: () => document.getElementById('precios')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'Solicitar demo', action: () => openLead('demo') },
              ].map(({ label, action }) => (
                <button key={label} onClick={action} style={{ display: 'block', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', padding: '5px 0', textAlign: 'left', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >{label}</button>
              ))}
            </div>

            {/* Plataformas */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 18 }}>Plataformas</p>
              {[
                { label: 'ZenSports', sub: 'Gestión de clubes' },
              ].map(({ label, sub }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '0 0 2px', fontWeight: 600 }}>{label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, margin: 0 }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Contacto */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 18 }}>Contacto</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href={`https://wa.me/573023903192`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#25D366', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <a href="mailto:hola@zenpra.ai"
                  style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                >hola@zenpra.ai</a>
                <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, margin: 0, lineHeight: 1.5 }}>Respuesta en menos de 24h · 🇨🇴 🇲🇽 🇦🇷 🇨🇱 🇵🇪 🇪🇨 y más</p>
              </div>
            </div>
          </div>

          {/* Barra inferior */}
          <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0 }}>© 2026 ZenSports · <span style={{ color: 'rgba(255,255,255,0.18)' }}>Creado por</span> <span style={{ color: previewColor, fontWeight: 600, transition: 'color 0.4s' }}>Zenpra</span></p>
            <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11, margin: 0, fontStyle: 'italic', letterSpacing: 0.5 }}>AI Powering Performance</p>
          </div>
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
          style={{ width: '100%', background: previewColor, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 12, padding: '15px', cursor: 'pointer', boxShadow: `0 4px 20px ${previewColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s' }}
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

      {/* ── WHATSAPP FLOTANTE ─────────────────────────────────────────── */}
      <a
        href={`https://wa.me/573023903192?text=${encodeURIComponent('¡Hola ZenSports! 👋 Vi la plataforma y me interesa registrar mi club. ¿Me pueden guiar para empezar el trial de 5 días? 🚀')}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Chatea con nosotros por WhatsApp"
        className="wa-float"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 400,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #25D366, #128C7E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37,211,102,0.45), 0 2px 8px rgba(0,0,0,0.3)',
          textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(37,211,102,0.6), 0 2px 8px rgba(0,0,0,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,211,102,0.45), 0 2px 8px rgba(0,0,0,0.3)'; }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
