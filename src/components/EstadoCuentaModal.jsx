import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Search, FileDown, Send, Link2, ExternalLink, Check, Loader, Receipt } from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';
import { ESTADO_CFG } from '../lib/estadosMensualidad';
import { hexToRgb, loadLogoDataUrl, drawPdfHeader, drawPdfFooter, drawPdfSectionLabel, drawPdfTableHead } from '../lib/pdfHelpers';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseFloat(n) || 0);
const normalizar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const CONCEPTO = { mensualidad: 'Mensualidad', mensualidad_wa: 'Mensualidad', uniforme: 'Uniforme', uniformes_wa: 'Uniforme', torneo: 'Torneo', torneo_wa: 'Torneo', otro: 'Otro' };
const REVISION = { aprobado_manual: 'Aprobado', pendiente: 'Por revisar', excedente_pendiente: 'Saldo a favor', rechazado: 'Rechazado' };
// Meses que todavía no se causan (futuros del año): el Portal les pone saldo = cuota, pero
// no son deuda — se muestran con su valor en gris, nunca como "debe".
const esFuturo = (m) => m.anio === new Date().getFullYear() && m.numero_mes > new Date().getMonth() + 1;
const fechaCorta = (iso) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

// Estado de cuenta de un jugador para el admin (botón de la barra superior): buscar por
// nombre o cédula y ver lo MISMO que ve la familia en el Portal del Atleta — los datos salen
// del mismo cálculo en la API (GET /players/:cedula/estado-cuenta). Desde acá se envía por
// WhatsApp (mismo mensaje que Plantillas WA → Estado de cuenta), se descarga en PDF o se
// copia el link del portal.
export default function EstadoCuentaModal({ jugadores = [], clubConfig, color = 'var(--cc)', onClose }) {
  const [q, setQ] = useState('');
  const [cedula, setCedula] = useState(null);
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const resultados = useMemo(() => {
    const t = normalizar(q.trim());
    if (t.length < 2) return [];
    return jugadores
      .filter(j => normalizar(`${j.nombre} ${j.apellidos}`).includes(t) || String(j.cedula).includes(t))
      .sort((a, b) => (b.activo !== false) - (a.activo !== false))
      .slice(0, 8);
  }, [q, jugadores]);

  const abrir = async (ced) => {
    setCedula(ced); setData(null); setError(''); setCargando(true);
    try {
      const r = await authFetch(`${API}/players/${encodeURIComponent(ced)}/estado-cuenta?club_id=${getClubId()}`);
      const d = await r.json();
      if (!r.ok || d.success === false) throw new Error(d.error || 'No se pudo cargar el estado de cuenta');
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  const avisar = (msg) => { setToast(msg); setTimeout(() => setToast(''), 6000); };

  // Igual que Plantillas WA: copia el mensaje y abre el chat sin ?text= (WhatsApp Desktop en
  // Windows corrompe los emojis del parámetro). El envío final lo da el admin desde su WhatsApp.
  const enviarWhatsApp = async () => {
    if (!data?.wa?.wa_link) { avisar('El jugador no tiene celular registrado'); return; }
    try {
      await navigator.clipboard.writeText(data.wa.texto);
      avisar('Mensaje copiado — pégalo con Ctrl+V en el chat que se abrió');
    } catch {
      avisar('No se pudo copiar el mensaje automáticamente');
    }
    window.open(data.wa.wa_link, '_blank', 'noopener,noreferrer');
    if (!data.wa.ya_enviado) {
      setData(d => ({ ...d, wa: { ...d.wa, ya_enviado: true } }));
      authFetch(`${API}/players/estado-cuenta-marcar?club_id=${getClubId()}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: data.atleta.cedula, enviado: true }),
      }).catch(() => {});
    }
  };

  const copiarLink = async () => {
    try { await navigator.clipboard.writeText(data.portal_url); avisar('Link del portal copiado'); }
    catch { avisar('No se pudo copiar el link'); }
  };

  const descargarPdf = async () => {
    setGenerandoPdf(true);
    try { await generarPdfEstadoCuenta(data, clubConfig); }
    catch { avisar('No se pudo generar el PDF'); }
    finally { setGenerandoPdf(false); }
  };

  const saldoTorneos = (data?.torneos || []).reduce((s, t) => s + t.saldo_pendiente, 0);
  const saldoUniformes = (data?.uniformes || []).reduce((s, u) => s + Math.max(0, u.saldo_pendiente), 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto bg-[var(--bg-card)] sm:rounded-2xl border border-[var(--cc20)] shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Encabezado + buscador */}
        <div className="sticky top-0 z-10 bg-[var(--bg-card)] border-b border-[var(--cc20)] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Receipt className="w-5 h-5 shrink-0" style={{ color }} />
              <h2 className="text-lg font-bold text-[var(--text-pri)] truncate">Estado de cuenta</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-sec)] hover:text-[var(--text-pri)] hover:bg-[var(--cc12)]" aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-mut)]" />
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
              placeholder="Buscar jugador por nombre o cédula…"
              className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[var(--cc)]" />
            {resultados.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--cc20)] rounded-xl shadow-xl overflow-hidden">
                {resultados.map(j => (
                  <button key={j.cedula} onClick={() => { abrir(j.cedula); setQ(''); }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-[var(--cc12)]">
                    <span className="min-w-0">
                      <span className="block text-sm text-[var(--text-pri)] truncate">{j.nombre} {j.apellidos}</span>
                      <span className="block text-xs text-[var(--text-mut)]">CC {j.cedula}{j.categoria ? ` · ${j.equipo || j.categoria}` : ''}</span>
                    </span>
                    {j.activo === false && <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--cc20)] text-[var(--text-mut)] shrink-0">Archivado</span>}
                  </button>
                ))}
              </div>
            )}
            {q.trim().length >= 2 && resultados.length === 0 && (
              <p className="mt-2 text-xs text-[var(--text-mut)]">Sin coincidencias para “{q}”.</p>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {!cedula && (
            <div className="text-center py-12 text-[var(--text-mut)]">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Busca un jugador para ver su estado de cuenta: lo mismo que ve su familia en el Portal.</p>
            </div>
          )}
          {cargando && <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin" style={{ color }} /></div>}
          {error && <p className="text-sm text-[#FF5E5E] text-center py-8">{error}</p>}

          {data && !cargando && (
            <>
              {/* Jugador */}
              <div className="flex items-center gap-3">
                {data.atleta.foto_url
                  ? <img src={data.atleta.foto_url} alt="" className="w-14 h-14 rounded-xl object-cover border border-[var(--cc20)] shrink-0" />
                  : <div className="w-14 h-14 rounded-xl bg-[var(--bg-app)] border border-[var(--cc20)] shrink-0" />}
                <div className="min-w-0">
                  <p className="text-base font-bold text-[var(--text-pri)] break-words">{data.atleta.nombre} {data.atleta.apellidos}</p>
                  <p className="text-xs text-[var(--text-sec)]">CC {data.atleta.cedula}{data.atleta.equipo || data.atleta.categoria ? ` · ${data.atleta.equipo || data.atleta.categoria}` : ''}{data.atleta.activo === false ? ' · Archivado' : ''}</p>
                  {data.atleta.familiar_emergencia && <p className="text-xs text-[var(--text-mut)] break-words">Acudiente: {data.atleta.familiar_emergencia}{data.atleta.celular ? ` · ${data.atleta.celular}` : ''}</p>}
                </div>
              </div>

              {/* Acciones */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onClick={enviarWhatsApp} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1fb857]">
                  {data.wa?.ya_enviado ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />} WhatsApp
                </button>
                <button onClick={descargarPdf} disabled={generandoPdf} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: color }}>
                  {generandoPdf ? <Loader className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} PDF
                </button>
                <button onClick={copiarLink} disabled={!data.portal_url} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm border border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--text-pri)] disabled:opacity-40">
                  <Link2 className="w-4 h-4" /> Copiar link
                </button>
                <button onClick={() => window.open(data.portal_url, '_blank', 'noopener,noreferrer')} disabled={!data.portal_url} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm border border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--text-pri)] disabled:opacity-40">
                  <ExternalLink className="w-4 h-4" /> Ver portal
                </button>
              </div>
              {data.wa?.ya_enviado && <p className="text-xs text-[var(--text-mut)] -mt-2">✓ Estado de cuenta ya enviado este mes</p>}

              {/* Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  ['Mensualidades', data.esExento ? 'Exento' : data.saldo_pendiente > 0 ? fmt(data.saldo_pendiente) : 'Al día', data.saldo_pendiente > 0 ? '#EF4444' : '#22C55E', data.meses_pendientes ? `${data.meses_pendientes} mes${data.meses_pendientes > 1 ? 'es' : ''} pendiente${data.meses_pendientes > 1 ? 's' : ''}` : 'Sin saldo'],
                  ['Pagado en el año', fmt(data.total_pagado), 'var(--text-pri)', 'Mensualidades'],
                  ['Torneos', saldoTorneos > 0 ? fmt(saldoTorneos) : 'Al día', saldoTorneos > 0 ? '#F59E0B' : '#22C55E', `${data.torneos.length} inscripción${data.torneos.length === 1 ? '' : 'es'}`],
                  ['Uniformes', saldoUniformes > 0 ? fmt(saldoUniformes) : 'Al día', saldoUniformes > 0 ? '#F59E0B' : '#22C55E', `${data.uniformes.length} pedido${data.uniformes.length === 1 ? '' : 's'}`],
                ].map(([label, valor, c, sub]) => (
                  <div key={label} className="rounded-xl bg-[var(--bg-app)] border border-[var(--cc20)] p-3 min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-mut)]">{label}</p>
                    <p className="text-base font-bold break-words" style={{ color: c }}>{valor}</p>
                    <p className="text-[11px] text-[var(--text-mut)]">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Mensualidades */}
              <Seccion titulo={`Mensualidades ${data.mensualidades[0]?.anio || ''}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {data.mensualidades.map(m => {
                    const cfg = ESTADO_CFG[m.estado] || ESTADO_CFG.pendiente;
                    return (
                      <div key={m.numero_mes} className="flex items-center justify-between gap-2 py-2 border-b border-[var(--cc20)]/50">
                        <span className="text-sm text-[var(--text-pri)] w-24 shrink-0">{m.mes}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>{cfg.label}</span>
                        <span className="text-xs font-mono text-[var(--text-sec)] text-right ml-auto whitespace-nowrap">
                          {esFuturo(m) && m.valor_pagado === 0 ? fmt(m.valor_oficial)
                            : m.saldo > 0 ? <span className="text-[#EF4444]">debe {fmt(m.saldo)}</span> : fmt(m.valor_pagado)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Seccion>

              {data.torneos.length > 0 && (
                <Seccion titulo="Torneos">
                  {data.torneos.map(t => (
                    <Fila key={t.id} izq={t.nombre_torneo} der={t.saldo_pendiente > 0 ? `debe ${fmt(t.saldo_pendiente)}` : 'Pagado'} alerta={t.saldo_pendiente > 0}
                      sub={`Valor ${fmt(t.valor_inscrito)} · pagado ${fmt(t.valor_pagado)}`} />
                  ))}
                </Seccion>
              )}

              {data.uniformes.length > 0 && (
                <Seccion titulo="Uniformes">
                  {data.uniformes.map(u => (
                    <Fila key={u.id} izq={u.descripcion} alerta={u.saldo_pendiente > 0}
                      der={u.saldo_pendiente > 0 ? `debe ${fmt(u.saldo_pendiente)}` : u.estado === 'ENTREGADO' ? 'Entregado' : 'Pagado'}
                      sub={`Total ${fmt(u.valor_oficial)} · pagado ${fmt(u.valor_pagado)}${u.talla ? ` · talla ${u.talla}` : ''}${u.numero ? ` · #${u.numero}` : ''}`} />
                  ))}
                </Seccion>
              )}

              <Seccion titulo="Historial de pagos">
                {data.pagos.length === 0
                  ? <p className="text-sm text-[var(--text-mut)] py-2">Sin pagos registrados.</p>
                  : data.pagos.map(p => (
                    <Fila key={p.id} izq={`${CONCEPTO[p.concepto] || p.concepto || 'Pago'} · ${fechaCorta(p.fecha)}`} der={fmt(p.monto)}
                      alerta={p.estado_revision === 'rechazado'}
                      sub={[p.banco, REVISION[p.estado_revision] || p.estado_revision, p.referencia].filter(Boolean).join(' · ')} />
                  ))}
              </Seccion>
            </>
          )}
        </div>

        {toast && (
          <div className="sticky bottom-0 m-4 px-4 py-3 rounded-xl bg-[var(--bg-app)] border border-[var(--cc20)] text-sm text-[var(--text-pri)] shadow-lg">{toast}</div>
        )}
      </div>
    </div>
  );
}

function Seccion({ titulo, children }) {
  return (
    <div className="rounded-xl bg-[var(--bg-app)] border border-[var(--cc20)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-mut)] mb-1">{titulo}</p>
      {children}
    </div>
  );
}

function Fila({ izq, der, sub, alerta }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-[var(--cc20)]/50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-[var(--text-pri)] break-words">{izq}</p>
        {sub && <p className="text-[11px] text-[var(--text-mut)] break-words">{sub}</p>}
      </div>
      <span className={`text-sm font-mono whitespace-nowrap ${alerta ? 'text-[#EF4444]' : 'text-[var(--text-sec)]'}`}>{der}</span>
    </div>
  );
}

// PDF de 1 página (A4) con el mismo contenido de la vista — para mandarlo por WhatsApp o imprimirlo.
async function generarPdfEstadoCuenta(data, clubConfig) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const accent = hexToRgb(clubConfig?.color || data.club?.color || '#E14924');
  const clubName = clubConfig?.nombre || data.club?.nombre || 'Mi Club';
  const logoData = await loadLogoDataUrl(clubConfig?.logo_url || data.club?.logo_url);
  const hoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const pesos = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
  const a = data.atleta;

  let y = drawPdfHeader(doc, { W, M, clubName, title: 'ESTADO DE CUENTA', date: `Generado el ${hoy}`, logoData, accentRgb: accent });

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 30, 30);
  doc.text(`${a.nombre} ${a.apellidos}`.trim(), M, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(100, 100, 100);
  doc.text([`CC ${a.cedula}`, a.equipo || a.categoria, a.familiar_emergencia && `Acudiente: ${a.familiar_emergencia}`].filter(Boolean).join('   ·   '), M, y + 5);
  y += 12;

  // Resumen
  const saldoTorneos = data.torneos.reduce((s, t) => s + t.saldo_pendiente, 0);
  const saldoUnif = data.uniformes.reduce((s, u) => s + Math.max(0, u.saldo_pendiente), 0);
  const cajas = [
    ['Mensualidades', data.esExento ? 'Exento' : data.saldo_pendiente > 0 ? pesos(data.saldo_pendiente) : 'Al día', data.saldo_pendiente > 0],
    ['Pagado en el año', pesos(data.total_pagado), false],
    ['Torneos', saldoTorneos > 0 ? pesos(saldoTorneos) : 'Al día', saldoTorneos > 0],
    ['Uniformes', saldoUnif > 0 ? pesos(saldoUnif) : 'Al día', saldoUnif > 0],
  ];
  const cw = (W - M * 2 - 6) / 4;
  cajas.forEach(([label, valor, debe], i) => {
    const x = M + i * (cw + 2);
    doc.setFillColor(246, 247, 249); doc.roundedRect(x, y, cw, 15, 2, 2, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
    doc.text(label.toUpperCase(), x + 3, y + 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
    doc.setTextColor(...(debe ? [220, 38, 38] : [22, 163, 74]));
    if (label === 'Pagado en el año') doc.setTextColor(30, 30, 30);
    doc.text(valor, x + 3, y + 11.5);
  });
  y += 21;

  // Mensualidades
  y = drawPdfSectionLabel(doc, { W, M, y, label: `MENSUALIDADES ${data.mensualidades[0]?.anio || ''}`, accentRgb: accent });
  y = drawPdfTableHead(doc, { W, M, y, accentRgb: accent, columns: [
    { label: 'Mes', x: M + 2 }, { label: 'Estado', x: M + 40 }, { label: 'Valor', x: W - M - 60, align: 'right' },
    { label: 'Pagado', x: W - M - 32, align: 'right' }, { label: 'Saldo', x: W - M - 2, align: 'right' } ] });
  doc.setFontSize(8);
  data.mensualidades.forEach(m => {
    const cfg = ESTADO_CFG[m.estado] || ESTADO_CFG.pendiente;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
    doc.text(m.mes, M + 2, y);
    doc.setTextColor(...hexToRgb(cfg.color)); doc.setFont('helvetica', 'bold');
    doc.text(cfg.label, M + 40, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
    doc.text(m.estado === 'no_aplica' || m.estado === 'exento' ? '—' : pesos(m.valor_oficial), W - M - 60, y, { align: 'right' });
    doc.text(pesos(m.valor_pagado), W - M - 32, y, { align: 'right' });
    const debe = m.saldo > 0 && !esFuturo(m);
    if (debe) doc.setTextColor(220, 38, 38);
    doc.text(debe ? pesos(m.saldo) : '—', W - M - 2, y, { align: 'right' });
    y += 5.2;
  });
  y += 3;

  const lista = (titulo, filas) => {
    if (!filas.length || y > H - 40) return;
    y = drawPdfSectionLabel(doc, { W, M, y, label: titulo, accentRgb: accent });
    doc.setFontSize(8);
    filas.forEach(([izq, der, rojo]) => {
      if (y > H - 20) return;
      doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
      const lineas = doc.splitTextToSize(izq, W - M * 2 - 45);
      doc.text(lineas, M + 2, y);
      doc.setTextColor(...(rojo ? [220, 38, 38] : [60, 60, 60]));
      doc.text(der, W - M - 2, y, { align: 'right' });
      y += 4.6 * lineas.length + 0.8;
    });
    y += 3;
  };
  lista('TORNEOS', data.torneos.map(t => [t.nombre_torneo, t.saldo_pendiente > 0 ? `Debe ${pesos(t.saldo_pendiente)}` : 'Pagado', t.saldo_pendiente > 0]));
  lista('UNIFORMES', data.uniformes.map(u => [u.descripcion, u.saldo_pendiente > 0 ? `Debe ${pesos(u.saldo_pendiente)}` : u.estado === 'ENTREGADO' ? 'Entregado' : 'Pagado', u.saldo_pendiente > 0]));
  lista('ÚLTIMOS PAGOS', data.pagos.filter(p => p.estado_revision === 'aprobado_manual').slice(0, 8)
    .map(p => [`${fechaCorta(p.fecha)} · ${CONCEPTO[p.concepto] || 'Pago'}${p.banco ? ` · ${p.banco}` : ''}`, pesos(p.monto), false]));

  if (data.portal_url && y < H - 22) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 100, 100);
    doc.text('Consulta tu cuenta actualizada en:', M, y + 2);
    doc.setTextColor(...accent); doc.textWithLink(data.portal_url, M, y + 6.5, { url: data.portal_url });
  }
  drawPdfFooter(doc, { W, H, M, clubName, note: 'Estado de cuenta generado desde ZenSports' });
  doc.save(`estado-cuenta-${normalizar(a.nombre).replace(/\s+/g, '-')}-${a.cedula}.pdf`);
}
