import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle,
  Loader2, Users, Plus, ClipboardList, X, Download,
  MoreHorizontal, Edit2, Trash2, AlertTriangle,
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';
import {
  drawPdfHeader, drawPdfFooter, drawPdfTableHead,
  hexToRgb, loadLogoDataUrl,
} from '../lib/pdfHelpers';

// ── Utilidades ────────────────────────────────────────────────────────────────

const pad2 = n => String(n).padStart(2, '0');

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return localDateStr(new Date(y, m - 1, d + n));
}

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
               'julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DIAS_CORTO  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function formatLabel(dateStr) {
  const hoy    = localDateStr();
  if (dateStr === hoy)             return 'Hoy';
  if (dateStr === addDays(hoy,-1)) return 'Ayer';
  if (dateStr === addDays(hoy, 1)) return 'Mañana';
  const [, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(dateStr.replace(/-/g, '/'));
  return `${DIAS_CORTO[dt.getDay()]} ${d} ${MESES_CORTO[m - 1]}`;
}

function formatFechaLarga(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt  = new Date(y, m - 1, d);
  const dia = dt.toLocaleDateString('es-CO', { weekday: 'long' });
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${d} de ${MESES[m - 1]}`;
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function horaActualRedondeada() {
  const now = new Date();
  const h   = now.getMinutes() >= 30 ? (now.getHours() + 1) % 24 : now.getHours();
  return `${pad2(h)}:00`;
}

function extractLocalTime(ts) {
  if (!ts) return '08:00';
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const ESTADOS = {
  PRESENTE:    { label: 'Presente',    color: '#22C55E', bg: '#22C55E20', Icon: CheckCircle2 },
  AUSENTE:     { label: 'Ausente',     color: '#EF4444', bg: '#EF444420', Icon: XCircle      },
  JUSTIFICADO: { label: 'Justificado', color: '#F59E0B', bg: '#F59E0B20', Icon: AlertCircle  },
  PENDIENTE:   { label: 'Pendiente',   color: '#9CA3AF', bg: 'transparent', Icon: null       },
};

const BOTONESESTADO = [
  { key: 'PRESENTE',    Icon: CheckCircle2, activeColor: '#22C55E' },
  { key: 'AUSENTE',     Icon: XCircle,      activeColor: '#EF4444' },
  { key: 'JUSTIFICADO', Icon: AlertCircle,  activeColor: '#F59E0B' },
];

const INPUT   = 'w-full bg-[var(--bg-surface)] border border-[var(--cc20)] focus:border-[var(--cc)] text-[var(--text-pri)] placeholder-[var(--text-mut)] rounded-lg px-3 py-2 text-sm outline-none transition-colors';
const SEL_TI  = 'bg-[var(--bg-surface)] border border-[var(--cc20)] text-[var(--text-pri)] rounded-lg px-2 py-2 text-sm outline-none focus:border-[var(--cc)] transition-colors cursor-pointer';

const HORAS_TI   = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTOS_TI = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function TimeInput({ value, onChange }) {
  const [rawH, rawM] = (value || '08:00').split(':').map(Number);
  const ampm   = rawH >= 12 ? 'PM' : 'AM';
  const hour12 = rawH === 0 ? 12 : rawH > 12 ? rawH - 12 : rawH;
  function emit(h12, min, ap) {
    let h24 = h12 % 12;
    if (ap === 'PM') h24 += 12;
    onChange(`${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <select value={hour12} onChange={e => emit(Number(e.target.value), rawM, ampm)} className={SEL_TI} style={{ minWidth: '52px' }}>
        {HORAS_TI.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <select value={rawM} onChange={e => emit(hour12, Number(e.target.value), ampm)} className={SEL_TI} style={{ minWidth: '60px' }}>
        {MINUTOS_TI.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
      </select>
      <select value={ampm} onChange={e => emit(hour12, rawM, e.target.value)} className={SEL_TI} style={{ minWidth: '62px' }}>
        <option value="AM">a. m.</option>
        <option value="PM">p. m.</option>
      </select>
    </div>
  );
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AsistenciaPage({ color = '#E14924', jugadores = [], clubConfig }) {
  const clubId   = getClubId();
  const menuRef  = useRef(null);

  // ── Estado principal
  const [fecha,        setFecha]        = useState(localDateStr);
  const [eventos,      setEventos]      = useState([]);
  const [loadingEv,    setLoadingEv]    = useState(false);
  const [eventoActivo, setEventoActivo] = useState(null);
  const [players,      setPlayers]      = useState([]);
  const [loadingAs,    setLoadingAs]    = useState(false);
  const [saving,       setSaving]       = useState({});
  const [search,       setSearch]       = useState('');

  // ── Quick create
  const [crearEquipoSel, setCrearEquipoSel] = useState('');
  const [creandoRapido,  setCreandoRapido]  = useState(false);

  // ── Menú ··· por evento
  const [showMenuId, setShowMenuId] = useState(null);

  // ── Editar evento
  const [eventoEditando,   setEventoEditando]   = useState(null);
  const [formEdicion,      setFormEdicion]      = useState({ titulo: '', hora: '', equipo: '' });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // ── Eliminar evento
  const [eventoEliminando, setEventoEliminando] = useState(null);
  const [eliminandoEvento, setEliminandoEvento] = useState(false);

  // ── Export PDF
  const [exportandoPDF, setExportandoPDF] = useState(false);

  // ── Caché de asistencia por evento (persiste al volver a la lista)
  const [asistCache, setAsistCache] = useState({});

  // ── Drawer historial jugador
  const [jugadorDrawer,    setJugadorDrawer]    = useState(null);
  const [historialJugador, setHistorialJugador] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Categorías únicas de jugadores activos para chips
  const equiposDisponibles = useMemo(() => {
    const set = new Set();
    jugadores.forEach(j => {
      if (j.activo !== false) {
        (j.categorias || []).forEach(cat => { if (cat) set.add(cat); });
      }
    });
    return Array.from(set).sort();
  }, [jugadores]);

  // Cerrar menú ··· al hacer click afuera
  useEffect(() => {
    if (!showMenuId) return;
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenuId(null);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showMenuId]);

  // Recargar eventos al cambiar fecha
  useEffect(() => {
    setEventoActivo(null);
    setPlayers([]);
    setSearch('');
    cargarEventos(fecha);
  }, [fecha]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync caché cuando cambian los jugadores del evento activo
  useEffect(() => {
    if (!eventoActivo || players.length === 0) return;
    const s = { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0, PENDIENTE: 0 };
    players.forEach(p => { s[p.estado] = (s[p.estado] || 0) + 1; });
    setAsistCache(c => ({ ...c, [eventoActivo.id]: { ...s, total: players.length } }));
  }, [players, eventoActivo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Funciones de datos ────────────────────────────────────────────────────

  async function cargarEventos(f) {
    setLoadingEv(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/calendario?club_id=${clubId}&desde=${f}&hasta=${f}T23:59:59`);
      const data = await res.json();
      setEventos((data.data || []).filter(e => e.tipo === 'ENTRENAMIENTO'));
    } catch {
      setEventos([]);
    } finally {
      setLoadingEv(false);
    }
  }

  async function seleccionarEvento(ev) {
    setEventoActivo(ev);
    setSearch('');
    setLoadingAs(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/asistencia/${ev.id}?club_id=${clubId}`);
      const data = await res.json();
      setPlayers(data.data || []);
    } catch {
      setPlayers([]);
    } finally {
      setLoadingAs(false);
    }
  }

  async function markAsistencia(cedula, estado) {
    const prev = players.find(p => p.cedula === cedula)?.estado;
    setPlayers(ps => ps.map(p => p.cedula === cedula ? { ...p, estado } : p));
    setSaving(s => ({ ...s, [cedula]: true }));
    try {
      await authFetch(
        `${API_BASE_URL}/asistencia/${eventoActivo.id}/${cedula}?club_id=${clubId}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) }
      );
    } catch {
      setPlayers(ps => ps.map(p => p.cedula === cedula ? { ...p, estado: prev } : p));
    } finally {
      setSaving(s => { const n = { ...s }; delete n[cedula]; return n; });
    }
  }

  // ── Quick create ───────────────────────────────────────────────────────────

  async function crearRapido(equipo = crearEquipoSel) {
    setCreandoRapido(true);
    try {
      const hora = horaActualRedondeada();
      const res  = await authFetch(`${API_BASE_URL}/calendario?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo:         'ENTRENAMIENTO',
          titulo:       `Entrenamiento ${formatLabel(fecha)}`,
          fecha_inicio: new Date(`${fecha}T${hora}`).toISOString(),
          equipo:       equipo || null,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        await cargarEventos(fecha);
        await seleccionarEvento(data.data);
      }
    } finally {
      setCreandoRapido(false);
    }
  }

  // ── Editar evento ──────────────────────────────────────────────────────────

  function abrirEdicion(ev) {
    setShowMenuId(null);
    setEventoEditando(ev);
    setFormEdicion({ titulo: ev.titulo, hora: extractLocalTime(ev.fecha_inicio), equipo: ev.equipo || '' });
  }

  async function guardarEdicion() {
    if (!eventoEditando) return;
    setGuardandoEdicion(true);
    try {
      const fechaEv = localDateStr(new Date(eventoEditando.fecha_inicio));
      const res = await authFetch(
        `${API_BASE_URL}/calendario/${eventoEditando.id}?club_id=${clubId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titulo:       formEdicion.titulo,
            fecha_inicio: new Date(`${fechaEv}T${formEdicion.hora}`).toISOString(),
            equipo:       formEdicion.equipo || null,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setEventos(evs => evs.map(e => e.id === eventoEditando.id ? data.data : e));
        if (eventoActivo?.id === eventoEditando.id) setEventoActivo(data.data);
        setEventoEditando(null);
      }
    } finally {
      setGuardandoEdicion(false);
    }
  }

  // ── Eliminar evento ────────────────────────────────────────────────────────

  function abrirEliminar(ev) {
    setShowMenuId(null);
    setEventoEliminando(ev);
  }

  async function confirmarEliminar() {
    if (!eventoEliminando) return;
    setEliminandoEvento(true);
    try {
      await authFetch(
        `${API_BASE_URL}/calendario/${eventoEliminando.id}?club_id=${clubId}`,
        { method: 'DELETE' }
      );
      if (eventoActivo?.id === eventoEliminando.id) volverAEventos();
      setEventos(evs => evs.filter(e => e.id !== eventoEliminando.id));
      setEventoEliminando(null);
    } finally {
      setEliminandoEvento(false);
    }
  }

  function volverAEventos() {
    setEventoActivo(null);
    setPlayers([]);
    setSearch('');
  }

  // ── Export PDF ─────────────────────────────────────────────────────────────

  async function exportarPDF() {
    if (exportandoPDF || !eventoActivo || players.length === 0) return;
    setExportandoPDF(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const W = 210, M = 14, H = 297;
      const accentRgb = hexToRgb(color);
      const logoData  = await loadLogoDataUrl(clubConfig?.logo_url);
      const clubName  = clubConfig?.nombre || 'Mi Club';
      const subtitle  = `${formatFechaLarga(localDateStr(new Date(eventoActivo.fecha_inicio)))} · ${formatTime(eventoActivo.fecha_inicio)}${eventoActivo.equipo ? ` · ${eventoActivo.equipo}` : ''}`;

      let y = drawPdfHeader(doc, {
        W, M, clubName,
        title: eventoActivo.titulo,
        subtitle,
        logoData, accentRgb, height: 32,
      });

      // Cajas de stats
      const statItems = [
        { label: 'Presentes',  value: stats.PRESENTE,    rgb: [34, 197, 94]   },
        { label: 'Ausentes',   value: stats.AUSENTE,     rgb: [239, 68, 68]   },
        { label: 'Justific.',  value: stats.JUSTIFICADO, rgb: [245, 158, 11]  },
        { label: 'Pendientes', value: stats.PENDIENTE,   rgb: [156, 163, 175] },
      ];
      const boxW = (W - M * 2 - 6) / 4;
      statItems.forEach((s, i) => {
        const bx = M + i * (boxW + 2);
        doc.setFillColor(...s.rgb);
        doc.roundedRect(bx, y, boxW, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text(String(s.value), bx + boxW / 2, y + 8.5, { align: 'center' });
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.text(s.label, bx + boxW / 2, y + 12.5, { align: 'center' });
      });
      y += 20;

      // Tabla
      const cols = [
        { label: '#',      x: M + 2   },
        { label: 'Nombre', x: M + 12  },
        { label: 'CC',     x: M + 105 },
        { label: 'Estado', x: M + 148 },
      ];
      y = drawPdfTableHead(doc, { W, M, y, columns: cols, accentRgb });

      const sortedPlayers = [...players].sort((a, b) =>
        `${a.nombre||''} ${a.apellidos||''}`.toUpperCase().localeCompare(`${b.nombre||''} ${b.apellidos||''}`.toUpperCase(), 'es')
      );
      sortedPlayers.forEach((p, idx) => {
        if (y > 278) {
          drawPdfFooter(doc, { W, H, M, clubName });
          doc.addPage();
          y = drawPdfTableHead(doc, { W, M, y: 18, columns: cols, accentRgb });
        }
        if (idx % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(M - 2, y - 4, W - M * 2 + 4, 8, 'F');
        }
        const estRgb = {
          PRESENTE:    [34, 197, 94],
          AUSENTE:     [239, 68, 68],
          JUSTIFICADO: [245, 158, 11],
          PENDIENTE:   [156, 163, 175],
        }[p.estado] || [156, 163, 175];

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(60, 60, 60);
        doc.text(String(idx + 1), M + 2, y);
        doc.text(`${p.nombre || ''} ${p.apellidos || ''}`.trim().toUpperCase().slice(0, 38), M + 12, y);
        doc.text(String(p.cedula || ''), M + 105, y);
        doc.setTextColor(...estRgb);
        doc.setFont('helvetica', 'bold');
        doc.text((ESTADOS[p.estado]?.label || p.estado).toUpperCase(), M + 148, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        y += 8;
      });

      drawPdfFooter(doc, { W, H, M, clubName });
      doc.save(`asistencia-${eventoActivo.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } finally {
      setExportandoPDF(false);
    }
  }

  // ── Drawer historial jugador ───────────────────────────────────────────────

  async function abrirDrawerJugador(p) {
    setJugadorDrawer(p);
    setHistorialJugador([]);
    setLoadingHistorial(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/asistencia/jugador/${p.cedula}?club_id=${clubId}`);
      const data = await res.json();
      setHistorialJugador(data.data || []);
    } catch {
      setHistorialJugador([]);
    } finally {
      setLoadingHistorial(false);
    }
  }

  // ── Memos ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const s = { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0, PENDIENTE: 0 };
    players.forEach(p => { s[p.estado] = (s[p.estado] || 0) + 1; });
    return s;
  }, [players]);

  const filtered = useMemo(() => {
    if (!search.trim()) return players;
    const q = search.toLowerCase();
    return players.filter(p =>
      `${p.nombre || ''} ${p.apellidos || ''}`.toLowerCase().includes(q) ||
      String(p.cedula || '').includes(q)
    );
  }, [players, search]);

  const pctAsistencia = useMemo(() => {
    if (!historialJugador.length) return null;
    const marcados  = historialJugador.filter(h => h.estado !== 'PENDIENTE').length;
    const presentes = historialJugador.filter(h => h.estado === 'PRESENTE').length;
    if (!marcados) return null;
    return Math.round((presentes / marcados) * 100);
  }, [historialJugador]);

  const label      = formatLabel(fecha);
  const esNombrado = ['Hoy', 'Ayer', 'Mañana'].includes(label);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-app)' }}>

      {/* ── Navegador de fecha ─────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--cc20)', background: 'var(--bg-card)',
      }}>
        <button onClick={() => setFecha(f => addDays(f, -1))} style={S.navBtn}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-pri)', lineHeight: 1.2 }}>{label}</p>
          <p style={{ fontSize: '11px', color: 'var(--text-mut)', marginTop: '2px' }}>
            {esNombrado ? formatFechaLarga(fecha) : formatFechaLarga(fecha)}
          </p>
        </div>
        <button onClick={() => setFecha(f => addDays(f, 1))} style={S.navBtn}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Sin evento activo: lista ───────────────────────────────────────── */}
      {!eventoActivo && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {loadingEv ? (
            <div style={S.centered}>
              <Loader2 size={20} style={{ color }} className="animate-spin" />
              <span style={{ fontSize: '14px', color: 'var(--text-sec)' }}>Cargando entrenamientos…</span>
            </div>

          ) : eventos.length > 0 ? (
            <>
              <p style={S.sectionLabel}>Entrenamientos del día</p>

              {eventos.map(ev => (
                <div key={ev.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', borderRadius: '16px', border: '1px solid var(--cc20)', background: 'var(--bg-card)', overflow: 'visible' }}>
                  {/* Área principal — selecciona el evento */}
                  <button onClick={() => seleccionarEvento(ev)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 10px 14px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0 }}>
                    <div style={{ width: '3px', alignSelf: 'stretch', borderRadius: '99px', background: '#3B82F6', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-pri)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.titulo}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-sec)', marginTop: '2px' }}>
                        {formatTime(ev.fecha_inicio)}{ev.equipo ? ` · ${ev.equipo}` : ''}
                      </p>
                      {asistCache[ev.id] && (
                        <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#22C55E', background: '#22C55E20', padding: '2px 7px', borderRadius: '99px' }}>
                            ✓ {asistCache[ev.id].PRESENTE} presentes
                          </span>
                          {asistCache[ev.id].PENDIENTE > 0 && (
                            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-mut)', background: 'var(--bg-surface)', padding: '2px 7px', borderRadius: '99px', border: '1px solid var(--cc20)' }}>
                              {asistCache[ev.id].PENDIENTE} pendientes
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Botón ··· */}
                  <div style={{ position: 'relative', flexShrink: 0, paddingRight: '10px' }}
                    ref={showMenuId === ev.id ? menuRef : null}>
                    <button
                      onClick={e => { e.stopPropagation(); setShowMenuId(showMenuId === ev.id ? null : ev.id); }}
                      style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-mut)', cursor: 'pointer', display: 'flex' }}>
                      <MoreHorizontal size={18} />
                    </button>
                    {showMenuId === ev.id && (
                      <div style={{
                        position: 'absolute', right: 0, top: '100%', zIndex: 30,
                        background: 'var(--bg-card)', border: '1px solid var(--cc20)',
                        borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        overflow: 'hidden', minWidth: '140px',
                      }}>
                        <button onClick={() => abrirEdicion(ev)} style={S.menuItem}>
                          <Edit2 size={14} /> Editar
                        </button>
                        <button onClick={() => abrirEliminar(ev)} style={{ ...S.menuItem, color: '#EF4444' }}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Crear otro — directo sin modal */}
              <button
                onClick={() => crearRapido('')}
                disabled={creandoRapido}
                style={{ ...S.dashedBtn, opacity: creandoRapido ? 0.6 : 1 }}>
                {creandoRapido ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {creandoRapido ? 'Creando…' : 'Crear otro entrenamiento'}
              </button>
            </>

          ) : (
            /* Estado vacío — quick create con chips */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '48px 16px 24px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}1F` }}>
                <ClipboardList size={28} style={{ color }} />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-pri)' }}>Sin entrenamientos</p>
                <p style={{ fontSize: '13px', color: 'var(--text-sec)', marginTop: '4px', lineHeight: 1.5 }}>
                  No hay entrenamientos para {label.toLowerCase()}.
                </p>
              </div>

              {/* Chips de equipo */}
              {equiposDisponibles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setCrearEquipoSel('')}
                    style={{ ...S.chip, ...(crearEquipoSel === '' ? { background: color, color: '#fff', borderColor: color } : {}) }}>
                    Todos
                  </button>
                  {equiposDisponibles.map(eq => (
                    <button key={eq}
                      onClick={() => setCrearEquipoSel(eq)}
                      style={{ ...S.chip, ...(crearEquipoSel === eq ? { background: color, color: '#fff', borderColor: color } : {}) }}>
                      {eq}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => crearRapido(crearEquipoSel)}
                disabled={creandoRapido}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '12px', background: color, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, opacity: creandoRapido ? 0.65 : 1, transition: 'opacity 0.15s' }}>
                {creandoRapido ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {creandoRapido ? 'Creando…' : 'Crear entrenamiento y pasar lista'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Con evento activo: lista de jugadores ─────────────────────────── */}
      {eventoActivo && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

          {/* Header del evento */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid var(--cc20)', background: 'var(--bg-card)' }}>
            <button onClick={volverAEventos} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'var(--bg-surface)', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-pri)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {eventoActivo.titulo}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-sec)', marginTop: '1px' }}>
                {formatTime(eventoActivo.fecha_inicio)}{eventoActivo.equipo ? ` · ${eventoActivo.equipo}` : ''}
              </p>
            </div>
            {/* Botón exportar PDF */}
            <button
              onClick={exportarPDF}
              disabled={exportandoPDF || loadingAs || players.length === 0}
              title="Exportar PDF"
              style={{ padding: '7px', borderRadius: '9px', border: '1px solid var(--cc20)', background: 'var(--bg-surface)', color: exportandoPDF ? color : 'var(--text-sec)', cursor: players.length === 0 ? 'default' : 'pointer', display: 'flex', flexShrink: 0, opacity: players.length === 0 ? 0.4 : 1, transition: 'opacity 0.15s' }}>
              {exportandoPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            </button>
          </div>

          {/* Stats bar */}
          {!loadingAs && players.length > 0 && (
            <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '10px 16px', borderBottom: '1px solid var(--cc20)', background: 'var(--bg-card)' }}>
              {[
                { key: 'PRESENTE',    label: 'Presentes',  c: '#22C55E'          },
                { key: 'AUSENTE',     label: 'Ausentes',   c: '#EF4444'          },
                { key: 'JUSTIFICADO', label: 'Justific.',  c: '#F59E0B'          },
                { key: 'PENDIENTE',   label: 'Pendientes', c: 'var(--text-mut)'  },
              ].map(({ key, label: lb, c }) => (
                <div key={key} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: c, lineHeight: 1 }}>{stats[key] || 0}</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-mut)', marginTop: '3px' }}>{lb}</p>
                </div>
              ))}
            </div>
          )}

          {/* Buscador */}
          {!loadingAs && players.length > 6 && (
            <div style={{ flexShrink: 0, padding: '10px 16px', borderBottom: '1px solid var(--cc20)', background: 'var(--bg-card)' }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar jugador…" className={INPUT} />
            </div>
          )}

          {/* Lista de jugadores */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingAs ? (
              <div style={S.centered}>
                <Loader2 size={20} style={{ color }} className="animate-spin" />
                <span style={{ fontSize: '14px', color: 'var(--text-sec)' }}>Cargando jugadores…</span>
              </div>
            ) : players.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                <Users size={36} style={{ margin: '0 auto 10px', opacity: 0.2, color: 'var(--text-sec)' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-sec)' }}>No hay jugadores activos</p>
              </div>
            ) : filtered.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-sec)', paddingTop: '40px' }}>
                Sin resultados para "{search}"
              </p>
            ) : (
              filtered.map(p => {
                const est   = ESTADOS[p.estado] || ESTADOS.PENDIENTE;
                const isSav = saving[p.cedula];
                return (
                  <div key={p.cedula} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '14px', border: '1px solid var(--cc20)', background: p.estado !== 'PENDIENTE' ? est.bg : 'var(--bg-surface)', minHeight: '60px', transition: 'background 0.15s' }}>

                    {/* Avatar — clicable para abrir drawer */}
                    <button onClick={() => abrirDrawerJugador(p)}
                      title="Ver historial"
                      style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, background: est.bg || `${color}1F`, color: est.color !== '#9CA3AF' ? est.color : color, border: 'none', cursor: 'pointer' }}>
                      {(p.nombre?.[0] || '?').toUpperCase()}
                    </button>

                    {/* Nombre — clicable para abrir drawer */}
                    <button onClick={() => abrirDrawerJugador(p)}
                      style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-pri)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                        {p.nombre} {p.apellidos}
                      </p>
                      {(p.equipo || p.categoria) && (
                        <p style={{ fontSize: '11px', color: 'var(--text-sec)', marginTop: '2px' }}>
                          {p.equipo || p.categoria}
                        </p>
                      )}
                    </button>

                    {/* Botones estado */}
                    {isSav ? (
                      <Loader2 size={18} style={{ color, flexShrink: 0 }} className="animate-spin" />
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        {BOTONESESTADO.map(({ key, Icon, activeColor }) => {
                          const activo = p.estado === key;
                          return (
                            <button key={key} onClick={() => markAsistencia(p.cedula, key)}
                              title={ESTADOS[key].label}
                              style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: activo ? activeColor : 'var(--cc20)', background: activo ? activeColor : 'var(--bg-card)', color: activo ? '#fff' : 'var(--text-mut)', cursor: 'pointer', transition: 'all 0.12s' }}>
                              <Icon size={16} strokeWidth={1.8} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {/* Botón guardar lista */}
          {!loadingAs && players.length > 0 && (
            <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid var(--cc20)', background: 'var(--bg-card)', marginTop: 'auto' }}>
              <button onClick={volverAEventos} style={{
                width: '100%', padding: '13px', borderRadius: '12px',
                background: color, color: '#fff', border: 'none',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'opacity 0.15s',
              }}>
                <CheckCircle2 size={16} />
                Guardar lista · {stats.PRESENTE} de {players.length} presentes
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Editar evento ───────────────────────────────────────────── */}
      {eventoEditando && (
        <div style={S.overlay}>
          <div style={S.sheet}>
            <div style={S.sheetHeader}>
              <p style={S.sheetTitle}>Editar entrenamiento</p>
              <button onClick={() => setEventoEditando(null)} style={S.closeBtn}><X size={18} /></button>
            </div>
            <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={S.label}>Título</label>
                <input type="text" value={formEdicion.titulo} onChange={e => setFormEdicion(f => ({ ...f, titulo: e.target.value }))} className={INPUT} />
              </div>
              <div>
                <label style={S.label}>Hora</label>
                <TimeInput value={formEdicion.hora} onChange={v => setFormEdicion(f => ({ ...f, hora: v }))} />
              </div>
              {equiposDisponibles.length > 0 && (
                <div>
                  <label style={S.label}>Equipo <span style={{ fontWeight: 400, color: 'var(--text-mut)' }}>(opcional)</span></label>
                  <select value={formEdicion.equipo} onChange={e => setFormEdicion(f => ({ ...f, equipo: e.target.value }))} className={INPUT} style={{ appearance: 'auto' }}>
                    <option value="">Todos los jugadores</option>
                    {equiposDisponibles.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                </div>
              )}
              <button onClick={guardarEdicion} disabled={guardandoEdicion || !formEdicion.titulo.trim()} style={{ ...S.primaryBtn(color), opacity: guardandoEdicion || !formEdicion.titulo.trim() ? 0.6 : 1 }}>
                {guardandoEdicion ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar eliminar ──────────────────────────────────────── */}
      {eventoEliminando && (
        <div style={S.overlay} onClick={() => !eliminandoEvento && setEventoEliminando(null)}>
          <div style={{ ...S.sheet, border: '2px solid rgba(239,68,68,0.4)', boxShadow: '0 -8px 40px rgba(239,68,68,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertTriangle size={22} color="#EF4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{ color: '#EF4444', fontWeight: 700, fontSize: '14px' }}>Eliminar entrenamiento</p>
                  <p style={{ color: '#f87171', fontSize: '12px', marginTop: '2px', lineHeight: 1.4 }}>Se eliminará el evento y todos sus registros de asistencia. Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-surface)', borderLeft: '3px solid #EF4444' }}>
                <p style={{ color: 'var(--text-pri)', fontWeight: 600, fontSize: '14px' }}>{eventoEliminando.titulo}</p>
                <p style={{ color: 'var(--text-sec)', fontSize: '12px', marginTop: '2px' }}>{formatTime(eventoEliminando.fecha_inicio)}{eventoEliminando.equipo ? ` · ${eventoEliminando.equipo}` : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEventoEliminando(null)} disabled={eliminandoEvento}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--cc20)', background: 'var(--bg-surface)', color: 'var(--text-sec)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button onClick={confirmarEliminar} disabled={eliminandoEvento}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: eliminandoEvento ? 0.65 : 1 }}>
                  {eliminandoEvento ? <><Loader2 size={14} className="animate-spin" /> Eliminando…</> : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer: Historial del jugador ──────────────────────────────────── */}
      {jugadorDrawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }} onClick={() => setJugadorDrawer(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px', height: '100%', background: 'var(--bg-card)', borderLeft: '1px solid var(--cc20)', display: 'flex', flexDirection: 'column', animation: 'slide-in-right 0.2s ease both', boxShadow: '-8px 0 40px rgba(0,0,0,0.25)' }}>

            {/* Header */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--cc20)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${color}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color, flexShrink: 0 }}>
                {(jugadorDrawer.nombre?.[0] || '?').toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-pri)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {jugadorDrawer.nombre} {jugadorDrawer.apellidos}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-sec)' }}>CC {jugadorDrawer.cedula}</p>
              </div>
              <button onClick={() => setJugadorDrawer(null)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'var(--bg-surface)', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                <X size={18} />
              </button>
            </div>

            {/* % asistencia */}
            {!loadingHistorial && pctAsistencia !== null && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', borderBottom: '1px solid var(--cc20)', background: 'var(--bg-surface)' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', fontWeight: 800, color: pctAsistencia >= 75 ? '#22C55E' : pctAsistencia >= 50 ? '#F59E0B' : '#EF4444', lineHeight: 1 }}>{pctAsistencia}%</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-mut)', marginTop: '3px' }}>asistencia</p>
                </div>
                <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-sec)', lineHeight: 1.6 }}>
                  <p>{historialJugador.filter(h => h.estado === 'PRESENTE').length} presentes</p>
                  <p>{historialJugador.filter(h => h.estado === 'AUSENTE').length} ausentes</p>
                  <p>{historialJugador.filter(h => h.estado === 'JUSTIFICADO').length} justificados</p>
                </div>
              </div>
            )}

            {/* Lista de historial */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {loadingHistorial ? (
                <div style={S.centered}>
                  <Loader2 size={18} style={{ color }} className="animate-spin" />
                  <span style={{ fontSize: '13px', color: 'var(--text-sec)' }}>Cargando historial…</span>
                </div>
              ) : historialJugador.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-sec)' }}>Sin registros de asistencia aún</p>
                </div>
              ) : (
                <>
                  <p style={{ ...S.sectionLabel, marginBottom: '4px' }}>Últimos {historialJugador.length} entrenamientos</p>
                  {historialJugador.map((h, i) => {
                    const est = ESTADOS[h.estado] || ESTADOS.PENDIENTE;
                    const cal = h.calendario || {};
                    const fechaEv = cal.fecha_inicio ? localDateStr(new Date(cal.fecha_inicio)) : '';
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--cc20)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-pri)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cal.titulo || 'Entrenamiento'}
                          </p>
                          <p style={{ fontSize: '11px', color: 'var(--text-sec)', marginTop: '1px' }}>
                            {fechaEv ? formatFechaLarga(fechaEv) : ''}
                            {cal.equipo ? ` · ${cal.equipo}` : ''}
                          </p>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: est.color, background: est.bg, padding: '3px 8px', borderRadius: '99px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {est.label}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
          <style>{`@keyframes slide-in-right { from { transform: translateX(100%); opacity: 0.6; } to { transform: translateX(0); opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  );
}

// ── Estilos compartidos ────────────────────────────────────────────────────────

const S = {
  navBtn: {
    padding: '8px', borderRadius: '10px', border: '1px solid var(--cc20)',
    background: 'var(--bg-surface)', color: 'var(--text-sec)', cursor: 'pointer',
    display: 'flex', transition: 'opacity 0.15s',
  },
  centered: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    paddingTop: '60px', gap: '8px',
  },
  sectionLabel: {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-mut)',
    textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 2px',
  },
  menuItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', background: 'none', border: 'none',
    color: 'var(--text-pri)', cursor: 'pointer', fontSize: '13px',
    fontWeight: 500, textAlign: 'left',
  },
  dashedBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '12px', borderRadius: '12px', border: '1px dashed var(--cc20)',
    background: 'transparent', color: 'var(--text-sec)', cursor: 'pointer', fontSize: '13px',
  },
  chip: {
    padding: '6px 14px', borderRadius: '99px', border: '1px solid var(--cc20)',
    background: 'var(--bg-surface)', color: 'var(--text-sec)',
    cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.12s',
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
  },
  sheet: {
    background: 'var(--bg-card)', border: '1px solid var(--cc20)',
    borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '440px',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
  },
  sheetHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid var(--cc20)',
  },
  sheetTitle: { fontSize: '15px', fontWeight: 700, color: 'var(--text-pri)' },
  closeBtn: {
    padding: '6px', borderRadius: '8px', border: 'none',
    background: 'var(--bg-surface)', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex',
  },
  label: {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: 'var(--text-sec)', marginBottom: '6px',
  },
  primaryBtn: (color) => ({
    width: '100%', padding: '13px', borderRadius: '12px',
    background: color, color: '#fff', border: 'none',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    transition: 'opacity 0.15s',
  }),
};
