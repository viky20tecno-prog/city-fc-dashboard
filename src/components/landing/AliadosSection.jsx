import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Handshake } from 'lucide-react';
import { API_BASE_URL, SUPPORT_WHATSAPP } from '../../config';

/* ── Reveal local (mismo patrón que useReveal/Reveal en LandingPage.jsx,
   duplicado acá porque este componente vive en su propio archivo, igual
   que Hero.jsx no importa nada de LandingPage.jsx) ─────────────────────── */
// Ref de callback en vez de useRef+useEffect: se re-ejecuta la primera vez
// que el nodo realmente aparece en el DOM, sin depender de en qué render
// ocurra eso — más robusto que un efecto con deps [] si el componente algún
// día vuelve a tener un camino que retrase el montado del div.
function useReveal() {
  const [visible, setVisible] = useState(false);
  const obsRef = useRef(null);
  const setRef = useCallback((el) => {
    if (obsRef.current) { obsRef.current.disconnect(); obsRef.current = null; }
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    obsRef.current = obs;
  }, []);
  return [setRef, visible];
}

// Cada tier tiene su propio color de acento (antes solo Oro tenía color real,
// Plata/Bronce usaban gris genérico — por eso se veían planas). `featured`
// solo lo lleva Oro: borde más grueso, glow de sombra y el badge "★ Destacado"
// en vez de la etiqueta simple, mismo lenguaje que la tarjeta Pro destacada
// de la sección de precios (gradiente + borde de color + glow + badge).
const TIER_STYLE = {
  oro:    { border: 'rgba(245,166,35,0.45)',  badge: '#F5A623', label: 'Aliado Oro',   featured: true  },
  plata:  { border: 'rgba(199,203,209,0.35)', badge: '#C7CBD1', label: 'Aliado Plata', featured: false },
  bronce: { border: 'rgba(205,138,90,0.32)',  badge: '#CD8A5A', label: 'Aliado',       featured: false },
};

const TIER_ORDER = { oro: 0, plata: 1, bronce: 2 };

// Precio de referencia por tier — solo para el texto del espacio vacío
// ("Espacio disponible"). El precio real y editable de cada afiliado vive en
// `afiliados.precio_mensual` (admin console) — si cambia el precio de venta,
// actualizar también `AFILIADO_TIER_PRICE` en admin/lib/utils.ts.
const TIER_PRECIO_REF = { oro: 149900, plata: 99900, bronce: 49900 };

/* ── Sección "Aliados" — organizaciones, tiendas deportivas o de servicios
   relacionados con el deporte que pagan una membresía mensual por aparecer
   ante los jugadores de los clubes en ZenSports (no son clubes ni tienen
   relación con los planes que paga un club). Se muestra en la Landing
   pública y en el Portal del Atleta — nunca en el bot de WhatsApp (decisión
   explícita, para no sentirse invasivo).
   Siempre se renderizan los 3 espacios (Oro/Plata/Bronce): el que no tenga
   un afiliado real todavía se ve como "Espacio disponible" — así se puede
   ver la sección completa desde el día uno y se va llenando sola a medida
   que se cargan afiliados reales, sin tocar este componente de nuevo. ────── */
