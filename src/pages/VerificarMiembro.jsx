import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Shirt, Hash, Shield, CalendarCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../config';
import { fondoCarnetV2, WATERMARK_LOGO_STYLE } from '../lib/carnetFondos';

// Rollout controlado por club mientras se define el diseño definitivo: v2
// comparte fondo/tipografía con el carnet impreso rediseñado (ver
// lib/carnetFondos.js y HojaDeVida/TabCarnetV2.jsx). Se activa por club vía
// `clubConfig.carnet_v2 === true` — el resto sigue viendo v1.

/* ── Tarjeta "no verificado" — v1 ────────────────────────────────────────── */
function NoVerificadoV1({ color, clubNombre, clubSub, logoUrl, initials, estado, cedula }) {
  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 0 60px rgba(239,68,68,0.10), 0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ height: 5, background: 'linear-gradient(90deg, #EF4444, #EF444480, #EF4444)' }} />
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          {logoUrl
            ? <img src={logoUrl} alt="logo" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 8 }} />
            : (
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color, fontFamily: "'Exo 2', sans-serif", letterSpacing: 1 }}>{initials}</div>
            )
          }
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1, color: '#fff' }}>{clubNombre}</div>
            {clubSub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 1 }}>{clubSub}</div>}
          </div>
        </div>

        <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', borderRadius: 999, padding: '6px 18px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', letterSpacing: 1.5, textTransform: 'uppercase' }}>No Verificado</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
            {estado === 'error'
              ? 'No se pudo verificar la membresía en este momento.'
              : `No se encontró un miembro activo con identificación ${cedula} en este club.`
            }
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', margin: 0 }}>
            Si crees que esto es un error, contacta al administrador del club.
          </p>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>ZenSports</span>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 }}>zensports.app</span>
        </div>
      </div>
    </div>
  );
}

/* ── Tarjeta "no verificado" — v2 (fondo compartido con el carnet impreso) ─ */
function NoVerificadoV2({ color, clubNombre, clubSub, logoUrl, initials, estado, cedula, bgCard }) {
  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ position: 'relative', background: bgCard, border: '1px solid rgba(239,68,68,0.35)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 0 60px rgba(239,68,68,0.10), 0 24px 64px rgba(0,0,0,0.5)' }}>
        {logoUrl && <img src={logoUrl} alt="" style={WATERMARK_LOGO_STYLE} />}

        <div style={{ position: 'relative', zIndex: 1, padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(180deg,rgba(3,3,4,0.6) 0%,rgba(3,3,4,0.28) 70%,transparent 100%)' }}>
          {logoUrl
            ? <img src={logoUrl} alt="logo" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 8 }} />
            : (
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color, fontFamily: "'Exo 2', sans-serif", letterSpacing: 1 }}>{initials}</div>
            )
          }
          <div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: 2, color: '#fff' }}>{clubNombre}</div>
            {clubSub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 1 }}>{clubSub}</div>}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', borderRadius: 999, padding: '6px 18px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', letterSpacing: 1.5, textTransform: 'uppercase' }}>No Verificado</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
            {estado === 'error'
              ? 'No se pudo verificar la membresía en este momento.'
              : `No se encontró un miembro activo con identificación ${cedula} en este club.`
            }
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', margin: 0 }}>
            Si crees que esto es un error, contacta al administrador del club.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>ZenSports</span>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 }}>zensports.app</span>
        </div>
      </div>
    </div>
  );
}

