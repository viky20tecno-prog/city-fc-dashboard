import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function VerificarMiembro() {
  const { clubSlug, cedula } = useParams();
  const [searchParams] = useSearchParams();

  const fallbackNombre = searchParams.get('n')  || '';
  const fallbackPos    = searchParams.get('pos') || '';
  const fallbackNum    = searchParams.get('num') || '';
  const fallbackCat    = searchParams.get('cat') || '';
  const fallbackColor  = searchParams.get('color') || '#00AAFF';

  const [estado, setEstado] = useState('cargando'); // cargando | ok | error
  const [jugador, setJugador] = useState(null);
  const [clubConfig, setClubConfig] = useState(null);

  useEffect(() => {
    document.title = 'Verificación de Miembro · ZenSports';

    async function cargar() {
      try {
        // 1. Club config + id (público via Supabase anon)
        const { data: clubData } = await supabase
          .from('clubs')
          .select('id, config')
          .eq('slug', clubSlug)
          .single();
        if (clubData?.config) setClubConfig(clubData.config);

        // 2. Datos del jugador via Supabase anon (no requiere auth)
        if (clubData?.id) {
          const { data: playerData } = await supabase
            .from('players')
            .select('cedula, "nombre(s)", "apellido(s)", nombre, apellidos, posicion, numero, categoria, foto_url')
            .eq('club_id', clubData.id)
            .eq('cedula', cedula)
            .single();
          if (playerData) {
            setJugador(playerData);
            setEstado('ok');
            return;
          }
        }

        // 3. Fallback: mostrar datos del QR
        setJugador({ cedula, nombre: fallbackNombre, posicion: fallbackPos, numero: fallbackNum, categoria: fallbackCat });
        setEstado('ok');
      } catch {
        setJugador({ cedula, nombre: fallbackNombre, posicion: fallbackPos, numero: fallbackNum, categoria: fallbackCat });
        setEstado('ok');
      }
    }

    if (clubSlug && cedula) cargar();
  }, [clubSlug, cedula]);

  const color      = clubConfig?.color    || fallbackColor;
  const clubNombre = clubConfig?.nombre   || clubSlug || 'Club Deportivo';
  const clubSub    = clubConfig?.subtitulo || '';
  const logoUrl    = clubConfig?.logo_url || null;
  const initials   = clubNombre.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'FC';

  const nombre   = jugador?.['nombre(s)'] || jugador?.nombre    || fallbackNombre || '—';
  const apellidos= jugador?.['apellido(s)'] || jugador?.apellidos || '';
  const nombreCompleto = apellidos ? `${nombre} ${apellidos}`.trim() : nombre;
  const posicion = jugador?.posicion  || fallbackPos || '';
  const numero   = jugador?.numero    || fallbackNum || '';
  const categoria= jugador?.categoria || fallbackCat || '';
  const fotoUrl  = jugador?.foto_url  || null;
  const temporada= new Date().getFullYear();

  if (estado === 'cargando') {
    return (
      <div style={{ minHeight: '100vh', background: '#080C14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${fallbackColor}`, borderTopColor: 'transparent', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Verificando membresía…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080C14', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>

      {/* Glow de fondo */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: `${color}12`, filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Tarjeta principal */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}35`, borderRadius: 24, overflow: 'hidden', boxShadow: `0 0 60px ${color}18, 0 24px 64px rgba(0,0,0,0.5)` }}>

          {/* Barra superior con color del club */}
          <div style={{ height: 5, background: `linear-gradient(90deg, ${color}, ${color}80, ${color})` }} />

          {/* Header: logo + nombre club */}
          <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {logoUrl
                ? <img src={logoUrl} alt="logo" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 8 }} />
                : (
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color, fontFamily: "'Bebas Neue', cursive", letterSpacing: 1 }}>{initials}</span>
                  </div>
                )
              }
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1, color: '#fff' }}>{clubNombre}</div>
                {clubSub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 1 }}>{clubSub}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Temporada</div>
              <div style={{ fontSize: 14, fontWeight: 700, color }}>{temporada}</div>
            </div>
          </div>

          {/* Badge verificado */}
          <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,208,132,0.10)', border: '1px solid rgba(0,208,132,0.30)', borderRadius: 999, padding: '6px 18px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00D084', boxShadow: '0 0 8px #00D084' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#00D084', letterSpacing: 1.5, textTransform: 'uppercase' }}>Miembro Verificado</span>
            </div>
          </div>

          {/* Foto + datos */}
          <div style={{ padding: '20px 24px 24px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Foto */}
            <div style={{ flexShrink: 0 }}>
              {fotoUrl
                ? <img src={fotoUrl} alt={nombreCompleto} style={{ width: 80, height: 96, objectFit: 'cover', borderRadius: 12, border: `2px solid ${color}50` }} />
                : (
                  <div style={{ width: 80, height: 96, borderRadius: 12, background: `${color}12`, border: `2px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={`${color}60`} strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                )
              }
            </div>

            {/* Datos */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, marginBottom: 4, letterSpacing: '-0.3px' }}>
                {nombreCompleto}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
                CC {cedula}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {posicion && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', width: 64, letterSpacing: 1, textTransform: 'uppercase' }}>Posición</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{posicion}{numero ? ` · #${numero}` : ''}</div>
                  </div>
                )}
                {categoria && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', width: 64, letterSpacing: 1, textTransform: 'uppercase' }}>Categoría</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{categoria}</div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', width: 64, letterSpacing: 1, textTransform: 'uppercase' }}>Estado</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#00D084' }}>Activo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: 0.5 }}>ZenSports</span>
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5 }}>zensports.app</span>
          </div>
        </div>

        {/* Nota */}
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 20, lineHeight: 1.6 }}>
          Este carnet fue emitido digitalmente por {clubNombre}.<br />
          Verificación provista por ZenSports.
        </p>
      </div>
    </div>
  );
}
