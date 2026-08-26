import { useState, useEffect } from 'react';
import {
  Printer, Instagram, Facebook, Youtube, Globe, Music, Link,
  User, IdCard, Calendar, Shirt, Phone, HeartPulse, Hash, Shield, CalendarCheck,
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import { getClubId } from '../../services/api';
import { temaCarnetV2 as temaCarnet, WATERMARK_LOGO_STYLE, textoSobre } from '../../lib/carnetFondos';

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function EscudoSVG({ size = 32, color = 'var(--cc)', initials = 'FC' }) {
  const h = Math.round(size * 44 / 38);
  return (
    <svg width={size} height={h} viewBox="0 0 38 44" fill="none">
      <path d="M19 2L3 8.5V22C3 32.8 10 40.5 19 43C28 40.5 35 32.8 35 22V8.5L19 2Z"
            fill="#1A0A04" stroke={color} strokeWidth="1.4" />
      <path d="M19 5L6 10.8V22C6 31.4 11.5 38.2 19 40.5C26.5 38.2 32 31.4 32 22V10.8L19 5Z"
            fill={`${color}12`} stroke={`${color}30`} strokeWidth="0.8" />
      <line x1="6" y1="21" x2="32" y2="21" stroke={color} strokeWidth="0.7" opacity="0.4" />
      <text x="19" y="19" textAnchor="middle" fill={color}
            fontFamily="Sport Event, sans-serif" fontSize={initials.length > 2 ? '8' : '9.5'} letterSpacing="1.5">
        {initials.slice(0, 3)}
      </text>
      <line x1="13" y1="24" x2="25" y2="24" stroke="#B68631" strokeWidth="0.8" opacity="0.6" />
      <text x="19" y="35" textAnchor="middle" fill="#B68631" fontFamily="Arial" fontSize="6.5" letterSpacing="1">★ ★ ★</text>
    </svg>
  );
}

function Watermark({ logoUrl, initials, clubColor }) {
  return logoUrl
    ? <img src={logoUrl} alt="" style={WATERMARK_LOGO_STYLE} />
    : (
      <div style={{ ...WATERMARK_LOGO_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EscudoSVG size={90} color={clubColor} initials={initials} />
      </div>
    );
}

function LogoHeader({ variant, clubColor, th, logoUrl, initials, clubNombre, clubSub }) {
  return (
    <div style={{
      position: 'relative', zIndex: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: variant === 'dorso' ? '12px 16px 9px' : '15px 16px 0',
      // Scrim para que el nombre/subtítulo del club se lean siempre, sin
      // importar si las rayas diagonales del fondo pasan justo por debajo.
      background: 'linear-gradient(180deg,rgba(3,3,4,0.6) 0%,rgba(3,3,4,0.28) 70%,transparent 100%)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {logoUrl
          ? <img src={logoUrl} alt="logo" style={{ width: variant === 'dorso' ? '22px' : '28px', height: variant === 'dorso' ? '22px' : '28px', objectFit: 'contain' }} />
          : <EscudoSVG size={variant === 'dorso' ? 18 : 24} color={clubColor} initials={initials} />}
        <div>
          <div style={{ fontFamily: "'Sport Event',cursive", fontSize: variant === 'dorso' ? '13px' : '16px', letterSpacing: '2.5px', color: th.textPri, lineHeight: 1 }}>
            {clubNombre}
          </div>
          {clubSub && (
            <div style={{ fontSize: '7px', letterSpacing: '2px', color: th.textMut, textTransform: 'uppercase', marginTop: '2px' }}>
              {clubSub}
            </div>
          )}
        </div>
      </div>
      {variant === 'dorso' && (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '8px', letterSpacing: '1.5px', color: clubColor, textTransform: 'uppercase', fontWeight: 700 }}>
            Carnet Oficial
          </div>
          <div style={{ fontSize: '11px', color: th.textPri, fontWeight: 700, letterSpacing: '0.5px', marginTop: '1px' }}>
            {clubNombre}
          </div>
        </div>
      )}
    </div>
  );
}

function SelloHolograma({ color, initials, logoUrl }) {
  const id = `holo-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg width="30" height="30" viewBox="0 0 34 34" style={{ filter: `drop-shadow(0 0 4px ${color}80)`, flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FF6B6B" />
          <stop offset="25%"  stopColor="#FFE66D" />
          <stop offset="50%"  stopColor="#4ECDC4" />
          <stop offset="75%"  stopColor="#A8E6CF" />
          <stop offset="100%" stopColor="#C678FF" />
        </linearGradient>
      </defs>
      <circle cx="17" cy="17" r="15.5" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" strokeDasharray="2,1.8" />
      <circle cx="17" cy="17" r="13" fill="none" stroke={`url(#${id})`} strokeWidth="1.8" opacity="0.5" />
      <circle cx="17" cy="17" r="11.5" fill="#0E0E0E" stroke={color} strokeWidth="1.1" />
      {logoUrl
        ? <image href={logoUrl} x="10" y="10" width="14" height="14" />
        : <text x="17" y="21" textAnchor="middle" fontSize="8.5" fontWeight="900" fill={color}
                fontFamily="'Sport Event', cursive" letterSpacing="0.5">{initials.slice(0, 2)}</text>
      }
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg - 90) * Math.PI / 180;
        return <circle key={i} cx={17 + 14 * Math.cos(rad)} cy={17 + 14 * Math.sin(rad)}
                       r={i % 2 === 0 ? 1 : 0.6} fill={color} opacity={i % 2 === 0 ? 0.9 : 0.5} />;
      })}
    </svg>
  );
}

