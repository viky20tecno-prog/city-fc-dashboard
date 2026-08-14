import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Handshake } from 'lucide-react';
import { API_BASE_URL } from '../../config';

/* ── Reveal local (mismo patrón que useReveal/Reveal en LandingPage.jsx,
   duplicado acá porque este componente vive en su propio archivo, igual
   que Hero.jsx no importa nada de LandingPage.jsx) ─────────────────────── */
// Ref de callback en vez de useRef+useEffect: acá el <div ref> solo se monta
// DESPUÉS de que llega /publico/afiliados (antes de eso el componente entero
// devuelve null), así que un efecto con deps [] corre demasiado temprano —
// ref.current todavía es null en ese momento y el observer nunca se arma. El
// ref de callback se re-ejecuta la primera vez que el nodo realmente aparece
// en el DOM, sin importar cuándo sea eso.
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

const TIER_STYLE = {
  oro:    { border: 'rgba(245,166,35,0.28)', glow: 'rgba(245,166,35,0.08)', badge: '#F5A623', label: 'Aliado Oro' },
  plata:  { border: 'rgba(255,255,255,0.16)', glow: 'rgba(255,255,255,0.03)', badge: '#C7CBD1', label: 'Aliado Plata' },
  bronce: { border: 'rgba(255,255,255,0.09)', glow: 'rgba(255,255,255,0.015)', badge: '#CD8A5A', label: 'Aliado' },
};

const TIER_ORDER = { oro: 0, plata: 1, bronce: 2 };

/* ── Sección "Aliados" — patrocinadores/anunciantes (no clubes) que pagan
   una membresía mensual por aparecer en la plataforma. Se muestra en la
   Landing pública y en el Portal del Atleta — nunca en el bot de WhatsApp
   (decisión explícita, para no sentirse invasivo). Si no hay afiliados
   activos, la sección no se renderiza. ───────────────────────────────────── */
export default function AliadosSection() {
  const [ref, visible] = useReveal();
  const [afiliados, setAfiliados] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/publico/afiliados`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.success && Array.isArray(data.afiliados)) setAfiliados(data.afiliados); })
      .catch(() => { /* sección opcional: si falla, simplemente no se muestra */ });
  }, []);

  if (afiliados.length === 0) return null;

  const ordenados = [...afiliados].sort((a, b) => (TIER_ORDER[a.tier] ?? 3) - (TIER_ORDER[b.tier] ?? 3));

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
            const Wrapper = a.link_web ? 'a' : 'div';
            const wrapperProps = a.link_web
              ? { href: a.link_web, target: '_blank', rel: 'noopener noreferrer' }
              : {};
            return (
              <Wrapper key={a.id} {...wrapperProps} style={{
                display: 'block', textDecoration: 'none',
                background: tierStyle.glow, border: `1px solid ${tierStyle.border}`, borderRadius: 18,
                padding: '22px 20px', position: 'relative', transition: 'transform .2s, border-color .2s',
              }}>
                {a.tier === 'oro' && (
                  <span style={{
                    position: 'absolute', top: 14, right: 14, fontSize: 9, fontWeight: 800, color: tierStyle.badge,
                    background: `${tierStyle.badge}18`, border: `1px solid ${tierStyle.badge}40`, borderRadius: 999,
                    padding: '3px 8px', letterSpacing: 0.5, textTransform: 'uppercase',
                  }}>
                    ★ Destacado
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  {a.logo_url ? (
                    <img src={a.logo_url} alt={a.nombre} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Handshake size={18} color="rgba(255,255,255,0.4)" />
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>
                      {[a.categoria, a.ciudad].filter(Boolean).join(' · ') || 'Aliado ZenSports'}
                    </div>
                  </div>
                </div>
                {a.descripcion && (
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0, marginBottom: a.link_web ? 10 : 0 }}>
                    {a.descripcion}
                  </p>
                )}
                {a.link_web && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
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