/* ── Tarjeta "verificado" — v1 ───────────────────────────────────────────── */
function VerificadoV1({ color, clubNombre, clubSub, logoUrl, initials, temporada, nombreCompleto, cedula, posicion, numero, categoria, fechaDisplay, fechaValida, fotoUrl }) {
  return (
    <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}35`, borderRadius: 24, overflow: 'hidden', boxShadow: `0 0 60px ${color}18, 0 24px 64px rgba(0,0,0,0.5)` }}>
        <div style={{ height: 5, background: `linear-gradient(90deg, ${color}, ${color}80, ${color})` }} />

        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {logoUrl
              ? <img src={logoUrl} alt="logo" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 8 }} />
              : (
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color, fontFamily: "'Exo 2', sans-serif", letterSpacing: 1 }}>{initials}</span>
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

        <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,208,132,0.10)', border: '1px solid rgba(0,208,132,0.30)', borderRadius: 999, padding: '6px 18px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00D084', boxShadow: '0 0 8px #00D084' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#00D084', letterSpacing: 1.5, textTransform: 'uppercase' }}>Miembro Verificado</span>
          </div>
          {fechaDisplay && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: fechaValida ? 'rgba(0,208,132,0.08)' : 'rgba(245,166,35,0.10)',
              border: `1px solid ${fechaValida ? 'rgba(0,208,132,0.25)' : 'rgba(245,166,35,0.35)'}`,
              borderRadius: 999, padding: '4px 14px',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={fechaValida ? '#00D084' : '#F5A623'} strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: fechaValida ? '#00D084' : '#F5A623', letterSpacing: 1, whiteSpace: 'nowrap' }}>
                {fechaValida ? `Válido hoy · ${fechaDisplay}` : `Solicitado: ${fechaDisplay}`}
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: '20px 24px 24px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
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

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, marginBottom: 4, letterSpacing: '-0.3px' }}>{nombreCompleto}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>CC {cedula}</div>

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
              {fechaDisplay && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', width: 64, letterSpacing: 1, textTransform: 'uppercase' }}>Vigencia</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: fechaValida ? '#00D084' : '#F5A623' }}>{fechaDisplay}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: 0.5 }}>ZenSports</span>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5 }}>zensports.app</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 20, lineHeight: 1.6 }}>
        Este carnet fue emitido digitalmente por {clubNombre}.<br />
        Verificación provista por ZenSports.
      </p>
    </div>
  );
}

/* ── Tarjeta "verificado" — v2 (fondo compartido con el carnet impreso) ──── */
function VerificadoV2({ color, clubNombre, clubSub, logoUrl, initials, temporada, nombreAt, apellidoAt, cedula, posicion, numero, categoria, fechaDisplay, fechaValida, fotoUrl, bgCard }) {
  return (
    <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
      <div style={{ position: 'relative', background: bgCard, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden', boxShadow: `0 0 60px ${color}18, 0 24px 64px rgba(0,0,0,0.5)` }}>
        {logoUrl && <img src={logoUrl} alt="" style={WATERMARK_LOGO_STYLE} />}

        <div style={{ position: 'relative', zIndex: 1, padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg,rgba(3,3,4,0.6) 0%,rgba(3,3,4,0.28) 70%,transparent 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {logoUrl
              ? <img src={logoUrl} alt="logo" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 8 }} />
              : (
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color, fontFamily: "'Exo 2', sans-serif", letterSpacing: 1 }}>{initials}</span>
                </div>
              )
            }
            <div>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: 2, color: '#fff' }}>{clubNombre}</div>
              {clubSub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 1 }}>{clubSub}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Temporada</div>
            <div style={{ fontSize: 14, fontWeight: 700, color }}>{temporada}</div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: '20px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,208,132,0.10)', border: '1px solid rgba(0,208,132,0.30)', borderRadius: 999, padding: '6px 18px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00D084', boxShadow: '0 0 8px #00D084' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#00D084', letterSpacing: 1.5, textTransform: 'uppercase' }}>Miembro Verificado</span>
          </div>
          {fechaDisplay && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: fechaValida ? 'rgba(0,208,132,0.08)' : 'rgba(245,166,35,0.10)',
              border: `1px solid ${fechaValida ? 'rgba(0,208,132,0.25)' : 'rgba(245,166,35,0.35)'}`,
              borderRadius: 999, padding: '4px 14px',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={fechaValida ? '#00D084' : '#F5A623'} strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: fechaValida ? '#00D084' : '#F5A623', letterSpacing: 1, whiteSpace: 'nowrap' }}>
                {fechaValida ? `Válido hoy · ${fechaDisplay}` : `Solicitado: ${fechaDisplay}`}
              </span>
            </div>
          )}
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: '18px 24px 0', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0 }}>
            {fotoUrl
              ? <img src={fotoUrl} alt={`${nombreAt} ${apellidoAt}`} style={{ width: 80, height: 96, objectFit: 'contain', background: '#15151B', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.12)' }} />
              : (
                <div style={{ width: 80, height: 96, borderRadius: 12, background: '#15151B', border: '1.5px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3A3A3A" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )
            }
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 600, fontSize: 13, color: '#AEAEB4', letterSpacing: 1.5, textTransform: 'uppercase', lineHeight: 1 }}>{nombreAt || '—'}</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: 24, color, lineHeight: 0.95, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 }}>{apellidoAt}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>CC {cedula}</div>
          </div>
        </div>

        {(posicion || categoria) && (
          <div style={{ position: 'relative', zIndex: 1, padding: '14px 24px 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {posicion && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${color}14`, border: `1px solid ${color}45`, borderRadius: 8, padding: '5px 10px' }}>
                <Shirt size={11} color={color} strokeWidth={2.2} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{posicion}</span>
              </div>
            )}
            {numero && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${color}14`, border: `1px solid ${color}45`, borderRadius: 8, padding: '5px 10px' }}>
                <Hash size={11} color={color} strokeWidth={2.2} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{numero}</span>
              </div>
            )}
            {categoria && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${color}14`, border: `1px solid ${color}45`, borderRadius: 8, padding: '5px 10px' }}>
                <Shield size={11} color={color} strokeWidth={2.2} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{categoria}</span>
              </div>
            )}
            {fechaDisplay && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${color}14`, border: `1px solid ${color}45`, borderRadius: 8, padding: '5px 10px' }}>
                <CalendarCheck size={11} color={color} strokeWidth={2.2} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{fechaValida ? 'Válido hoy' : fechaDisplay}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ position: 'relative', zIndex: 1, marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: 0.5 }}>ZenSports</span>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5 }}>zensports.app</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 20, lineHeight: 1.6 }}>
        Este carnet fue emitido digitalmente por {clubNombre}.<br />
        Verificación provista por ZenSports.
      </p>
    </div>
  );
}

export default function VerificarMiembro() {
  const { clubSlug, cedula } = useParams();
  const [searchParams] = useSearchParams();

  const [estado, setEstado]       = useState(() => (!clubSlug || !cedula) ? 'error' : 'cargando'); // 'cargando' | 'verificado' | 'no_encontrado' | 'error'
  const [clubConfig, setClubConfig] = useState(null);
  const [atleta, setAtleta]       = useState(null);

  useEffect(() => {
    document.title = 'Verificación de Miembro · ZenSports';
    if (!clubSlug || !cedula) return;

    async function verificar() {
      try {
        // 1. Branding del club (anon, no falla si club no existe)
        const { data: clubRow } = await supabase
          .from('clubs_publico')
          .select('config')
          .eq('slug', clubSlug)
          .single();
        if (clubRow?.config) setClubConfig(clubRow.config);

        // 2. Verificación real del atleta contra la API pública.
        // Endpoint dedicado del carnet: confirma membresía + identidad básica por
        // cédula, SIN estado de cuenta. NO reusar /publico/atleta/:slug/:token —
        // ese exige un token HMAC opaco (link del Portal) y rechaza la cédula cruda.
        const res = await fetch(`${API_BASE_URL}/publico/verificar/${clubSlug}/${cedula}`);
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json.success || !json.atleta) {
          setEstado('no_encontrado');
          return;
        }

        // El atleta debe estar activo
        const activo = json.atleta?.activo === true
          || String(json.atleta?.activo).toUpperCase() === 'SI'
          || String(json.atleta?.activo).toUpperCase() === 'ACTIVO';

        if (!activo) {
          setEstado('no_encontrado');
          return;
        }

        setAtleta(json.atleta);
        if (!clubRow?.config && json.club) setClubConfig(json.club);
        setEstado('verificado');
      } catch {
        setEstado('error');
      }
    }

    verificar();
  }, [clubSlug, cedula]);

  const esV2       = clubConfig?.carnet_v2 === true;
  const color      = clubConfig?.color     || '#00AAFF';
  const clubNombre = clubConfig?.nombre    || clubSlug || 'Club Deportivo';
  const clubSub    = clubConfig?.subtitulo || '';
  const logoUrl    = clubConfig?.logo_url  || null;
  const initials   = clubNombre.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'FC';
  const temporada  = new Date().getFullYear();

  // Fondo v2: mismas rayas diagonales + halftone + escudo fantasma que el
  // carnet impreso (HojaDeVida/TabCarnetV2.jsx) — comparten lib/carnetFondos.js
  // para que el carnet digital (este link) y el físico se vean como el mismo carnet.
  const bgCard = esV2 ? fondoCarnetV2(color) : null;

  const nombreAt   = atleta?.nombre || atleta?.['nombre(s)']  || '';
  const apellidoAt = atleta?.apellidos || atleta?.['apellido(s)'] || '';
  const nombreCompleto = atleta ? `${nombreAt} ${apellidoAt}`.trim() : '—';
  const posicion  = atleta?.posicion  || '';
  const numero    = atleta?.numero    || atleta?.numero_camiseta || '';
  const categoria = atleta?.categoria || '';

  // Fecha de solicitud del carnet (pasada por el bot vía ?fecha=YYYY-MM-DD)
  const fechaParam  = searchParams.get('fecha');
  const hoyISO      = new Date().toISOString().split('T')[0];
  const fechaValida = fechaParam === hoyISO;
  const fechaDisplay = fechaParam
    ? new Date(`${fechaParam}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  // Foto desde el registro del atleta o path estándar del bucket
  const fotoUrl = atleta?.foto_url
    || supabase.storage.from('player-photos').getPublicUrl(`${clubSlug}/${cedula}.jpg`).data?.publicUrl
    || null;

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (estado === 'cargando') {
    return (
      <div style={{ minHeight: '100vh', background: '#080C14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid #00AAFF`, borderTopColor: 'transparent', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Verificando membresía…</p>
        </div>
      </div>
    );
  }

  /* ── No encontrado / Error ───────────────────────────────────────────── */
  if (estado === 'no_encontrado' || estado === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: '#080C14', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {esV2
          ? <NoVerificadoV2 color={color} clubNombre={clubNombre} clubSub={clubSub} logoUrl={logoUrl} initials={initials} estado={estado} cedula={cedula} bgCard={bgCard} />
          : <NoVerificadoV1 color={color} clubNombre={clubNombre} clubSub={clubSub} logoUrl={logoUrl} initials={initials} estado={estado} cedula={cedula} />
        }
      </div>
    );
  }

  /* ── Verificado ──────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#080C14', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Glow de fondo (v1 lo usa como acento principal; en v2 el fondo de la
          tarjeta ya trae su propia identidad, pero el glow ambiental de página
          no estorba y se deja igual en ambos). */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: `${color}12`, filter: 'blur(80px)', pointerEvents: 'none' }} />

      {esV2
        ? <VerificadoV2 color={color} clubNombre={clubNombre} clubSub={clubSub} logoUrl={logoUrl} initials={initials} temporada={temporada}
            nombreAt={nombreAt} apellidoAt={apellidoAt} cedula={cedula} posicion={posicion} numero={numero} categoria={categoria}
            fechaDisplay={fechaDisplay} fechaValida={fechaValida} fotoUrl={fotoUrl} bgCard={bgCard} />
        : <VerificadoV1 color={color} clubNombre={clubNombre} clubSub={clubSub} logoUrl={logoUrl} initials={initials} temporada={temporada}
            nombreCompleto={nombreCompleto} cedula={cedula} posicion={posicion} numero={numero} categoria={categoria}
            fechaDisplay={fechaDisplay} fechaValida={fechaValida} fotoUrl={fotoUrl} />
      }
    </div>
  );
}