// Código de barras decorativo (no escaneable — el QR ya cumple esa función):
// ancho de cada barra derivado del código de caracteres del valor, determinista.
function Barcode({ value, color }) {
  const codes = value.split('').map(c => c.charCodeAt(0));
  const step = 3.2;
  const vbWidth = Math.max(codes.length * step, 40);
  return (
    <svg width="100%" height="26" viewBox={`0 0 ${vbWidth} 26`} preserveAspectRatio="none">
      {codes.map((code, i) => (
        <rect key={i} x={i * step} y="0" width={1 + (code % 3)} height="20" fill={color} />
      ))}
    </svg>
  );
}

function IconBadge({ Icon, th, clubColor }) {
  return (
    <div style={{
      width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
      background: th.badgeBg, border: `1px solid ${th.badgeBorder}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={11} color={clubColor} strokeWidth={2.2} />
    </div>
  );
}

export default function TabCarnetV2({ jugador, clubConfig = {} }) {
  const [lado, setLado] = useState('frente');

  const nombre    = (jugador['nombre(s)']  || jugador.nombre    || '').trim();
  const apellidos = (jugador['apellido(s)'] || jugador.apellidos || '').trim();
  const clubColor  = clubConfig?.color      || '#E14924';
  const clubNombre = clubConfig?.nombre     || 'Mi Club';
  const clubSub    = clubConfig?.subtitulo  || '';
  const logoUrl    = clubConfig?.logo_url   || null;
  const redes      = clubConfig?.redes_sociales || {};
  const initials   = clubNombre.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'FC';

  // Identidad visual del carnet: un solo diseño (rayas + halftone + escudo
  // fantasma), siempre derivado del color del club — ver lib/carnetFondos.js.
  const th = temaCarnet(clubColor);
  // La barra ID/EQUIPO/VÁLIDO va con fondo sólido clubColor — blanco fijo se
  // vuelve ilegible con colores claros como un verde lima (caso real: club
  // Cancheroapp). Ver TabCarnetV1.jsx para el mismo arreglo.
  const barText = textoSobre(clubColor);
  const barTextDim = barText === '#FFFFFF' ? 'rgba(255,255,255,0.85)' : 'rgba(20,20,20,0.75)';
  const barTextMut = barText === '#FFFFFF' ? 'rgba(255,255,255,0.7)'  : 'rgba(20,20,20,0.6)';
  const barDivider = barText === '#FFFFFF' ? 'rgba(255,255,255,0.28)' : 'rgba(20,20,20,0.2)';

  const verifyBase = typeof window !== 'undefined' ? window.location.origin : 'https://zensports.zenpra.ai';
  const verifyParams = new URLSearchParams({
    n:    `${nombre} ${apellidos}`.trim(),
    pos:  jugador.posicion        || '',
    num:  jugador.numero_camiseta || jugador.numero || '',
    cat:  jugador.categoria || '',
    color: clubColor,
    club:  clubNombre,
    logo:  logoUrl || '',
  });
  const verifyUrl = jugador.cedula
    ? `${verifyBase}/verificar/${getClubId()}/${jugador.cedula}?${verifyParams.toString()}`
    : null;

  const [qrData, setQrData] = useState({ url: null, dataUrl: null });
  const qrDataUrl = (verifyUrl && qrData.url === verifyUrl) ? qrData.dataUrl : null;

  useEffect(() => {
    if (!verifyUrl) return;
    let cancelado = false;
    QRCodeLib.toDataURL(verifyUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#F0F0F0FF', light: '#111111FF' },
    })
      .then(du => { if (!cancelado) setQrData({ url: verifyUrl, dataUrl: du }); })
      .catch(() => { if (!cancelado) setQrData({ url: verifyUrl, dataUrl: null }); });
    return () => { cancelado = true; };
  }, [verifyUrl]);

  const fmtFecha = (f) => {
    if (!f) return '—';
    const p = f.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : f;
  };

  const redesEntries = Object.entries(redes || {}).filter(([, v]) => v);
  const RED_ICONS = { instagram: Instagram, facebook: Facebook, youtube: Youtube, twitter: Globe, tiktok: Music, web: Globe };
  // Sin `color` explícito, lucide hereda currentColor del contexto — en el
  // fondo oscuro del carnet eso lo dejaba casi invisible.
  const RedIcon = ({ red }) => { const Ic = RED_ICONS[red] || Link; return <Ic size={10} color={th.textSec} strokeWidth={2} />; };

  const anio = new Date().getFullYear();
  const idCarnet = jugador.numero_camiseta ? String(jugador.numero_camiseta).padStart(3, '0') : (jugador.cedula || '—').slice(-5);
  const equipo   = jugador.categoria || clubNombre;
  const codigoBarras = `${initials}${anio}-${(jugador.cedula || idCarnet).slice(-6)}`;

  const cardBase = {
    width: '100%',
    maxWidth: '320px',
    background: th.bgCard,
    borderRadius: '12px',
    border: `1px solid ${th.border}`,
    overflow: 'hidden',
    position: 'relative',
    boxShadow: `0 0 48px ${clubColor}18,0 4px 20px rgba(0,0,0,0.4)`,
    fontFamily: 'Inter, sans-serif',
  };

  const imprimir = () => {
    const el = document.getElementById(lado === 'frente' ? 'zs-carnet-frente' : 'zs-carnet-dorso');
    if (!el) return;
    const w = window.open('', '_blank');
    const cssVars = '--text-pri:#F2F2F2;--text-sec:#AEAEB4;--text-mut:#68686E;--bg-surface:#1A1A2A;';
    // Nombre, apellido y número usan la fuente propia "Sport Event" (font-face
    // declarado en index.html, no en Google Fonts) — esta ventana es un
    // documento en blanco aparte, así que hay que declararla de nuevo acá o el
    // navegador cae al genérico "cursive" y el carnet impreso no se parece al
    // que se ve en pantalla.
    const origin = window.location.origin;
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Carnet — ${esc(nombre)} ${esc(apellidos)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
      @font-face { font-family:'Sport Event'; src:url('${origin}/fonts/sportevent-display.otf') format('opentype'); font-weight:400; font-style:normal; font-display:block; }
      @font-face { font-family:'Sport Event'; src:url('${origin}/fonts/sportevent-italic.otf') format('opentype'); font-weight:400; font-style:italic; font-display:block; }
      *{box-sizing:border-box;margin:0;padding:0;}:root{${cssVars}}
      body{background:#111;display:flex;justify-content:center;padding:32px;font-family:Inter,sans-serif;}
      @media print{body{padding:0;}}</style>
      </head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    w.focus();
    // font-display:block + fonts.ready evita imprimir con la fuente a medio
    // cargar (que dispararía el mismo problema de fallback a cursive). Guard
    // `impreso` porque fonts.ready Y el timeout de respaldo pueden dispararse
    // los dos — sin el guard se abriría el diálogo de impresión dos veces.
    let impreso = false;
    const disparar = () => { if (impreso) return; impreso = true; w.print(); w.close(); };
    if (w.document.fonts?.ready) {
      w.document.fonts.ready.then(disparar).catch(disparar);
      setTimeout(disparar, 1500); // tope por si fonts.ready nunca resuelve
    } else {
      setTimeout(disparar, 700);
    }
  };

  return (
    <div className="space-y-4">
      {/* Side toggle */}
      <div>
        <p className="text-xs text-[var(--text-mut)] uppercase tracking-wider mb-2">Vista</p>
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-surface)]">
          {[['frente', 'Frente'], ['dorso', 'Dorso']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setLado(key)}
              className="flex-1 py-1.5 rounded-md text-xs font-semibold transition"
              style={lado === key
                ? { background: 'var(--bg-card)', color: 'var(--text-pri)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }
                : { color: 'var(--text-mut)' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* FRENTE */}
      <div style={{ display: lado === 'frente' ? 'flex' : 'none', justifyContent: 'center' }}>
        <div id="zs-carnet-frente" style={cardBase}>
          <Watermark logoUrl={logoUrl} initials={initials} clubColor={clubColor} />
          <LogoHeader variant="frente" clubColor={clubColor} th={th} logoUrl={logoUrl} initials={initials} clubNombre={clubNombre} clubSub={clubSub} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '10px', padding: '14px 16px 0' }}>
            {/* Número + posición — solo si hay al menos uno de los dos, para
                no dejar una columna vacía cuando el jugador no los tiene. */}
            {(jugador.numero_camiseta || jugador.posicion) && (
              <div style={{ flexShrink: 0, width: '58px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '4px' }}>
                {jugador.numero_camiseta && (
                  <div style={{ fontFamily: "'Sport Event',cursive", fontSize: '34px', color: th.textPri, lineHeight: 0.85 }}>
                    {jugador.numero_camiseta}
                  </div>
                )}
                {jugador.posicion && (
                  <div style={{ fontSize: '8px', fontWeight: 700, color: clubColor, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '4px', lineHeight: 1.25 }}>
                    {jugador.posicion}
                  </div>
                )}
              </div>
            )}

            {/* Foto */}
            <div style={{
              flex: 1, height: '214px', borderRadius: '10px', overflow: 'hidden',
              background: th.photoBg, border: `1.5px solid ${th.borderImg}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {jugador.foto_url
                ? <img src={jugador.foto_url} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
                : <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="#3A3A3A" strokeWidth="0.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>}
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, padding: '14px 16px 4px' }}>
            <div style={{ fontFamily: "'Sport Event',cursive", fontSize: '15px', color: th.textSec, letterSpacing: '1.5px', textTransform: 'uppercase', lineHeight: 1 }}>
              {nombre || '—'}
            </div>
            <div style={{ fontFamily: "'Sport Event',cursive", fontSize: '30px', color: clubColor, lineHeight: 0.95, letterSpacing: '1.2px', textTransform: 'uppercase', marginTop: '3px' }}>
              {apellidos}
            </div>
            <div style={{ fontSize: '8px', color: th.textMut, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '5px' }}>
              JUGADOR OFICIAL
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, marginTop: '14px', background: clubColor, display: 'flex' }}>
            {[
              { Icon: Hash,          label: 'ID',           value: idCarnet },
              { Icon: Shield,        label: 'EQUIPO',       value: equipo },
              { Icon: CalendarCheck, label: 'VÁLIDO HASTA', value: `31/12/${anio}` },
            ].map((col, i) => (
              <div key={col.label} style={{
                flex: 1, padding: '10px 8px', display: 'flex', alignItems: 'center', gap: '5px',
                borderLeft: i > 0 ? `1px solid ${barDivider}` : 'none',
                minWidth: 0,
              }}>
                <col.Icon size={11} color={barTextDim} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '5.5px', color: barTextMut, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{col.label}</div>
                  <div style={{ fontSize: '8.5px', color: barText, fontWeight: 700, letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DORSO */}
      <div style={{ display: lado === 'dorso' ? 'flex' : 'none', justifyContent: 'center' }}>
        <div id="zs-carnet-dorso" style={cardBase}>
          <Watermark logoUrl={logoUrl} initials={initials} clubColor={clubColor} />
          <LogoHeader variant="dorso" clubColor={clubColor} th={th} logoUrl={logoUrl} initials={initials} clubNombre={clubNombre} clubSub={clubSub} />
          <div style={{ height: '1px', margin: '0 16px', background: th.divider, position: 'relative', zIndex: 1 }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '16px', padding: '12px 16px' }}>
            {/* minWidth:0 es obligatorio en un flex:1 con texto nowrap adentro
                (la fila "Nombre") — sin esto un nombre largo fuerza la columna
                a crecer más allá del espacio disponible y empuja el QR fuera
                de la tarjeta, cortado por el border-radius. */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { Icon: User,       label: 'Nombre',      value: `${nombre} ${apellidos}`.trim() || '—' },
                { Icon: IdCard,     label: 'Documento',   value: jugador.cedula ? `CC ${jugador.cedula}` : '—' },
                { Icon: Calendar,   label: 'Nacimiento',  value: fmtFecha(jugador.fecha_nacimiento) },
                { Icon: Shirt,      label: 'Posición',    value: jugador.posicion || '—' },
                { Icon: Phone,      label: 'Celular',     value: jugador.celular || '—' },
                { Icon: HeartPulse, label: 'EPS',         value: jugador.eps || '—' },
              ].map(({ Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <IconBadge Icon={Icon} th={th} clubColor={clubColor} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '6.5px', color: th.textMut, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ fontSize: '9.5px', color: th.textPri, fontWeight: 600, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
            {verifyUrl && (
              // justifyContent:center — esta columna queda estirada por la fila
              // (la columna de datos, a la izquierda, es más alta con sus 6
              // filas), sin centrar el QR quedaba pegado arriba y dejaba un
              // hueco vacío abajo, muy cerca del borde derecho de la tarjeta.
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: `1.5px solid ${th.border}`, background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {qrDataUrl
                    ? <img src={qrDataUrl} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
                    : <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${clubColor}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  }
                </div>
                <div style={{ fontSize: '6px', color: th.textMut, letterSpacing: '1px', textAlign: 'center', textTransform: 'uppercase', lineHeight: 1.3 }}>
                  Escanea para<br />ver perfil
                </div>
              </div>
            )}
          </div>

          {redesEntries.length > 0 && (
            <div style={{ position: 'relative', zIndex: 1, padding: '0 16px 7px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {redesEntries.slice(0, 4).map(([red, val]) => (
                <div key={red} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <RedIcon red={red} />
                  <span style={{ fontSize: '8px', color: th.textSec }}>
                    {val.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {clubSub && (
            <div style={{ position: 'relative', zIndex: 1, padding: redesEntries.length > 0 ? '0 16px 7px' : '0 16px 7px', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: th.textMut, letterSpacing: '2px', textTransform: 'uppercase', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                "{clubSub}"
              </div>
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 1, background: '#0A0A0C', borderTop: `1px solid ${th.divider}`, padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Barcode value={codigoBarras} color={th.textPri} />
              <div style={{ fontSize: '7px', color: th.textMut, letterSpacing: '1.5px', marginTop: '3px', fontFamily: 'monospace' }}>{codigoBarras}</div>
            </div>
            <SelloHolograma color={clubColor} initials={initials} logoUrl={logoUrl} />
          </div>
        </div>
      </div>

      {!jugador.foto_url && (
        <p className="text-center text-xs text-[var(--text-mut)]">
          Agrega una foto en la pestaña Perfil para que aparezca en el carnet.
        </p>
      )}

      <button
        onClick={imprimir}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--bg-surface)] border text-sm font-semibold text-[var(--text-pri)] hover:opacity-90 transition"
        style={{ borderColor: `${clubColor}40` }}
      >
        <Printer className="w-4 h-4" style={{ color: clubColor }} />
        Imprimir {lado === 'frente' ? 'Frente' : 'Dorso'}
      </button>
    </div>
  );
}
