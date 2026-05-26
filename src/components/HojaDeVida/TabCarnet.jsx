import { useState, useEffect } from 'react';
import {
  Printer, Instagram, Facebook, Youtube, Globe, Music, Link,
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import { getClubId } from '../../services/api';

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
            fontFamily="Bebas Neue, sans-serif" fontSize={initials.length > 2 ? '8' : '9.5'} letterSpacing="1.5">
        {initials.slice(0, 3)}
      </text>
      <line x1="13" y1="24" x2="25" y2="24" stroke="#B68631" strokeWidth="0.8" opacity="0.6" />
      <text x="19" y="35" textAnchor="middle" fill="#B68631" fontFamily="Arial" fontSize="6.5" letterSpacing="1">★ ★ ★</text>
    </svg>
  );
}

function SelloHolograma({ color, initials, logoUrl, dark }) {
  const id = `holo-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" style={{ filter: `drop-shadow(0 0 4px ${color}80)`, flexShrink: 0 }}>
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
      <circle cx="17" cy="17" r="11.5" fill={dark ? '#0E0E0E' : '#FAFAFA'} stroke={color} strokeWidth="1.1" />
      {logoUrl
        ? <image href={logoUrl} x="10" y="10" width="14" height="14" />
        : <text x="17" y="21" textAnchor="middle" fontSize="8.5" fontWeight="900" fill={color}
                fontFamily="'Bebas Neue', cursive" letterSpacing="0.5">{initials.slice(0, 2)}</text>
      }
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg - 90) * Math.PI / 180;
        return <circle key={i} cx={17 + 14 * Math.cos(rad)} cy={17 + 14 * Math.sin(rad)}
                       r={i % 2 === 0 ? 1 : 0.6} fill={color} opacity={i % 2 === 0 ? 0.9 : 0.5} />;
      })}
    </svg>
  );
}

export default function TabCarnet({ jugador, clubConfig = {} }) {
  const [plantilla, setPlantilla] = useState('oscuro');
  const [lado, setLado] = useState('frente');

  const nombre    = (jugador['nombre(s)']  || jugador.nombre    || '').trim();
  const apellidos = (jugador['apellido(s)'] || jugador.apellidos || '').trim();
  const clubColor  = clubConfig?.color      || '#E14924';
  const clubNombre = clubConfig?.nombre     || 'Mi Club';
  const clubSub    = clubConfig?.subtitulo  || '';
  const logoUrl    = clubConfig?.logo_url   || null;
  const redes      = clubConfig?.redes_sociales || {};
  const initials   = clubNombre.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'FC';

  const dark = plantilla === 'oscuro';
  const th = dark
    ? { bgCard: 'linear-gradient(155deg,#111111 0%,#0E0E16 100%)', textPri: '#F0F0F0', textSec: '#AAAAAA', textMut: '#666666',
        border: `${clubColor}40`, borderImg: `${clubColor}55`, divider: '#1E1E28', photoBg: '#1A1A26' }
    : { bgCard: 'linear-gradient(155deg,#FFFFFF 0%,#F5F5F5 100%)', textPri: '#111111', textSec: '#444444', textMut: '#888888',
        border: `${clubColor}50`, borderImg: `${clubColor}60`, divider: '#EBEBEB', photoBg: '#E0E0E0' };

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

  const [qrDataUrl, setQrDataUrl] = useState(null);
  useEffect(() => {
    if (!verifyUrl) { setQrDataUrl(null); return; }
    QRCodeLib.toDataURL(verifyUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark:  dark ? '#F0F0F0FF' : '#111111FF',
        light: dark ? '#111111FF' : '#FFFFFFFF',
      },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [verifyUrl, dark]);

  const fmtFecha = (f) => {
    if (!f) return '—';
    const p = f.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : f;
  };

  const redesEntries = Object.entries(redes || {}).filter(([, v]) => v);
  const RED_ICONS = { instagram: Instagram, facebook: Facebook, youtube: Youtube, twitter: Globe, tiktok: Music, web: Globe };
  const RedIcon = ({ red }) => { const Ic = RED_ICONS[red] || Link; return <Ic size={9} />; };

  const cardBase = {
    width: '320px',
    background: th.bgCard,
    borderRadius: '16px',
    border: `1px solid ${th.border}`,
    overflow: 'hidden',
    boxShadow: dark ? `0 0 48px ${clubColor}18,0 4px 20px rgba(0,0,0,0.4)` : '0 4px 24px rgba(0,0,0,0.1)',
    fontFamily: 'Inter, sans-serif',
  };

  const imprimir = () => {
    const el = document.getElementById(lado === 'frente' ? 'zs-carnet-frente' : 'zs-carnet-dorso');
    if (!el) return;
    const w = window.open('', '_blank');
    const cssVars = dark
      ? '--text-pri:#F0F0F0;--text-sec:#AAAAAA;--text-mut:#666666;--bg-surface:#1A1A2A;'
      : '--text-pri:#111111;--text-sec:#444444;--text-mut:#888888;--bg-surface:#F5F5F5;';
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Carnet — ${esc(nombre)} ${esc(apellidos)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>*{box-sizing:border-box;margin:0;padding:0;}:root{${cssVars}}
      body{background:${dark ? '#111' : '#fff'};display:flex;justify-content:center;padding:32px;font-family:Inter,sans-serif;}
      @media print{body{padding:0;}}</style>
      </head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 600);
  };

  const TopBar = () => (
    <div style={{ height: '5px', background: `linear-gradient(90deg,${clubColor},#B68631)` }} />
  );

  const LogoHeader = ({ small = false }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: small ? '10px 16px 8px' : '11px 16px 9px',
      borderBottom: `1px solid ${th.divider}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {logoUrl
          ? <img src={logoUrl} alt="logo" style={{ width: small ? '22px' : '26px', height: small ? '22px' : '26px', objectFit: 'contain' }} />
          : <EscudoSVG size={small ? 18 : 22} color={clubColor} initials={initials} />}
        <div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: small ? '13px' : '15px', letterSpacing: '2.5px', color: th.textPri, lineHeight: 1 }}>
            {clubNombre}
          </div>
          {!small && clubSub && (
            <div style={{ fontSize: '7px', letterSpacing: '2px', color: th.textMut, textTransform: 'uppercase', marginTop: '1px' }}>
              {clubSub}
            </div>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '7px', letterSpacing: '1.5px', color: th.textMut, textTransform: 'uppercase' }}>
          {small ? 'INFORMACIÓN OFICIAL' : 'CARNET OFICIAL'}
        </div>
        {!small && (
          <div style={{ fontSize: '10px', color: clubColor, fontWeight: 700, letterSpacing: '1px', marginTop: '1px' }}>
            {new Date().getFullYear()}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Template selector */}
      <div>
        <p className="text-xs text-[var(--text-mut)] uppercase tracking-wider mb-2">Plantilla</p>
        <div className="flex gap-2">
          {[{ key: 'oscuro', label: 'Oscuro', swatch: '#111111' }, { key: 'claro', label: 'Claro', swatch: '#FFFFFF' }].map(({ key, label, swatch }) => (
            <button
              key={key}
              onClick={() => setPlantilla(key)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition"
              style={plantilla === key
                ? { borderColor: clubColor, color: clubColor, background: `${clubColor}12` }
                : { borderColor: 'var(--border-sub)', color: 'var(--text-mut)' }}
            >
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: swatch, border: '1px solid rgba(128,128,128,0.3)', flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

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
          <TopBar />
          <LogoHeader />
          <div style={{ position: 'relative', margin: '12px 16px 0' }}>
            <div style={{
              width: '100%', height: '162px', borderRadius: '10px', overflow: 'hidden',
              background: th.photoBg, border: `1.5px solid ${th.borderImg}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {jugador.foto_url
                ? <img src={jugador.foto_url} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                : <svg viewBox="0 0 24 24" width="50" height="50" fill="none" stroke={dark ? '#3A3A3A' : '#C0C0C0'} strokeWidth="0.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>}
            </div>
            {(jugador.numero_camiseta || jugador.posicion) && (
              <div style={{
                position: 'absolute', bottom: '8px', left: '8px',
                background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)',
                borderRadius: '7px', padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {jugador.numero_camiseta && (
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '22px', color: clubColor, lineHeight: 1 }}>
                    #{jugador.numero_camiseta}
                  </div>
                )}
                {jugador.posicion && (
                  <div style={{ fontSize: '8px', color: '#F0F0F0', letterSpacing: '1px', textTransform: 'uppercase', maxWidth: '90px', lineHeight: 1.3 }}>
                    {jugador.posicion}
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ padding: '10px 16px 4px' }}>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '26px', color: th.textPri, lineHeight: 1, letterSpacing: '2px' }}>
              {nombre || '—'}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '20px', color: clubColor, lineHeight: 1.1, letterSpacing: '1.5px' }}>
              {apellidos}
            </div>
            <div style={{ fontSize: '8px', color: th.textMut, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>
              JUGADOR OFICIAL
            </div>
          </div>
          <div style={{ marginTop: '12px', background: clubColor, padding: '7px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.82)', letterSpacing: '1px' }}>CC {jugador.cedula || '—'}</div>
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.82)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>{clubNombre}</div>
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.82)', letterSpacing: '1px' }}>{new Date().getFullYear()}</div>
          </div>
        </div>
      </div>

      {/* DORSO */}
      <div style={{ display: lado === 'dorso' ? 'flex' : 'none', justifyContent: 'center' }}>
        <div id="zs-carnet-dorso" style={cardBase}>
          <TopBar />
          <LogoHeader small />
          <div style={{ display: 'flex', gap: '12px', padding: '12px 16px' }}>
            <div style={{ flex: 1 }}>
              {[
                { label: 'Nombre',    value: `${nombre} ${apellidos}`.trim() || '—' },
                { label: 'Documento', value: jugador.cedula ? `CC ${jugador.cedula}` : '—' },
                { label: 'Nacimiento',value: fmtFecha(jugador.fecha_nacimiento) },
                { label: 'Posición',  value: jugador.posicion || '—' },
                { label: 'Celular',   value: jugador.celular || '—' },
                { label: 'EPS',       value: jugador.eps || '—' },
              ].map(({ label, value }, i) => (
                <div key={i} style={{ marginBottom: i < 5 ? '7px' : 0 }}>
                  <div style={{ fontSize: '7px', color: th.textMut, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: '10px', color: th.textPri, fontWeight: 500, lineHeight: 1.3 }}>{value}</div>
                </div>
              ))}
            </div>
            {verifyUrl && (
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: `1.5px solid ${th.border}`, background: dark ? '#111111' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {qrDataUrl
                    ? <img src={qrDataUrl} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
                    : <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${clubColor}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  }
                </div>
                <SelloHolograma color={clubColor} initials={initials} logoUrl={logoUrl} dark={dark} />
                <div style={{ fontSize: '6.5px', color: clubColor, letterSpacing: '1.5px', textAlign: 'center', fontWeight: 700 }}>✓ MIEMBRO OFICIAL</div>
              </div>
            )}
          </div>

          {(redesEntries.length > 0 || clubSub) && (
            <div style={{ height: '1px', margin: '0 16px', background: th.divider }} />
          )}

          {redesEntries.length > 0 && (
            <div style={{ padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
            <div style={{ padding: redesEntries.length > 0 ? '0 16px 7px' : '7px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: th.textMut, letterSpacing: '2px', textTransform: 'uppercase', fontStyle: 'italic' }}>
                "{clubSub}"
              </div>
            </div>
          )}

          <div style={{ background: clubColor, padding: '6px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.85)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {clubNombre} · TEMPORADA {new Date().getFullYear()}
            </div>
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
        Imprimir {lado === 'frente' ? 'Frente' : 'Dorso'} — {dark ? 'Oscuro' : 'Claro'}
      </button>
    </div>
  );
}
