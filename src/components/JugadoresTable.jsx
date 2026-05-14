import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, BookOpen, PauseCircle, Check, DollarSign, Trash2, AlertTriangle, Shirt, Download, Upload, FileText, Users, Tag, X } from 'lucide-react';
import jsPDF from 'jspdf';
import { hexToRgb, loadLogoDataUrl, drawPdfHeader, drawPdfFooter, drawPdfTableHead } from '../lib/pdfHelpers';
import { ESTADO_COLORS } from '../config';
import HojaDeVida from './HojaDeVida';
import SuspensionModal from './SuspensionModal';
import ImportarJugadoresModal from './ImportarJugadoresModal';
import { deletePlayer } from '../services/api';
import { normalizarCategorias, listarEquipos } from '../lib/categorias';

/* ── colores de cada estado para el dropdown ── */
const ESTADO_DOT = {
  TODOS:    '#6A6A6A',
  AL_DIA:   '#22C55E',
  PENDIENTE:'#F59E0B',
  PARCIAL:  '#60A5FA',
  MORA:     '#EF4444',
};

/* ── dropdown para filtro de estado de pago ── */
function FiltroEstadoDropdown({ value, onChange, opciones }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'var(--bg-surface)', border: `1px solid ${value !== 'TODOS' ? 'rgba(225,73,36,0.5)' : 'var(--border-sub)'}`, minWidth: '140px' }}
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm text-[var(--text-pri)] hover:border-[#E14924]/50 transition"
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ESTADO_DOT[value] || '#6A6A6A' }} />
          {value === 'TODOS' ? 'Estado' : value}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-sec)] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-30 shadow-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)', minWidth: '160px' }}
        >
          {opciones.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-[var(--bg-card)] text-left"
              style={{ color: value === opt ? '#E14924' : '#F5F5F5' }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ESTADO_DOT[opt] || '#6A6A6A' }} />
              <span className="flex-1">{opt === 'TODOS' ? 'Todos los estados' : opt}</span>
              {value === opt && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── dropdown para filtro de categoría / equipo ── */
function FiltroCategoriaDropdown({ value, onChange, opciones }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activo = value !== 'TODOS';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: activo ? 'rgba(225,73,36,0.08)' : 'var(--bg-surface)',
          border: `1px solid ${activo ? 'rgba(225,73,36,0.5)' : 'var(--border-sub)'}`,
          minWidth: '140px',
        }}
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm text-[var(--text-pri)] hover:border-[#E14924]/50 transition"
      >
        <span className="flex items-center gap-2">
          <Tag className={`w-3.5 h-3.5 flex-shrink-0 ${activo ? 'text-[#E14924]' : 'text-[var(--text-mut)]'}`} />
          <span className={activo ? 'text-[#E14924] font-semibold' : ''}>
            {activo ? value : 'Categoría'}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-sec)] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-30 shadow-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)', minWidth: '180px', maxHeight: '280px', overflowY: 'auto' }}
        >
          {opciones.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-[var(--bg-card)] text-left"
              style={{ color: value === opt ? '#E14924' : '#F5F5F5' }}
            >
              <Tag className="w-3 h-3 flex-shrink-0 opacity-50" />
              <span className="flex-1">{opt === 'TODOS' ? 'Todos los grupos' : opt}</span>
              {value === opt && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── badge de estado en la tabla ── */
function EstadoBadge({ estado }) {
  const colors = ESTADO_COLORS[estado] || { bg: 'bg-white/5', text: 'text-[var(--text-sec)]', dot: 'bg-[var(--text-sec)]' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {estado}
    </span>
  );
}

/* ── componente principal ── */
export default function JugadoresTable({ jugadores, mensualidades, uniformes, torneos, registroPagos, suspensiones = [], morosos = [], onRefresh, categoriasJugadores = [], clubConfig, color }) {
  const [search, setSearch]               = useState('');
  const [filtroEstado, setFiltroEstado]   = useState('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [sortField, setSortField]         = useState('nombreCompleto');
  const [sortDir, setSortDir]             = useState('asc');
  const [jugadorDetalle, setJugadorDetalle]       = useState(null);
  const [jugadorDetalleTab, setJugadorDetalleTab] = useState('perfil');
  const [jugadorSuspension, setJugadorSuspension] = useState(null);
  const [jugadorAEliminar, setJugadorAEliminar]   = useState(null);
  const [eliminando, setEliminando]               = useState(false);
  const [showImportar, setShowImportar]           = useState(false);

  const abrirHoja = (j, tab = 'perfil') => { setJugadorDetalle(j); setJugadorDetalleTab(tab); };

  const confirmarEliminar = async () => {
    if (!jugadorAEliminar) return;
    setEliminando(true);
    try {
      await deletePlayer(jugadorAEliminar.cedula);
      setJugadorAEliminar(null);
      onRefresh();
    } catch (err) {
      alert('Error al eliminar jugador: ' + err.message);
    } finally {
      setEliminando(false);
    }
  };

  const tieneSuspensionActiva = (cedula) =>
    suspensiones.some(s => s.activa && s.cedula === String(cedula));

  const [uniformePopover, setUniformePopover] = useState(null);
  useEffect(() => {
    if (!uniformePopover) return;
    const close = () => setUniformePopover(null);
    document.addEventListener('click', close, true);
    return () => document.removeEventListener('click', close, true);
  }, [uniformePopover]);

  const uniformeData = (cedula) =>
    (uniformes || []).find(u => String(u.cedula) === String(cedula)) || null;

  const uniformeStatus = (cedula) => {
    const u = uniformeData(cedula);
    if (!u) return null;
    if (u.estado === 'AL_DIA')                              return 'entregado';
    if (u.estado === 'MORA')                                return 'mora';
    if (u.estado === 'PENDIENTE' || u.estado === 'PARCIAL') return 'pendiente';
    return 'pendiente';
  };

  const UNIFORME_STYLE = {
    pendiente: { color: '#F5A623', bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.30)', label: 'Pendiente de pago' },
    mora:      { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.30)',  label: 'En mora'           },
    entregado: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.30)',  label: 'Al día / Entregado' },
    none:      { color: 'var(--text-mut)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', label: 'Sin pedido' },
  };

  // Cédulas de jugadores morosos según el backend (fuente de verdad)
  const cedulasMorosos = useMemo(
    () => new Set((morosos || []).map(m => String(m.cedula))),
    [morosos]
  );

  // Peor estado local (para PENDIENTE / PARCIAL / AL_DIA)
  const PRIORIDAD = { MORA: 4, PENDIENTE: 3, PARCIAL: 2, AL_DIA: 1, SIN_DATOS: 0 };
  const peorEstado = (mensJugador) =>
    mensJugador.reduce((worst, m) => {
      return (PRIORIDAD[m.estado] || 0) > (PRIORIDAD[worst] || 0) ? m.estado : worst;
    }, 'SIN_DATOS');

  const jugadoresConPago = useMemo(() => {
    return jugadores.map(j => {
      const mensJugador    = mensualidades.filter(m => (m.cedula || m.jugador_id) == j.cedula);
      // Si el backend lo marca como moroso → MORA; si no, calculamos localmente
      const esMoroso       = cedulasMorosos.has(String(j.cedula));
      const estadoLocal    = peorEstado(mensJugador);
      const estadoPago     = esMoroso ? 'MORA' : estadoLocal;
      const saldoPendiente = mensJugador.reduce((s, m) => s + (parseFloat(m.saldo_pendiente) || 0), 0);
      const totalPagado    = mensJugador.reduce((s, m) => s + (parseFloat(m.valor_pagado)    || 0), 0);
      const nombre = `${j.nombre || j['nombre(s)'] || ''} ${j.apellidos || j['apellido(s)'] || ''}`.trim();
      return {
        ...j, nombreCompleto: nombre, estadoPago, saldoPendiente, totalPagado,
        activo: j.activo === true || (j.activo || '').toString().toUpperCase() === 'SI',
      };
    });
  }, [jugadores, mensualidades, cedulasMorosos]);

  const opcionesCategoria = useMemo(() => {
    const equipos = listarEquipos(categoriasJugadores);
    return ['TODOS', ...equipos];
  }, [categoriasJugadores]);

  const filtered = useMemo(() => {
    return jugadoresConPago
      .filter(j => {
        const matchSearch    = search === '' || j.nombreCompleto?.toLowerCase().includes(search.toLowerCase()) || j.cedula?.includes(search);
        const matchEstado    = filtroEstado === 'TODOS' || j.estadoPago === filtroEstado;
        const matchCategoria = filtroCategoria === 'TODOS'
          || j.categoria === filtroCategoria
          || j.equipo    === filtroCategoria
          || (Array.isArray(j.categorias) && j.categorias.some(
              c => c.categoria === filtroCategoria || c.equipo === filtroCategoria
            ));
        return matchSearch && matchEstado && matchCategoria;
      })
      .sort((a, b) => {
        const cmp = (a[sortField] || '').toString().localeCompare((b[sortField] || '').toString(), 'es', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [jugadoresConPago, search, filtroEstado, filtroCategoria, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />;
  };

  const formatCOP = (n) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const estados = ['TODOS', 'AL_DIA', 'PENDIENTE', 'PARCIAL', 'MORA'];

  const exportarCSV = () => {
    const headers = ['Nombre', 'Cédula', 'Celular', 'Estado', 'Categoría', 'Equipo', 'Pagado', 'Pendiente', 'Activo'];
    const rows = filtered.map(j => [
      j.nombreCompleto,
      j.cedula,
      j.celular || '',
      j.estadoPago,
      j.categoria || '',
      j.equipo || '',
      j.totalPagado,
      j.saldoPendiente,
      j.activo ? 'SI' : 'NO',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `jugadores_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297; const H = 210; const M = 12;
    const accentRgb = hexToRgb(color || clubConfig?.color);
    const clubName  = clubConfig?.nombre || 'Mi Club';
    const fecha     = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    const titulo    = filtroCategoria !== 'TODOS' ? `Jugadores — ${filtroCategoria}` : 'Listado de Jugadores';

    const logoData = await loadLogoDataUrl(clubConfig?.logo_url);

    const cols = [
      { label: 'Nombre',    x: M },
      { label: 'Cédula',    x: M + 62 },
      { label: 'Celular',   x: M + 96 },
      { label: 'Categoría', x: M + 128 },
      { label: 'Equipo',    x: M + 160 },
      { label: 'Estado',    x: M + 197 },
      { label: 'Pagado',    x: M + 227 },
    ];

    const drawPageHeader = () => {
      const y0 = drawPdfHeader(doc, { W, M, clubName, title: titulo, date: `${fecha} · ${filtered.length} jugadores`, logoData, accentRgb });
      return drawPdfTableHead(doc, { W, M, y: y0, columns: cols, accentRgb });
    };

    let y = drawPageHeader();

    filtered.forEach((j, i) => {
      if (y > H - 20) { doc.addPage(); y = drawPageHeader(); }
      if (i % 2 === 0) { doc.setFillColor(248, 249, 250); doc.rect(M - 2, y - 4, W - M * 2 + 4, 8, 'F'); }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(30, 40, 50);
      doc.text((j.nombreCompleto || '').slice(0, 28),  cols[0].x, y);
      doc.text(String(j.cedula || ''),                 cols[1].x, y);
      doc.text(String(j.celular || ''),                cols[2].x, y);
      doc.text((j.categoria || '—').slice(0, 14),      cols[3].x, y);
      doc.text((j.equipo || '—').slice(0, 16),         cols[4].x, y);
      const estadoColor = j.estadoPago === 'AL_DIA' ? [34, 197, 94] : j.estadoPago === 'MORA' ? [239, 68, 68] : [245, 166, 35];
      doc.setTextColor(...estadoColor);
      doc.setFont('helvetica', 'bold');
      doc.text(j.estadoPago === 'AL_DIA' ? 'Al día' : j.estadoPago === 'MORA' ? 'En mora' : 'Pendiente', cols[5].x, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 40, 50);
      doc.text(formatCOP(j.totalPagado), cols[6].x, y);
      y += 8;
    });

    if (!filtered.length) {
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('No hay jugadores en este listado.', M, y + 4);
    }

    const pages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      drawPdfFooter(doc, { W, H, M, clubName, pageNum: p, totalPages: pages, note: `${filtered.length} jugadores` });
    }

    const filtroLabel = filtroCategoria !== 'TODOS' ? `-${filtroCategoria.toLowerCase().replace(/\s+/g, '-')}` : '';
    doc.save(`jugadores${filtroLabel}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: '16px', overflow: 'hidden' }}>

        {/* HEADER */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-sub)' }}>
          <div className="flex flex-col gap-3">
            {/* Fila 1: título + acciones */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '22px', letterSpacing: '2px', color: 'var(--text-pri)' }}>
                Jugadores
              </h2>

              <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                {/* Buscador */}
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sec)]" />
                  <input
                    type="text"
                    placeholder="Buscar nombre o cédula..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)' }}
                    className="w-full sm:w-60 pl-10 pr-4 py-2 rounded-xl text-sm text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[#E14924]/50 transition"
                  />
                </div>

                {/* Filtro de estado */}
                <FiltroEstadoDropdown value={filtroEstado} onChange={setFiltroEstado} opciones={estados} />

                {/* Filtro de categoría / equipo */}
                {opcionesCategoria.length > 1 && (
                  <FiltroCategoriaDropdown value={filtroCategoria} onChange={setFiltroCategoria} opciones={opcionesCategoria} />
                )}

                {/* Exportar CSV */}
                <button
                  onClick={exportarCSV}
                  title={`Exportar ${filtered.length} jugadores a CSV`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.08)'}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV</span>
                </button>

                {/* Exportar PDF */}
                <button
                  onClick={exportarPDF}
                  title={`Exportar ${filtered.length} jugadores a PDF`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
                  style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', color: '#A855F7', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,85,247,0.08)'}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </button>

                {/* Importar Excel */}
                <button
                  onClick={() => setShowImportar(true)}
                  title="Importar jugadores desde Excel"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
                  style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)', color: '#60A5FA', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(96,165,250,0.08)'}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Importar</span>
                </button>
              </div>
            </div>

            {/* Fila 2: chips de filtros activos */}
            {(filtroEstado !== 'TODOS' || filtroCategoria !== 'TODOS' || search) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[var(--text-mut)]">Filtros activos:</span>
                {filtroCategoria !== 'TODOS' && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition hover:opacity-80"
                    style={{ background: 'rgba(225,73,36,0.12)', border: '1px solid rgba(225,73,36,0.35)', color: '#E14924' }}
                    onClick={() => setFiltroCategoria('TODOS')}
                  >
                    <Tag className="w-3 h-3" />
                    {filtroCategoria}
                    <X className="w-3 h-3" />
                  </span>
                )}
                {filtroEstado !== 'TODOS' && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition hover:opacity-80"
                    style={{ background: `${ESTADO_DOT[filtroEstado]}20`, border: `1px solid ${ESTADO_DOT[filtroEstado]}50`, color: ESTADO_DOT[filtroEstado] }}
                    onClick={() => setFiltroEstado('TODOS')}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: ESTADO_DOT[filtroEstado] }} />
                    {filtroEstado}
                    <X className="w-3 h-3" />
                  </span>
                )}
                {search && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition hover:opacity-80"
                    style={{ background: 'rgba(96,165,250,0.10)', border: '1px solid rgba(96,165,250,0.30)', color: '#60A5FA' }}
                    onClick={() => setSearch('')}
                  >
                    <Search className="w-3 h-3" />
                    "{search}"
                    <X className="w-3 h-3" />
                  </span>
                )}
                <span className="text-xs text-[var(--text-mut)]">— {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-sub)' }}>
                {[
                  { key: 'nombreCompleto', label: 'Nombre'   },
                  { key: 'uniforme',       label: ''         },
                  { key: 'cedula',         label: 'Cédula'   },
                  { key: 'celular',        label: 'Celular'  },
                  { key: 'estadoPago',     label: 'Estado'   },
                  { key: 'totalPagado',    label: 'Pagado'   },
                  { key: 'saldoPendiente', label: 'Pendiente'},
                  { key: 'acciones',       label: ''         },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => !['acciones','uniforme'].includes(col.key) && toggleSort(col.key)}
                    className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer transition"
                    style={{ color: sortField === col.key ? '#E14924' : '#6A6A6A' }}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {!['acciones','uniforme'].includes(col.key) && <SortIcon field={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((j, i) => (
                <tr
                  key={j.cedula || i}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  className="hover:bg-white/[0.03] transition-colors"
                >
                  {/* Nombre — con botón Ver a la izquierda */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Botón Ver (abre Hoja de Vida en Perfil) */}
                      <button
                        onClick={() => abrirHoja(j, 'perfil')}
                        title="Hoja de vida"
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition"
                        style={{ background: 'rgba(225,73,36,0.10)', border: '1px solid rgba(225,73,36,0.25)', color: '#E14924' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(225,73,36,0.22)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(225,73,36,0.10)'}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[var(--text-pri)] text-sm">{j.nombreCompleto}</span>
                          {tieneSuspensionActiva(j.cedula) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                              <PauseCircle className="w-3 h-3" /> Suspendido
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-mut)' }}>
                          {j.activo ? '🟢 Activo' : '🔴 Inactivo'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Foto + Uniforme */}
                  <td className="px-3 py-4">
                    {(() => {
                      const status = uniformeStatus(j.cedula);
                      const st = UNIFORME_STYLE[status || 'none'];
                      const open = uniformePopover === j.cedula;
                      const initials = j.nombreCompleto
                        ? j.nombreCompleto.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                        : '?';
                      return (
                        <div className="flex items-center gap-2">
                          {/* Avatar foto */}
                          <button
                            onClick={() => abrirHoja(j, 'perfil')}
                            title="Ver hoja de vida"
                            className="flex-shrink-0 w-11 h-11 rounded-full overflow-hidden transition ring-2 ring-transparent hover:ring-[var(--cc)] hover:ring-offset-1 hover:ring-offset-[var(--bg-card)]"
                            style={{ background: 'var(--bg-surface)' }}
                          >
                            {j.foto_url
                              ? <img src={j.foto_url} alt={j.nombreCompleto} className="w-full h-full object-cover" />
                              : <span className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: 'var(--text-sec)' }}>{initials}</span>
                            }
                          </button>

                          {/* Icono uniforme */}
                          <div className="relative">
                            <button
                              onClick={() => setUniformePopover(open ? null : j.cedula)}
                              className="p-1.5 rounded-lg transition"
                              style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
                            >
                              <Shirt className="w-4 h-4" />
                            </button>
                            {open && (
                              <div
                                className="absolute z-30 left-0 top-8 min-w-[160px] rounded-xl shadow-xl p-3 text-sm"
                                style={{ background: 'var(--bg-card)', border: `1px solid ${st.border}` }}
                              >
                                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-sec)' }}>Uniforme</p>
                                <span
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold"
                                  style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
                                >
                                  <Shirt className="w-3 h-3" />
                                  {st.label}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Cédula */}
                  <td className="px-6 py-4 text-sm font-mono" style={{ color: 'var(--text-mut)' }}>
                    {j.cedula}
                  </td>

                  {/* Celular */}
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-mut)' }}>
                    {j.celular}
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4">
                    <EstadoBadge estado={j.estadoPago} />
                  </td>

                  {/* Pagado */}
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#22C55E' }}>
                    {formatCOP(j.totalPagado)}
                  </td>

                  {/* Pendiente */}
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: j.saldoPendiente > 0 ? '#F59E0B' : '#4A4A4A' }}>
                    {formatCOP(j.saldoPendiente)}
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {/* Financiero */}
                      <button
                        onClick={() => abrirHoja(j, 'financiero')}
                        title="Estado financiero"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                        style={{ background: 'rgba(182,134,49,0.08)', border: '1px solid rgba(182,134,49,0.25)', color: '#B68631' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(182,134,49,0.18)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(182,134,49,0.08)'}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Finanzas</span>
                      </button>

                      {/* Suspensión */}
                      <button
                        onClick={() => setJugadorSuspension(j)}
                        title="Gestionar suspensión"
                        className={`p-1.5 rounded-lg transition ${
                          tieneSuspensionActiva(j.cedula)
                            ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                            : 'text-[var(--text-mut)] hover:text-yellow-400 hover:bg-yellow-400/10'
                        }`}
                      >
                        <PauseCircle className="w-4 h-4" />
                      </button>

                      {/* Eliminar */}
                      <button
                        onClick={() => setJugadorAEliminar(j)}
                        title="Eliminar jugador"
                        className="p-1.5 rounded-lg transition text-[var(--text-mut)] hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-14 px-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ background: 'rgba(225,73,36,0.08)', border: '1px solid rgba(225,73,36,0.15)' }}>
                <Users className="w-5 h-5 text-[var(--text-mut)]" />
              </div>
              <p className="text-[var(--text-sec)] text-sm font-medium mb-1">
                {filtroCategoria !== 'TODOS'
                  ? `No hay jugadores en "${filtroCategoria}"`
                  : filtroEstado !== 'TODOS'
                  ? `No hay jugadores con estado ${filtroEstado}`
                  : search
                  ? `No se encontró "${search}"`
                  : 'No hay jugadores registrados'}
              </p>
              {(filtroCategoria !== 'TODOS' || filtroEstado !== 'TODOS' || search) && (
                <button
                  onClick={() => { setFiltroCategoria('TODOS'); setFiltroEstado('TODOS'); setSearch(''); }}
                  className="mt-3 text-xs text-[#E14924] hover:underline"
                >
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-sub)', color: 'var(--text-mut)', fontSize: '13px' }} className="flex items-center justify-between flex-wrap gap-2">
          <span>
            {filtered.length !== jugadores.length
              ? <><strong style={{ color: 'var(--text-sec)' }}>{filtered.length}</strong> de {jugadores.length} jugadores</>
              : <>{jugadores.length} jugadores</>}
          </span>
          {filtroCategoria !== 'TODOS' && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: '#E14924' }}>
              <Tag className="w-3 h-3" />
              Listado: {filtroCategoria} · CSV y PDF exportan este grupo
            </span>
          )}
        </div>
      </div>

      {/* MODAL IMPORTAR EXCEL */}
      {showImportar && (
        <ImportarJugadoresModal
          onClose={() => setShowImportar(false)}
          onSuccess={() => { setShowImportar(false); onRefresh(); }}
        />
      )}

      {/* DRAWER HOJA DE VIDA */}
      {jugadorDetalle && (
        <HojaDeVida
          jugador={jugadorDetalle}
          mensualidades={mensualidades}
          torneos={torneos || []}
          suspensiones={suspensiones}
          initialTab={jugadorDetalleTab}
          visibleTabs={jugadorDetalleTab === 'financiero' ? ['financiero'] : ['perfil', 'carnet']}
          onClose={() => setJugadorDetalle(null)}
          onRefresh={onRefresh}
          categoriasJugadores={categoriasJugadores}
          clubConfig={clubConfig}
        />
      )}

      {/* MODAL SUSPENSIÓN */}
      {jugadorSuspension && (
        <SuspensionModal
          jugador={jugadorSuspension}
          onClose={() => setJugadorSuspension(null)}
          onSuccess={onRefresh}
        />
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {jugadorAEliminar && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => !eliminando && setJugadorAEliminar(null)}
        >
          <div
            style={{ background: 'var(--bg-surface)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '28px 32px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '20px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icono + título */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={20} color="#EF4444" />
              </div>
              <div>
                <div style={{ color: 'var(--text-pri)', fontWeight: 600, fontSize: '15px' }}>¿Eliminar jugador?</div>
                <div style={{ color: 'var(--text-mut)', fontSize: '12px', marginTop: '2px' }}>Esta acción no se puede deshacer</div>
              </div>
            </div>

            {/* Datos del jugador */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ color: 'var(--text-pri)', fontWeight: 600, fontSize: '14px' }}>{jugadorAEliminar.nombreCompleto}</div>
              <div style={{ color: 'var(--text-mut)', fontSize: '12px', fontFamily: 'monospace' }}>CC {jugadorAEliminar.cedula}</div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setJugadorAEliminar(null)}
                disabled={eliminando}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border-sub)', background: 'var(--bg-card)', color: 'var(--text-mut)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: '13px', fontWeight: 600, cursor: eliminando ? 'not-allowed' : 'pointer', opacity: eliminando ? 0.6 : 1 }}
              >
                {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