export default function AliadosSection() {
  const [ref, visible] = useReveal();
  const [afiliados, setAfiliados] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/publico/afiliados`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.success && Array.isArray(data.afiliados)) setAfiliados(data.afiliados); })
      .catch(() => { /* sección opcional: si falla, simplemente no se muestra */ });
  }, []);

  const reales = [...afiliados].sort((a, b) => (TIER_ORDER[a.tier] ?? 3) - (TIER_ORDER[b.tier] ?? 3));
  const tiersConReal = new Set(reales.map(a => a.tier));
  const placeholders = ['oro', 'plata', 'bronce']
    .filter(t => !tiersConReal.has(t))
    .map(t => ({ id: `placeholder-${t}`, tier: t, placeholder: true }));
  const ordenados = [...reales, ...placeholders].sort((a, b) => (TIER_ORDER[a.tier] ?? 3) - (TIER_ORDER[b.tier] ?? 3));

  return (
    <section style={{ padding: '0 24px 88px', maxWidth: 1100, margin: '0 auto' }}>
      <div ref={ref} style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>
            Nuestros aliados
          </p>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Marcas de confianza para tu club
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 12, maxWidth: 520, margin: '12px auto 0', lineHeight: 1.6 }}>
            Comercios y servicios que acompañan a clubes y familias dentro de ZenSports.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {ordenados.map(a => {
            const tierStyle = TIER_STYLE[a.tier] || TIER_STYLE.bronce;

            if (a.placeholder) {
              const mensaje = `¡Hola! Vi el espacio de Aliado ${tierStyle.label.replace('Aliado ', '') || a.tier} en ZenSports y quiero información para anunciar mi negocio ahí.`;
              return (
                <a key={a.id}
                  href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(mensaje)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="card-hover"
                  style={{
                    display: 'block', textDecoration: 'none', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1.5px dashed ${tierStyle.border}`, borderRadius: 20,
                    padding: '26px 20px 22px', position: 'relative', overflow: 'hidden',
                    transition: 'border-color .25s, background .25s',
                  }}>
                  <span style={{
                    position: 'absolute', top: 16, right: 16, display: 'inline-flex', alignItems: 'center',
                    fontSize: 9.5, fontWeight: 800, color: tierStyle.badge,
                    background: `${tierStyle.badge}1c`, border: `1px solid ${tierStyle.badge}45`, borderRadius: 999,
                    padding: '4px 9px', letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>
                    {tierStyle.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 13, paddingRight: 64 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: 'rgba(255,255,255,0.03)', border: `1.5px dashed ${tierStyle.badge}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Handshake size={20} color={`${tierStyle.badge}80`} strokeWidth={2} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>Espacio disponible</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.32)' }}>Tu marca acá</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: 0, marginBottom: 12 }}>
                    Desde {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(TIER_PRECIO_REF[a.tier])}/mes
                  </p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: tierStyle.badge }}>
                    Reservar por WhatsApp <ExternalLink size={11} />
                  </span>
                </a>
              );
            }

            const Wrapper = a.link_web ? 'a' : 'div';
            const wrapperProps = a.link_web
              ? { href: a.link_web, target: '_blank', rel: 'noopener noreferrer' }
              : {};
            return (
              <Wrapper key={a.id} className="card-hover" {...wrapperProps} style={{
                display: 'block', textDecoration: 'none', cursor: a.link_web ? 'pointer' : 'default',
                background: `linear-gradient(160deg, ${tierStyle.badge}15 0%, ${tierStyle.badge}05 55%, rgba(255,255,255,0.015) 100%)`,
                border: `${tierStyle.featured ? 2 : 1}px solid ${tierStyle.border}`, borderRadius: 20,
                padding: '26px 20px 22px', position: 'relative', overflow: 'hidden',
                boxShadow: tierStyle.featured
                  ? `0 0 44px ${tierStyle.badge}26, 0 10px 30px rgba(0,0,0,0.4)`
                  : '0 6px 20px rgba(0,0,0,0.22)',
                transition: 'transform .25s, box-shadow .25s, border-color .25s',
              }}>
                {/* barra de acento — mismo tono que el resto de la tarjeta, más marcada en Oro */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, transparent, ${tierStyle.badge}, transparent)`,
                  opacity: tierStyle.featured ? 0.9 : 0.4,
                }} />

                {/* pill de tier — antes solo Oro tenía distintivo, ahora las 3 lo llevan */}
                <span style={{
                  position: 'absolute', top: 16, right: 16, display: 'inline-flex', alignItems: 'center',
                  fontSize: 9.5, fontWeight: 800, color: tierStyle.badge,
                  background: `${tierStyle.badge}1c`, border: `1px solid ${tierStyle.badge}45`, borderRadius: 999,
                  padding: '4px 9px', letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap',
                  boxShadow: tierStyle.featured ? `0 0 16px ${tierStyle.badge}45` : 'none',
                }}>
                  {tierStyle.featured ? '★ Destacado' : tierStyle.label}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 13, paddingRight: 64 }}>
                  {a.logo_url ? (
                    <img src={a.logo_url} alt={a.nombre} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain', background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${tierStyle.badge}35`, flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: `linear-gradient(160deg, ${tierStyle.badge}22, rgba(255,255,255,0.03))`,
                      border: `1.5px solid ${tierStyle.badge}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Handshake size={20} color={tierStyle.badge} strokeWidth={2} />
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.42)' }}>
                      {[a.categoria, a.ciudad].filter(Boolean).join(' · ') || 'Aliado ZenSports'}
                    </div>
                  </div>
                </div>
                {a.descripcion && (
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.52)', lineHeight: 1.6, margin: 0, marginBottom: a.link_web ? 12 : 0 }}>
                    {a.descripcion}
                  </p>
                )}
                {a.link_web && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: tierStyle.badge }}>
                    Visitar <ExternalLink size={11} />
                  </span>
                )}
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
