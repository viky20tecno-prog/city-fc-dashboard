import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, BookOpen, Check, DollarSign, Trash2, AlertTriangle, Shirt, Download, Upload, FileText, Users, Tag, X, UserX, Loader2, Archive, RotateCcw, ClipboardList } from 'lucide-react';
import { hexToRgb, loadLogoDataUrl, drawPdfHeader, drawPdfFooter, drawPdfTableHead } from '../lib/pdfHelpers';
import { ESTADO_COLORS, API_BASE_URL } from '../config';
import HojaDeVida from './HojaDeVida';
import ImportarJugadoresModal from './ImportarJugadoresModal';
import MensualidadesImportModal from './MensualidadesImportModal';
import { deletePlayer, archivePlayer, getClubId } from '../services/api';
import { authFetch } from '../lib/authFetch';
import { listarEquipos } from '../lib/categorias';

// Peor estado local (para PENDIENTE / PARCIAL / AL_DIA)
const PRIORIDAD = { MORA: 4, PENDIENTE: 3, PARCIAL: 2, AL_DIA: 1, NO_APLICA: 0, SIN_DATOS: 0 };
const peorEstado = (mensJugador) =>
  mensJugador.reduce((worst, m) => {
    return (PRIORIDAD[m.estado] || 0) > (PRIORIDAD[worst] || 0) ? m.estado : worst;
  }, 'SIN_DATOS');

/* ── colores de cada estado para el dropdown ── */
const ESTADO_DOT = {
  TODOS:      '#6A6A6A',
  AL_DIA:     '#22C55E',
  PENDIENTE:  '#F59E0B',
  PARCIAL:    '#60A5FA',
  MORA:       '#EF4444',
  EXENTO:     '#38bdf8',
  NO_APLICA:  '#94A3B8',
  CON_DEUDA:  '#F59E0B',
  ENTREGADO:  '#22C55E',
  SIN_PEDIDO: '#6A6A6A',
};

/* ── dropdown para filtro de estado de pago (reusado también para uniforme) ── */
function FiltroEstadoDropdown({ value, onChange, opciones, placeholder = 'Estado', todosLabel = 'Todos los estados', labels = {} }) {
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
        style={{ background: 'var(--bg-surface)', border: `1px solid ${value !== 'TODOS' ? 'var(--cc50)' : 'var(--border-sub)'}`, minWidth: '140px' }}
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm text-[var(--text-pri)] hover:border-[var(--cc)]/50 transition"
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ESTADO_DOT[value] || '#6A6A6A' }} />
          {value === 'TODOS' ? placeholder : (labels[value] || value)}
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
              style={{ color: value === opt ? 'var(--cc)' : 'var(--text-pri)' }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ESTADO_DOT[opt] || '#6A6A6A' }} />
              <span className="flex-1">{opt === 'TODOS' ? todosLabel : (labels[opt] || opt)}</span>
              {value === opt && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const SIN_EQUIPO = 'SIN_EQUIPO';

/* ── resumen de equipos con conteos ── */
function ResumenEquipos({ jugadores, categoriasJugadores, filtroActivo, onSelect }) {
  const equipos = useMemo(() => listarEquipos(categoriasJugadores), [categoriasJugadores]);

  const conteos = useMemo(() => {
    const map = {};
    equipos.forEach(e => { map[e] = 0; });
    jugadores.forEach(j => {
      if (j.equipo && map[j.equipo] !== undefined) map[j.equipo]++;
      else if (j.categoria && map[j.categoria] !== undefined && !j.equipo) map[j.categoria]++;
    });
    return map;
  }, [jugadores, equipos]);

  const sinEquipo = useMemo(
    () => jugadores.filter(j => !j.equipo && !j.categoria).length,
    [jugadores]
  );

  if (!equipos.length) return null;

  return (
    <div className="flex flex-wrap gap-2 px-6 py-3" style={{ borderBottom: '1px solid var(--border-sub)' }}>
      {equipos.map(eq => {
        const activo = filtroActivo === eq;
        return (
          <button
            key={eq}
            onClick={() => onSelect(activo ? 'TODOS' : eq)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: activo ? 'var(--cc12)' : 'var(--bg-surface)',
              border: `1px solid ${activo ? 'var(--cc50)' : 'var(--border-sub)'}`,
              color: activo ? 'var(--cc)' : 'var(--text-sec)',
            }}
          >
            <Users className="w-3 h-3" />
            <span>{eq}</span>
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: activo ? 'var(--cc30)' : 'rgba(255,255,255,0.08)', color: activo ? 'var(--cc)' : 'var(--text-mut)' }}
            >
              {conteos[eq] ?? 0}
            </span>
          </button>
        );
      })}
      {sinEquipo > 0 && (
        <button
          onClick={() => onSelect(filtroActivo === SIN_EQUIPO ? 'TODOS' : SIN_EQUIPO)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: filtroActivo === SIN_EQUIPO ? 'rgba(245,158,11,0.12)' : 'var(--bg-surface)',
            border: `1px solid ${filtroActivo === SIN_EQUIPO ? 'rgba(245,158,11,0.5)' : 'var(--border-sub)'}`,
            color: filtroActivo === SIN_EQUIPO ? '#F59E0B' : 'var(--text-sec)',
          }}
        >
          <UserX className="w-3 h-3" />
          <span>Sin equipo</span>
          <span
            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: filtroActivo === SIN_EQUIPO ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)', color: filtroActivo === SIN_EQUIPO ? '#F59E0B' : 'var(--text-mut)' }}
          >
            {sinEquipo}
          </span>
        </button>
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
          background: activo ? 'var(--cc12)' : 'var(--bg-surface)',
          border: `1px solid ${activo ? 'var(--cc50)' : 'var(--border-sub)'}`,
          minWidth: '140px',
        }}
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm text-[var(--text-pri)] hover:border-[var(--cc)]/50 transition"
      >
        <span className="flex items-center gap-2">
          <Tag className={`w-3.5 h-3.5 flex-shrink-0 ${activo ? 'text-[var(--cc)]' : 'text-[var(--text-mut)]'}`} />
          <span className={activo ? 'text-[var(--cc)] font-semibold' : ''}>
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
              style={{ color: value === opt ? (opt === SIN_EQUIPO ? '#F59E0B' : 'var(--cc)') : 'var(--text-pri)' }}
            >
              {opt === SIN_EQUIPO
                ? <UserX className="w-3 h-3 flex-shrink-0 opacity-70" />
                : <Tag className="w-3 h-3 flex-shrink-0 opacity-50" />}
              <span className="flex-1">
                {opt === 'TODOS' ? 'Todos los grupos' : opt === SIN_EQUIPO ? 'Sin equipo' : opt}
              </span>
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
export default function JugadoresTable({ jugadores, mensualidades, uniformes, torneos, suspensiones = [], morosos = [], onRefresh, categoriasJugadores = [], clubConfig, color }) {
  const [search, setSearch]               = useState('');
  const [filtroEstado, setFiltroEstado]   = useState('TODOS');
  const [filtroDeporte, setFiltroDeporte] = useState('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [filtroUniforme, setFiltroUniforme] = useState('TODOS'); // TODOS | CON_DEUDA | ENTREGADO | SIN_PEDIDO
  const [sortField, setSortField]         = useState('nombreCompleto');
  const [sortDir, setSortDir]             = useState('asc');
  const [jugadorDetalle, setJugadorDetalle]       = useState(null);
  const [jugadorDetalleTab, setJugadorDetalleTab] = useState('perfil');
  const [jugadorAEliminar, setJugadorAEliminar]   = useState(null);
  const [eliminando, setEliminando]               = useState(false);
  const [jugadorAArchivar, setJugadorAArchivar]   = useState(null);
  const [archivando, setArchivando]               = useState(false);
  const [verArchivados, setVerArchivados]         = useState(false);
  const [showImportar, setShowImportar]           = useState(false);
  const [showImportarMensualidades, setShowImportarMensualidades] = useState(false);

  const [asistenciaStats, setAsistenciaStats] = useState({});

  useEffect(() => {
    const clubId = getClubId();
    authFetch(`${API_BASE_URL}/asistencia/stats?club_id=${clubId}`)
      .then(r => r.json())
      .then(d => {
        const map = {};
        (d.data || []).forEach(s => { map[s.cedula] = s; });
        setAsistenciaStats(map);
      })
      .catch(() => {});
  }, []);

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

  const confirmarArchivar = async (activo) => {
    if (!jugadorAArchivar) return;
    setArchivando(true);
    try {
      await archivePlayer(jugadorAArchivar.cedula, activo);
      setJugadorAArchivar(null);
      onRefresh();
    } catch (err) {
      alert('Error al archivar jugador: ' + err.message);
    } finally {
      setArchivando(false);
    }
  };

  const [uniformePopover, setUniformePopover] = useState(null);
  useEffect(() => {
    if (!uniformePopover) return;
    const close = () => setUniformePopover(null);
    document.addEventListener('click', close, true);
    return () => document.removeEventListener('click', close, true);
  }, [uniformePopover]);

  const uniformeData = (cedula) => {
    const pedidos = (uniformes || []).filter(u => String(u.cedula) === String(cedula));
    if (!pedidos.length) return null;
    // Retornar el peor estado: PENDIENTE/ABONO > PAGADO > ENTREGADO
    if (pedidos.some(u => u.estado === 'PENDIENTE' || u.estado === 'MORA' || u.estado === 'PARCIAL' || u.estado === 'ABONO'))
      return pedidos.find(u => u.estado === 'PENDIENTE' || u.estado === 'MORA' || u.estado === 'PARCIAL' || u.estado === 'ABONO');
    if (pedidos.some(u => u.estado === 'PAGADO'))
      return pedidos.find(u => u.estado === 'PAGADO');
    return pedidos[0];
  };

  const uniformeStatus = (cedula) => {
    const u = uniformeData(cedula);
    if (!u) return null;
    if (u.estado === 'ENTREGADO' || u.estado === 'AL_DIA')  return 'entregado';
    if (u.estado === 'MORA')                                return 'mora';
    if (u.estado === 'PAGADO')                              return 'entregado';
    if (u.estado === 'ABONO' || u.estado === 'PARCIAL')     return 'abono';
    return 'pendiente';
  };

  const UNIFORME_STYLE = {
    pendiente: { color: '#F5A623', bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.30)', label: 'Pendiente de pago' },
    abono:     { color: '#4A9EFF', bg: 'rgba(74,158,255,0.12)', border: 'rgba(74,158,255,0.30)', label: 'Abono parcial'     },
    mora:      { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.30)',  label: 'En mora'           },
    entregado: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.30)',  label: 'Al día / Entregado' },
    none:      { color: 'var(--text-mut)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', label: 'Sin pedido' },
  };

  // Cédulas de jugadores morosos según el backend (fuente de verdad)
  const cedulasMorosos = useMemo(
    () => new Set((morosos || []).map(m => String(m.cedula))),
    [morosos]
  );

  const mesActualTabla  = new Date().getMonth() + 1;
  const anioActualTabla = new Date().getFullYear();

  const jugadoresConPago = useMemo(() => {
    // Suspensión ACTIVA por cédula → Set de meses cubiertos (criterio unificado: si se
    // cancela la suspensión, la deuda de esos meses vuelve a contar de inmediato).
    const suspIdxTabla = {};
    (suspensiones || []).forEach(s => {
      if (!s.activa || parseInt(s.anio) !== anioActualTabla) return;
      const ced = String(s.cedula);
      if (!suspIdxTabla[ced]) suspIdxTabla[ced] = new Set();
      for (let m = s.mes_inicio; m <= s.mes_fin; m++) suspIdxTabla[ced].add(m);
    });

    return jugadores.map(j => {
      const mensJugador = mensualidades.filter(m => (m.cedula || m.player_id) == j.cedula);

      // Solo meses hasta el mes actual del año vigente para estado y saldo.
      // Los meses futuros (no cobrados aún) no deben afectar el semáforo ni el saldo.
      const mensHastaHoy = mensJugador.filter(m => {
        const anioM = parseInt(m.anio) || anioActualTabla;
        const mesM  = parseInt(m.numero_mes);
        return anioM < anioActualTabla || (anioM === anioActualTabla && mesM <= mesActualTabla);
      });

      // Meses con suspensión activa no cuentan para el estado ni el saldo pendiente —
      // pero sí siguen sumando en totalPagado (lo que ya se pagó, se pagó).
      const suspMeses     = suspIdxTabla[String(j.cedula)];
      const mensParaDeuda = suspMeses ? mensHastaHoy.filter(m => !suspMeses.has(parseInt(m.numero_mes))) : mensHastaHoy;

      // Si el backend lo marca como moroso → MORA; si no, calculamos localmente
      const esMoroso       = cedulasMorosos.has(String(j.cedula));
      const estadoLocal    = peorEstado(mensParaDeuda);
      const estadoPago     = esMoroso ? 'MORA' : estadoLocal;
      const saldoPendiente = mensParaDeuda.reduce((s, m) => s + (parseFloat(m.saldo_pendiente) || 0), 0);
      const totalPagado    = mensHastaHoy.reduce((s, m) => s + (parseFloat(m.valor_pagado)    || 0), 0);
      const nombre = `${j.nombre || j['nombre(s)'] || ''} ${j.apellidos || j['apellido(s)'] || ''}`.trim().toUpperCase();
      return {
        ...j, nombreCompleto: nombre, estadoPago, saldoPendiente, totalPagado,
        activo: j.activo === true || (j.activo || '').toString().toUpperCase() === 'SI',
      };
    });
  }, [jugadores, mensualidades, cedulasMorosos, suspensiones, anioActualTabla, mesActualTabla]);

  const opcionesCategoria = useMemo(() => {
    const equipos = listarEquipos(categoriasJugadores);
    return ['TODOS', ...equipos, SIN_EQUIPO];
  }, [categoriasJugadores]);

  const opcionesDeporte = useMemo(() => {
    const set = new Set(jugadores.map(j => j.deporte).filter(Boolean));
    return set.size > 1 ? ['TODOS', ...Array.from(set)] : [];
  }, [jugadores]);

  const filtered = useMemo(() => {
    return jugadoresConPago
      .filter(j => {
        if (verArchivados ? j.activo : !j.activo) return false;
        const matchSearch    = search === '' || j.nombreCompleto?.toLowerCase().includes(search.toLowerCase()) || j.cedula?.includes(search);
        const matchEstado    = filtroEstado === 'TODOS'
          || (filtroEstado === 'EXENTO' ? Number(j.descuento_pct) >= 100 : j.estadoPago === filtroEstado);
        const matchCategoria = filtroCategoria === 'TODOS'
          || (filtroCategoria === SIN_EQUIPO && !j.equipo && !j.categoria)
          || j.categoria === filtroCategoria
          || j.equipo    === filtroCategoria
          || (Array.isArray(j.categorias) && j.categorias.some(
              c => c.categoria === filtroCategoria || c.equipo === filtroCategoria
            ));
        const matchDeporte = filtroDeporte === 'TODOS' || j.deporte === filtroDeporte;
        const matchUniforme = filtroUniforme === 'TODOS' || (() => {
          const pedidos = (uniformes || []).filter(u => String(u.cedula) === String(j.cedula));
          if (filtroUniforme === 'SIN_PEDIDO') return pedidos.length === 0;
          const conDeuda = pedidos.some(u => u.estado === 'PENDIENTE' || u.estado === 'MORA' || u.estado === 'PARCIAL' || u.estado === 'ABONO');
          if (filtroUniforme === 'CON_DEUDA') return conDeuda;
          if (filtroUniforme === 'ENTREGADO') return pedidos.length > 0 && !conDeuda;
          return true;
        })();
        return matchSearch && matchEstado && matchCategoria && matchDeporte && matchUniforme;
      })
      .sort((a, b) => {
        const cmp = (a[sortField] || '').toString().localeCompare((b[sortField] || '').toString(), 'es', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [jugadoresConPago, search, filtroEstado, filtroDeporte, filtroCategoria, filtroUniforme, uniformes, sortField, sortDir, verArchivados]);

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

  const estados = ['TODOS', 'AL_DIA', 'PENDIENTE', 'PARCIAL', 'MORA', 'EXENTO'];

  const exportarCSV = async () => {
    const ExcelJS = (await import('exceljs')).default ?? (await import('exceljs'));
    const fecha   = new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' });

    // Campos a auditar: [header, getter, requerido]
    const CAMPOS = [
      { h: 'NOMBRE',          get: j => j.nombreCompleto || '',                          req: true  },
      { h: 'CÉDULA',          get: j => String(j.cedula || ''),                          req: true  },
      { h: 'CELULAR',         get: j => String(j.celular || ''),                         req: true  },
      { h: 'CORREO',          get: j => j.correo_electronico || '',                      req: false },
      { h: 'INSTAGRAM',       get: j => j.instagram || '',                               req: false },
      { h: 'FECHA NAC.',      get: j => j.fecha_nacimiento || '',                        req: false },
      { h: 'LUGAR NAC.',      get: j => (j.lugar_de_nacimiento || '').toUpperCase(),     req: false },
      { h: 'TIPO SANGRE',     get: j => (j.tipo_sangre || '').toUpperCase(),             req: false },
      { h: 'EPS',             get: j => (j.eps || '').toUpperCase(),                     req: false },
      { h: 'ESTATURA',        get: j => String(j.estatura || ''),                        req: false },
      { h: 'PESO',            get: j => String(j.peso || ''),                            req: false },
      { h: 'MUNICIPIO',       get: j => (j.municipio || '').toUpperCase(),               req: false },
      { h: 'BARRIO',          get: j => (j.barrio || '').toUpperCase(),                  req: false },
      { h: 'DIRECCIÓN',       get: j => (j.direccion || '').toUpperCase(),               req: false },
      { h: 'CONTACTO EMERG.', get: j => (j.familiar_emergencia || '').toUpperCase(),     req: false },
      { h: 'CEL. CONTACTO',   get: j => String(j.celular_contacto || ''),               req: false },
      { h: 'OBSERVACIONES',   get: j => j.notas || '',                                   req: false },
      { h: 'CATEGORÍA',       get: j => (j.categoria || '').toUpperCase(),               req: true  },
      { h: 'EQUIPO',          get: j => (j.equipo || '').toUpperCase(),                  req: false },
      { h: 'POSICIÓN',        get: j => (j.posicion || '').toUpperCase(),                req: false },
      { h: 'N° CAMISETA',     get: j => String(j.numero_camiseta || ''),                req: false },
      { h: 'ESTADO',          get: j => j.activo ? 'ACTIVO' : 'INACTIVO',               req: true  },
    ];

    const esPend    = (j) => String(j.cedula).startsWith('PEND_');
    const esFaltante = (val) => val === '' || val === null || val === undefined;

    const todos = [...filtered]
      .sort((a, b) => {
        if (a.activo !== b.activo) return a.activo ? -1 : 1;
        return (a.nombreCompleto || '').localeCompare(b.nombreCompleto || '', 'es');
      });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ZenSports';
    const ws = wb.addWorksheet('DIRECTORIO', { views: [{ state: 'frozen', ySplit: 2 }] });

    const COL_WIDTH = {
      'NOMBRE': 30, 'CORREO': 26, 'INSTAGRAM': 20, 'DIRECCIÓN': 30,
      'OBSERVACIONES': 38, 'CONTACTO EMERG.': 24, 'CEL. CONTACTO': 18,
      'MUNICIPIO': 16, 'BARRIO': 14, 'CÉDULA': 14, 'CELULAR': 16,
    };
    ws.columns = [
      { width: 5 },  // #
      ...CAMPOS.map(c => ({ width: COL_WIDTH[c.h] ?? 14 })),
    ];

    // Título
    const titleRow = ws.addRow([`DIRECTORIO DE JUGADORES  ·  ${fecha.toUpperCase()}  ·  ${(clubConfig?.nombre || '').toUpperCase()}`]);
    ws.mergeCells(1, 1, 1, 1 + CAMPOS.length);
    titleRow.getCell(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleRow.getCell(1).font      = { bold: true, color: { argb: 'FFFBBF24' }, size: 11, name: 'Calibri' };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 24;

    // Encabezado
    const hRow = ws.addRow(['#', ...CAMPOS.map(c => c.h)]);
    hRow.eachCell((cell, col) => {
      const esReq = col > 1 && CAMPOS[col - 2]?.req;
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: col === 1 ? 'FF0F172A' : esReq ? 'FF1E293B' : 'FF334155' } };
      cell.font      = { bold: true, color: { argb: esReq ? 'FFFBBF24' : 'FFD1D5DB' }, size: 10, name: 'Calibri' };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border    = { bottom: { style: 'medium', color: { argb: 'FFFBBF24' } } };
    });
    hRow.height = 22;
    ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 1 + CAMPOS.length } };

    // Filas de datos
    todos.forEach((j, idx) => {
      const isPend     = esPend(j);
      const esInactivo = !j.activo;
      const zebra      = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';

      const valores = CAMPOS.map(c => c.get(j));
      const dataRow = ws.addRow([idx + 1, ...valores]);

      dataRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        const campoIdx = colNum - 2;           // 0-based index into CAMPOS
        const val      = colNum > 1 ? valores[campoIdx] : null;
        const faltante = colNum > 1 && esFaltante(val);

        if (isPend) {
          // Fila PEND_: toda naranja — datos inexistentes
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
          cell.font = { size: 10, name: 'Calibri', bold: true, italic: true, color: { argb: 'FF92400E' } };
          if (colNum === 1) cell.border = { left: { style: 'medium', color: { argb: 'FFF97316' } } };
        } else if (faltante) {
          // Campo faltante: amarillo suave
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
          cell.font = { size: 10, name: 'Calibri', italic: true, color: { argb: 'FF92400E' } };
        } else if (esInactivo) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
          cell.font = { size: 10, name: 'Calibri', italic: true, color: { argb: 'FF9CA3AF' } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colNum === 1 ? 'FFF1F5F9' : zebra } };
          cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF1E293B' },
            bold: colNum === 1 + CAMPOS.length && j.activo };  // ESTADO en negrita si activo
        }

        // Color especial para celda ESTADO
        if (!isPend && colNum === 1 + CAMPOS.length) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: j.activo ? 'FFD1FAE5' : 'FFF3F4F6' } };
          cell.font = { size: 10, name: 'Calibri', bold: true, color: { argb: j.activo ? 'FF166534' : 'FF9CA3AF' } };
        }

        cell.alignment = { horizontal: colNum <= 2 ? 'center' : 'left', vertical: 'middle' };
      });
      dataRow.height = 18;
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    const clubSlug = (clubConfig?.nombre || 'club').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    a.download   = `jugadores_${clubSlug}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarEstadoActual = async () => {
    const ExcelJS = (await import('exceljs')).default ?? (await import('exceljs'));
    const MESES   = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                     'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const anio    = new Date().getFullYear();
    const fecha   = new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' });

    // Paleta de estados
    const ESTADO_STYLE = {
      EXENTO:     { bg: 'FF1D4ED8', fg: 'FFFFFFFF', bold: true  },  // azul intenso / blanco
      AL_DIA:     { bg: 'FFD1FAE5', fg: 'FF166534', bold: false },  // verde
      MORA:       { bg: 'FFFEE2E2', fg: 'FFB91C1C', bold: true  },  // rojo / negrita
      'NO APLICA': { bg: 'FFFED7AA', fg: 'FF9A3412', bold: false },  // naranja — mes suspendido, no aplica cobro
      PENDIENTE:  { bg: 'FFF3F4F6', fg: 'FF6B7280', bold: false },  // gris suave
      PARCIAL:    { bg: 'FFDBEAFE', fg: 'FF1E40AF', bold: false },  // azul claro
    };

    // Cédulas pendientes de registro
    const esCedulaPend = (ced) => String(ced).startsWith('PEND_');

    // Índice mensualidades: cédula → { [numero_mes]: estado }
    const mensIdx = {};
    (mensualidades || [])
      .filter(m => parseInt(m.anio) === anio)
      .forEach(m => {
        const ced = String(m.cedula || m.player_id || '');
        if (!mensIdx[ced]) mensIdx[ced] = {};
        mensIdx[ced][parseInt(m.numero_mes)] = m.estado;
      });

    // Índice suspensiones activas: cédula → Set<numero_mes>
    const suspIdx = {};
    (suspensiones || [])
      .filter(s => s.activa && parseInt(s.anio) === anio)
      .forEach(s => {
        const ced = String(s.cedula || '');
        if (!suspIdx[ced]) suspIdx[ced] = new Set();
        for (let m = s.mes_inicio; m <= s.mes_fin; m++) suspIdx[ced].add(m);
      });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ZenSports';
    const ws = wb.addWorksheet(`ESTADO ${anio}`, { views: [{ state: 'frozen', ySplit: 2 }] });

    ws.columns = [
      { width: 34 },  // JUGADOR
      { width: 18 },  // CÉDULA
      { width: 12 },  // ESTADO
      ...MESES.map(() => ({ width: 13 })),
      { width: 22 },  // CATEGORÍA
      { width: 36 },  // OBSERVACIONES
    ];

    const TOTAL_COLS = 3 + MESES.length + 2;

    // ── Fila título ───────────────────────────────────────────────
    const titleRow = ws.addRow([`ESTADO DE MENSUALIDADES ${anio}  ·  ${fecha.toUpperCase()}  ·  ${clubConfig?.nombre?.toUpperCase() || ''}`]);
    ws.mergeCells(1, 1, 1, TOTAL_COLS);
    titleRow.getCell(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleRow.getCell(1).font      = { bold: true, color: { argb: 'FFFBBF24' }, size: 11, name: 'Calibri' };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 24;

    // ── Fila encabezado ───────────────────────────────────────────
    const headerRow = ws.addRow(['JUGADOR', 'CÉDULA', 'ESTADO', ...MESES, 'CATEGORÍA', 'OBSERVACIONES']);
    headerRow.eachCell((cell, col) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: col <= 3 ? 'FF1E293B' : 'FF334155' } };
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
      cell.border    = { bottom: { style: 'medium', color: { argb: 'FFFBBF24' } } };
    });
    headerRow.height = 22;

    // AutoFiltro desde la fila de encabezados
    ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: TOTAL_COLS } };

    // ── Filas de datos ────────────────────────────────────────────
    const activos   = [...jugadoresConPago].filter(j =>  j.activo).sort((a, b) => (a.nombreCompleto||'').localeCompare(b.nombreCompleto||'','es'));
    const inactivos = [...jugadoresConPago].filter(j => !j.activo).sort((a, b) => (a.nombreCompleto||'').localeCompare(b.nombreCompleto||'','es'));
    const jugadoresOrdenados = [...activos, ...inactivos];

    jugadoresOrdenados.forEach((j, idx) => {
      const esPend         = esCedulaPend(j.cedula);
      const esInactivo     = !j.activo;
      const esExentoGlobal = Number(j.descuento_pct) >= 100;
      const mesesJ         = mensIdx[String(j.cedula)] || {};
      const zebraFg        = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';

      const suspMeses = suspIdx[String(j.cedula)];
      const estadosMes = MESES.map((_, i) => {
        if (esExentoGlobal) return 'EXENTO';
        const mes = i + 1;
        if (suspMeses?.has(mes)) return 'NO APLICA';
        const est = mesesJ[mes] || '-';
        return est === 'EXENTO' ? 'NO APLICA' : est;
      });

      // Observaciones: usar notas del jugador, quitando prefijo "[Exento: ...]" si quedó de lógica anterior
      const observaciones = (j.notas || '').replace(/^\[Exento:[^\]]*\]\s*/, '').trim();

      const COL_ESTADO = 3;
      const COL_MES_INICIO = 4;                           // primera columna de mes
      const COL_MES_FIN    = 3 + MESES.length;           // última columna de mes
      const COL_CAT        = 3 + MESES.length + 1;
      const COL_OBS        = 3 + MESES.length + 2;

      const dataRow = ws.addRow([
        (j.nombreCompleto || '').toUpperCase(),
        String(j.cedula || '').toUpperCase(),
        esInactivo ? 'INACTIVO' : 'ACTIVO',
        ...estadosMes,
        (j.categoria || '').toUpperCase(),
        observaciones,
      ]);

      dataRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        const esMesCol    = colNum >= COL_MES_INICIO && colNum <= COL_MES_FIN;
        const esEstadoCol = colNum === COL_ESTADO;
        const esObsCol    = colNum === COL_OBS;
        const estado      = esMesCol ? estadosMes[colNum - COL_MES_INICIO] : null;
        const estStyle    = estado ? ESTADO_STYLE[estado] : null;

        if (esMesCol && estStyle) {
          const bg = esInactivo ? 'FFE5E7EB' : estStyle.bg;
          const fg = esInactivo ? 'FF9CA3AF' : estStyle.fg;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.font = { size: 10, name: 'Calibri', color: { argb: fg }, bold: !esInactivo && estStyle.bold };
        } else if (esEstadoCol) {
          const bg = esInactivo ? 'FFE5E7EB' : 'FFD1FAE5';
          const fg = esInactivo ? 'FF6B7280' : 'FF166534';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.font = { size: 10, name: 'Calibri', bold: true, color: { argb: fg } };
        } else {
          // Celdas de información (jugador, cédula, categoría)
          if (esPend) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };
            cell.font = { size: 10, name: 'Calibri', bold: true, italic: true, color: { argb: 'FF9A3412' } };
          } else if (esInactivo) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
            cell.font = { size: 10, name: 'Calibri', italic: true, color: { argb: 'FF9CA3AF' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraFg } };
            cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF1E293B' } };
          }
        }

        cell.alignment = { horizontal: (esMesCol || esEstadoCol) ? 'center' : 'left', vertical: 'middle', wrapText: esObsCol || false };

        if (colNum === 1 && esPend) {
          cell.border = { left: { style: 'medium', color: { argb: 'FFF97316' } } };
        }
        if (colNum === 1 && esInactivo && !esPend) {
          cell.border = { left: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
        }
      });

      dataRow.height = 19;
    });

    // Descargar
    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `estado_actual_${anio}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = async () => { try {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297; const H = 210; const M = 12;
    const accentRgb = hexToRgb(color || clubConfig?.color);
    const clubName  = clubConfig?.nombre || 'Mi Club';
    const fecha     = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    const titulo    = filtroCategoria === SIN_EQUIPO ? 'Jugadores — Sin equipo' : filtroCategoria !== 'TODOS' ? `Jugadores — ${filtroCategoria}` : 'Listado de Jugadores';

    const logoData = await loadLogoDataUrl(clubConfig?.logo_url);

    // Variables de fecha — usadas tanto en filas como en totales
    const anio       = new Date().getFullYear();
    const mesHoy     = new Date().getMonth() + 1;
    const diaHoy     = new Date().getDate();
    const diasGracia = clubConfig?.dias_gracia_mora ?? 0;

    // Suspensión ACTIVA por cédula (si se cancela, la deuda de esos meses vuelve a contar)
    const suspIdxPdf = {};
    (suspensiones || []).forEach(s => {
      if (!s.activa || parseInt(s.anio) !== anio) return;
      const ced = String(s.cedula);
      if (!suspIdxPdf[ced]) suspIdxPdf[ced] = new Set();
      for (let m = s.mes_inicio; m <= s.mes_fin; m++) suspIdxPdf[ced].add(m);
    });
    const estaSuspendido = (cedula, mesNum) => suspIdxPdf[String(cedula)]?.has(mesNum) || false;

    // Índice meses en mora por cédula (solo hasta mes actual, excluye meses suspendidos)
    const moraPorCedula = {};
    (mensualidades || [])
      .filter(m => parseInt(m.anio) === anio && m.estado === 'MORA' && parseInt(m.numero_mes) <= mesHoy)
      .forEach(m => {
        const ced = String(m.cedula || m.player_id || '');
        if (estaSuspendido(ced, parseInt(m.numero_mes))) return;
        moraPorCedula[ced] = (moraPorCedula[ced] || 0) + 1;
      });

    // Deuda de un jugador hasta el mes actual — nunca cuenta un mes con suspensión activa
    function calcularDeuda(cedula) {
      const mensJ = (mensualidades || []).filter(m =>
        String(m.cedula || m.player_id || '') === String(cedula) &&
        parseInt(m.anio) === anio && parseInt(m.numero_mes) <= mesHoy
      );
      let deuda = 0;
      mensJ.forEach(m => {
        const numMes = parseInt(m.numero_mes);
        if (estaSuspendido(cedula, numMes)) return;
        const saldo = parseFloat(m.saldo_pendiente) || 0;
        if (m.estado === 'MORA' || m.estado === 'PARCIAL') {
          deuda += saldo;
        } else if (m.estado === 'PENDIENTE' && (numMes < mesHoy || (numMes === mesHoy && diaHoy > diasGracia))) {
          deuda += saldo;
        }
      });
      return deuda;
    }

    const cols = [
      { label: '#',         x: M },
      { label: 'NOMBRE',    x: M + 10 },
      { label: 'CÉDULA',    x: M + 68 },
      { label: 'CELULAR',   x: M + 98 },
      { label: 'CATEGORÍA', x: M + 126 },
      { label: 'ESTADO',    x: M + 158 },
      { label: 'EN MORA',   x: M + 184 },
      { label: 'PAGADO',    x: M + 207 },
      { label: 'DEUDA',     x: M + 246 },
    ];

    const drawPageHeader = () => {
      const y0 = drawPdfHeader(doc, { W, M, clubName, title: titulo.toUpperCase(), date: `${fecha.toUpperCase()} · ${filtered.length} JUGADORES`, logoData, accentRgb });
      return drawPdfTableHead(doc, { W, M, y: y0, columns: cols, accentRgb });
    };

    let y = drawPageHeader();

    const pdfData = [...filtered].sort((a, b) => (a.nombreCompleto||'').localeCompare(b.nombreCompleto||'', 'es'));
    pdfData.forEach((j, i) => {
      if (y > H - 20) { doc.addPage(); y = drawPageHeader(); }
      if (i % 2 === 0) { doc.setFillColor(248, 249, 250); doc.rect(M - 2, y - 4, W - M * 2 + 4, 8, 'F'); }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(30, 40, 50);
      doc.text(String(i + 1),                                       cols[0].x, y);
      doc.text((j.nombreCompleto || '').toUpperCase().slice(0, 26), cols[1].x, y);
      doc.text(String(j.cedula || ''),                              cols[2].x, y);
      doc.text(String(j.celular || ''),                             cols[3].x, y);
      doc.text((j.categoria || '—').toUpperCase().slice(0, 14),     cols[4].x, y);
      const estadoColor = j.estadoPago === 'AL_DIA' ? [34, 197, 94] : j.estadoPago === 'MORA' ? [239, 68, 68] : [245, 166, 35];
      doc.setTextColor(...estadoColor);
      doc.setFont('helvetica', 'bold');
      doc.text(j.estadoPago === 'AL_DIA' ? 'AL DÍA' : j.estadoPago === 'MORA' ? 'EN MORA' : j.estadoPago?.toUpperCase() || '-', cols[5].x, y);
      const mMora = moraPorCedula[String(j.cedula)] || 0;
      if (mMora > 0) {
        doc.setTextColor(239, 68, 68);
        doc.text(`${mMora} MES${mMora > 1 ? 'ES' : ''}`, cols[6].x, y);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('—', cols[6].x, y);
      }
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 40, 50);
      doc.text(formatCOP(j.totalPagado), cols[7].x, y);
      const deudaJ = calcularDeuda(j.cedula);
      if (deudaJ > 0) {
        doc.setTextColor(239, 68, 68);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCOP(deudaJ), cols[8].x, y);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.text('—', cols[8].x, y);
      }
      y += 8;
    });

    if (!filtered.length) {
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('No hay jugadores en este listado.', M, y + 4);
    }

    // ── Fila de totales ───────────────────────────────────────────
    if (filtered.length) {
      // anio, mesHoy, diaHoy, diasGracia ya definidos arriba
      const totalDeuda = filtered.reduce((sum, j) => sum + calcularDeuda(j.cedula), 0);

      const totalPagado = filtered.reduce((s, j) => s + (j.totalPagado || 0), 0);
      const conDeuda    = filtered.filter(j => (j.saldoPendiente || 0) > 0).length;

      if (y > H - 28) { doc.addPage(); y = drawPageHeader(); }
      y += 4;

      // Línea separadora
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.4);
      doc.line(M - 2, y - 2, W - M + 2, y - 2);
      y += 4;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 40, 50);
      doc.text(`TOTAL JUGADORES: ${filtered.length}   |   CON DEUDA: ${conDeuda}`, cols[1].x, y);

      doc.setTextColor(239, 68, 68);
      doc.text(`DEUDA EXIGIBLE: ${formatCOP(totalDeuda)}`, cols[5].x, y);

      doc.setTextColor(34, 197, 94);
      doc.text(`RECAUDADO: ${formatCOP(totalPagado)}`, cols[7].x - 5, y);

      if (diaHoy <= diasGracia) {
        y += 6;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text(`* Dentro de los ${diasGracia} días de gracia — mes ${mesHoy < 10 ? '0' + mesHoy : mesHoy}/${anio} aún no se contabiliza como mora.`, cols[1].x, y);
      }
    }

    const pages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      drawPdfFooter(doc, { W, H, M, clubName, pageNum: p, totalPages: pages, note: `${filtered.length} JUGADORES` });
    }

    const filtroLabel = filtroCategoria === SIN_EQUIPO ? '-sin-equipo' : filtroCategoria !== 'TODOS' ? `-${filtroCategoria.toLowerCase().replace(/\s+/g, '-')}` : '';
    const clubSlugPdf = (clubConfig?.nombre || 'club').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    doc.save(`listado-jugadores-${clubSlugPdf}${filtroLabel}-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    console.error('[PDF jugadores]', err);
    alert('Error al generar el PDF: ' + err.message);
  } };

  // ── Balance general: estado actual (grid 12 meses) + torneos + uniformes ──
  // Una sola tabla ancha, una fila por jugador — mismo espíritu que "Estado
  // Actual" pero con una columna por cada torneo del club y el total de
  // uniformes, en vez de exportarlos aparte.

  const [showBalance,    setShowBalance]    = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [pedidoUniformesCache, setPedidoUniformesCache] = useState(null);

  async function cargarPedidoUniformes() {
    if (pedidoUniformesCache) return pedidoUniformesCache;
    const res  = await authFetch(`${API_BASE_URL}/uniforms?club_id=${getClubId()}`);
    const data = await res.json();
    const list = data.success ? (data.data || []) : [];
    setPedidoUniformesCache(list);
    return list;
  }

  const MESES_BALANCE_TODAS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const esCedulaPendBalance = (ced) => String(ced).startsWith('PEND_');

  function construirIndicesMensuales(anio) {
    const mensIdx = {};
    (mensualidades || []).filter(m => parseInt(m.anio) === anio).forEach(m => {
      const ced = String(m.cedula || m.player_id || '');
      if (!mensIdx[ced]) mensIdx[ced] = {};
      mensIdx[ced][parseInt(m.numero_mes)] = { estado: m.estado, saldo: parseFloat(m.saldo_pendiente) || 0 };
    });
    const suspIdx = {};
    (suspensiones || []).filter(s => s.activa && parseInt(s.anio) === anio).forEach(s => {
      const ced = String(s.cedula || '');
      if (!suspIdx[ced]) suspIdx[ced] = new Set();
      for (let m = s.mes_inicio; m <= s.mes_fin; m++) suspIdx[ced].add(m);
    });
    return { mensIdx, suspIdx };
  }

  // Solo hasta el mes actual — los meses siguientes aún no se han causado,
  // mostrarlos es ruido (y ocupan espacio innecesario en la tabla).
  // La deuda se suma SOLO de los meses que quedan en MORA/PENDIENTE/PARCIAL
  // (nunca de un mes exento o suspendido) — así el total siempre cuadra
  // exactamente con lo que la fila muestra, sin depender de que el saldo_pendiente
  // guardado en un mes suspendido/exento ya esté en cero en la base de datos.
  function estadosMesDeJugador(j, mensIdx, suspIdx, mesesLabels) {
    const esExentoGlobal = Number(j.descuento_pct) >= 100;
    const mesesJ    = mensIdx[String(j.cedula)] || {};
    const suspMeses = suspIdx[String(j.cedula)];
    let deuda = 0;
    const labels = mesesLabels.map((_, i) => {
      const mes = i + 1;
      if (esExentoGlobal || suspMeses?.has(mes)) {
        return esExentoGlobal ? 'EXENTO' : 'NO APLICA';
      }
      const info = mesesJ[mes];
      const est  = info?.estado || '-';
      if (est === 'EXENTO') return 'NO APLICA';
      if (est === 'MORA' || est === 'PENDIENTE' || est === 'PARCIAL') deuda += info?.saldo || 0;
      return est;
    });
    return { labels, deuda };
  }

  // Consolida por jugador: estado mensual hasta el mes actual (igual lógica
  // que Estado Actual), una columna por cada torneo distinto del club, el
  // total de uniformes (pedido_uniformes — el ledger "uniformes" suele estar
  // vacío) y la deuda total (mensualidades + torneos + uniformes) al final.
  function construirBalanceCompleto(pedidos) {
    const anio         = new Date().getFullYear();
    const mesActual     = new Date().getMonth() + 1;
    const mesesLabels   = MESES_BALANCE_TODAS.slice(0, mesActual);
    const { mensIdx, suspIdx } = construirIndicesMensuales(anio);

    const torneoNombres = [...new Set((torneos || []).map(t => t.nombre_torneo).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'es'));

    const torneosPorCedula = {};
    (torneos || []).forEach(t => {
      const ced = String(t.cedula || t.player_id || '');
      if (!torneosPorCedula[ced]) torneosPorCedula[ced] = {};
      torneosPorCedula[ced][t.nombre_torneo] = { estado: t.estado, saldo: parseFloat(t.saldo_pendiente) || 0 };
    });

    const uniformesPorCedula = {};
    (pedidos || []).forEach(p => {
      const ced = String(p.cedula || '');
      if (!uniformesPorCedula[ced]) uniformesPorCedula[ced] = { pagado: 0, deuda: 0 };
      const total  = parseFloat(p.total)        || 0;
      const pagado = parseFloat(p.valor_pagado) || 0;
      uniformesPorCedula[ced].pagado += pagado;
      uniformesPorCedula[ced].deuda  += Math.max(0, total - pagado);
    });

    const activos   = jugadoresConPago.filter(j =>  j.activo).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));
    const inactivos = jugadoresConPago.filter(j => !j.activo).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));

    const filas = [...activos, ...inactivos].map(j => {
      const ced = String(j.cedula);
      const torneosJ  = torneoNombres.map(nombre => torneosPorCedula[ced]?.[nombre] || null);
      const torDeuda  = torneosJ.reduce((s, t) => s + (t?.saldo || 0), 0);
      const uniDeuda  = uniformesPorCedula[ced]?.deuda || 0;
      const { labels: estadosMes, deuda: mensDeuda } = estadosMesDeJugador(j, mensIdx, suspIdx, mesesLabels);
      return {
        cedula: j.cedula, nombre: j.nombreCompleto, activo: j.activo,
        estadosMes,
        torneosJ,
        uniPagado:  uniformesPorCedula[ced]?.pagado || 0,
        uniDeuda,
        deudaTotal: mensDeuda + torDeuda + uniDeuda,
      };
    });

    return { filas, torneoNombres, mesesLabels, anio };
  }

  async function exportarBalancePDF() {
    if (balanceLoading) return;
    setBalanceLoading(true);
    try {
      const pedidos = await cargarPedidoUniformes();
      const { filas, torneoNombres, mesesLabels, anio } = construirBalanceCompleto(pedidos);

      const { default: jsPDF } = await import('jspdf');
      // A3 apaisado — el grid de meses + columnas por torneo no cabe cómodo en A4.
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
      const W = 420, H = 297, M = 12;
      const accentRgb = hexToRgb(color || clubConfig?.color);
      const clubName  = clubConfig?.nombre || 'Mi Club';
      const fecha     = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
      const logoData  = await loadLogoDataUrl(clubConfig?.logo_url);

      const NOMBRE_W = 46, CED_W = 20, EST_W = 14, UNI_W = 18, TOTAL_W = 22;
      const usable   = (W - M * 2) - NOMBRE_W - CED_W - EST_W - UNI_W * 2 - TOTAL_W;
      const nColsVar = mesesLabels.length + torneoNombres.length;
      const colW     = Math.max(10, usable / nColsVar);

      let x = M;
      const cols = [];
      cols.push({ label: 'JUGADOR', x, w: NOMBRE_W, align: 'left'   }); x += NOMBRE_W;
      cols.push({ label: 'CÉDULA',  x, w: CED_W,    align: 'left'   }); x += CED_W;
      cols.push({ label: 'ESTADO',  x, w: EST_W,    align: 'center' }); x += EST_W;
      mesesLabels.forEach(m => { cols.push({ label: m, x, w: colW, align: 'center' }); x += colW; });
      torneoNombres.forEach(t => { cols.push({ label: t.toUpperCase().slice(0, 16), x, w: colW, align: 'center' }); x += colW; });
      cols.push({ label: 'U.PAGADO',     x, w: UNI_W,   align: 'right' }); x += UNI_W;
      cols.push({ label: 'U.DEUDA',      x, w: UNI_W,   align: 'right' }); x += UNI_W;
      cols.push({ label: 'DEUDA TOTAL',  x, w: TOTAL_W, align: 'right' });

      const IDX_MES0     = 3;
      const IDX_TORNEO0  = 3 + mesesLabels.length;
      const IDX_UNI_PAG  = IDX_TORNEO0 + torneoNombres.length;
      const IDX_UNI_DEU  = IDX_UNI_PAG + 1;
      const IDX_TOTAL    = IDX_UNI_DEU + 1;

      const drawPageHeader = () => {
        const y0 = drawPdfHeader(doc, { W, M, clubName, title: `BALANCE GENERAL ${anio}`, date: `${fecha.toUpperCase()} · MENSUALIDADES + TORNEOS + UNIFORMES`, logoData, accentRgb });
        doc.setFillColor(243, 244, 246);
        doc.rect(M - 2, y0 - 4, W - M * 2 + 4, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.8);
        doc.setTextColor(...accentRgb);
        cols.forEach(c => {
          const tx = c.align === 'right' ? c.x + c.w - 1 : c.align === 'center' ? c.x + c.w / 2 : c.x;
          doc.text(c.label, tx, y0, { align: c.align, maxWidth: c.w + 2 });
        });
        return y0 + 7;
      };

      const ESTADO_MES_COLOR = {
        EXENTO: [29, 78, 216], AL_DIA: [22, 163, 74], MORA: [220, 38, 38],
        'NO APLICA': [180, 83, 9], PENDIENTE: [107, 114, 128], PARCIAL: [37, 99, 235], '-': [195, 195, 195],
      };
      const ESTADO_MES_LABEL = { EXENTO: 'EX', AL_DIA: 'OK', MORA: 'MORA', 'NO APLICA': 'N/A', PENDIENTE: 'PEND', PARCIAL: 'PARC', '-': '-' };

      let y = drawPageHeader();

      filas.forEach((f, idx) => {
        if (y > H - 18) { doc.addPage(); y = drawPageHeader(); }
        if (idx % 2 === 0) { doc.setFillColor(248, 249, 250); doc.rect(M - 2, y - 3.5, W - M * 2 + 4, 6.5, 'F'); }

        const esPend = esCedulaPendBalance(f.cedula);
        const grisInactivo = !f.activo ? [165, 165, 165] : null;

        doc.setFontSize(6.3);
        doc.setFont('helvetica', esPend ? 'bolditalic' : f.activo ? 'normal' : 'italic');
        doc.setTextColor(...(grisInactivo || (esPend ? [154, 52, 18] : [30, 40, 50])));
        doc.text(f.nombre.slice(0, 30), cols[0].x, y);
        doc.text(String(f.cedula), cols[1].x, y);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...(f.activo ? [22, 163, 74] : [165, 165, 165]));
        doc.text(f.activo ? 'ACTIVO' : 'INACT.', cols[2].x + cols[2].w / 2, y, { align: 'center' });

        f.estadosMes.forEach((est, i) => {
          const c = cols[IDX_MES0 + i];
          const rgb = grisInactivo || ESTADO_MES_COLOR[est] || [150, 150, 150];
          doc.setFont('helvetica', est === 'MORA' ? 'bold' : 'normal');
          doc.setFontSize(6.3);
          doc.setTextColor(...rgb);
          doc.text(ESTADO_MES_LABEL[est] || est, c.x + c.w / 2, y, { align: 'center' });
        });

        f.torneosJ.forEach((t, i) => {
          const c = cols[IDX_TORNEO0 + i];
          doc.setFontSize(6.3);
          if (!t) {
            doc.setFont('helvetica', 'normal'); doc.setTextColor(195, 195, 195);
            doc.text('—', c.x + c.w / 2, y, { align: 'center' });
          } else if (t.estado === 'AL_DIA' || t.saldo <= 0) {
            doc.setFont('helvetica', 'normal'); doc.setTextColor(...(grisInactivo || [22, 163, 74]));
            doc.text('OK', c.x + c.w / 2, y, { align: 'center' });
          } else {
            doc.setFont('helvetica', 'bold'); doc.setTextColor(...(grisInactivo || [220, 38, 38]));
            doc.text(formatCOP(t.saldo).replace(/[^\d.,]/g, ''), c.x + c.w / 2, y, { align: 'center' });
          }
        });

        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.3);
        const sinPendienteUni = f.uniDeuda === 0;
        doc.setTextColor(...(grisInactivo || (sinPendienteUni ? [22, 163, 74] : [30, 40, 50])));
        doc.text(formatCOP(f.uniPagado), cols[IDX_UNI_PAG].x + cols[IDX_UNI_PAG].w - 1, y, { align: 'right' });
        doc.setTextColor(...(grisInactivo || (f.uniDeuda > 0 ? [220, 38, 38] : [22, 163, 74])));
        doc.setFont('helvetica', f.uniDeuda > 0 ? 'bold' : 'normal');
        doc.text(f.uniDeuda > 0 ? formatCOP(f.uniDeuda) : '—', cols[IDX_UNI_DEU].x + cols[IDX_UNI_DEU].w - 1, y, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...(grisInactivo || (f.deudaTotal > 0 ? [220, 38, 38] : [22, 163, 74])));
        doc.text(f.deudaTotal > 0 ? formatCOP(f.deudaTotal) : 'AL DÍA', cols[IDX_TOTAL].x + cols[IDX_TOTAL].w - 1, y, { align: 'right' });

        y += 6.5;
      });

      if (!filas.length) {
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('No hay jugadores.', M, y + 4);
      }

      const pages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        drawPdfFooter(doc, { W, H, M, clubName, pageNum: p, totalPages: pages, note: `${filas.length} JUGADORES` });
      }

      doc.save(`balance-general-${anio}-${new Date().toISOString().split('T')[0]}.pdf`);
      setShowBalance(false);
    } catch (err) {
      console.error('[balance PDF]', err);
      alert('Error al generar el PDF: ' + err.message);
    } finally {
      setBalanceLoading(false);
    }
  }

  async function exportarBalanceExcel() {
    if (balanceLoading) return;
    setBalanceLoading(true);
    try {
      const pedidos = await cargarPedidoUniformes();
      const { filas, torneoNombres, mesesLabels, anio } = construirBalanceCompleto(pedidos);
      const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

      const ExcelJS = (await import('exceljs')).default ?? (await import('exceljs'));
      const ESTADO_STYLE = {
        EXENTO:      { bg: 'FF1D4ED8', fg: 'FFFFFFFF', bold: true  },
        AL_DIA:      { bg: 'FFD1FAE5', fg: 'FF166534', bold: false },
        MORA:        { bg: 'FFFEE2E2', fg: 'FFB91C1C', bold: true  },
        'NO APLICA': { bg: 'FFFED7AA', fg: 'FF9A3412', bold: false },
        PENDIENTE:   { bg: 'FFF3F4F6', fg: 'FF6B7280', bold: false },
        PARCIAL:     { bg: 'FFDBEAFE', fg: 'FF1E40AF', bold: false },
      };

      const wb = new ExcelJS.Workbook();
      wb.creator = 'ZenSports';
      const ws = wb.addWorksheet(`BALANCE ${anio}`, { views: [{ state: 'frozen', ySplit: 2 }] });

      const HEADERS = ['JUGADOR', 'CÉDULA', 'ESTADO', ...mesesLabels, ...torneoNombres.map(t => t.toUpperCase()), 'UNIF. PAGADO', 'UNIF. DEUDA', 'DEUDA TOTAL'];
      const TOTAL_COLS = HEADERS.length;

      ws.columns = [
        { width: 32 }, { width: 16 }, { width: 11 },
        ...mesesLabels.map(() => ({ width: 9 })),
        ...torneoNombres.map(() => ({ width: 18 })),
        { width: 14 }, { width: 14 }, { width: 16 },
      ];

      const titleRow = ws.addRow([`BALANCE GENERAL ${anio} — MENSUALIDADES + TORNEOS + UNIFORMES  ·  ${fecha.toUpperCase()}  ·  ${(clubConfig?.nombre || '').toUpperCase()}`]);
      ws.mergeCells(1, 1, 1, TOTAL_COLS);
      titleRow.getCell(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      titleRow.getCell(1).font      = { bold: true, color: { argb: 'FFFBBF24' }, size: 11, name: 'Calibri' };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 24;

      const headerRow = ws.addRow(HEADERS);
      headerRow.eachCell((cell, col) => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: col <= 3 ? 'FF1E293B' : 'FF334155' } };
        cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9.5, name: 'Calibri' };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border    = { bottom: { style: 'medium', color: { argb: 'FFFBBF24' } } };
      });
      headerRow.height = 30;
      ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: TOTAL_COLS } };

      const COL_MES_INI    = 4;
      const COL_MES_FIN    = 3 + mesesLabels.length;
      const COL_TORNEO_INI = COL_MES_FIN + 1;
      const COL_TORNEO_FIN = COL_MES_FIN + torneoNombres.length;
      const COL_TOTAL      = COL_TORNEO_FIN + 3;

      filas.forEach((f, idx) => {
        const esPend     = esCedulaPendBalance(f.cedula);
        const esInactivo = !f.activo;
        const zebraFg    = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';

        const torneoValores = f.torneosJ.map(t => {
          if (!t) return '—';
          if (t.estado === 'AL_DIA' || t.saldo <= 0) return 'AL DÍA';
          return t.saldo;
        });

        const row = ws.addRow([
          f.nombre, String(f.cedula), esInactivo ? 'INACTIVO' : 'ACTIVO',
          ...f.estadosMes, ...torneoValores, f.uniPagado, f.uniDeuda, f.deudaTotal,
        ]);

        row.eachCell({ includeEmpty: true }, (cell, colNum) => {
          const esMesCol    = colNum >= COL_MES_INI && colNum <= COL_MES_FIN;
          const esTorneoCol = colNum >= COL_TORNEO_INI && colNum <= COL_TORNEO_FIN;
          const esUniCol    = colNum > COL_TORNEO_FIN && colNum < COL_TOTAL;
          const esTotalCol  = colNum === COL_TOTAL;
          const estado      = esMesCol ? f.estadosMes[colNum - COL_MES_INI] : null;
          const estStyle    = estado ? ESTADO_STYLE[estado] : null;

          if (esMesCol && estStyle) {
            const bg = esInactivo ? 'FFE5E7EB' : estStyle.bg;
            const fg = esInactivo ? 'FF9CA3AF' : estStyle.fg;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
            cell.font = { size: 10, name: 'Calibri', color: { argb: fg }, bold: !esInactivo && estStyle.bold };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (colNum === 3) {
            const bg = esInactivo ? 'FFE5E7EB' : 'FFD1FAE5';
            const fg = esInactivo ? 'FF6B7280' : 'FF166534';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
            cell.font = { size: 10, name: 'Calibri', bold: true, color: { argb: fg } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (esTorneoCol) {
            const val = cell.value;
            const esDeuda = typeof val === 'number' && val > 0;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: esDeuda ? 'FFFEE2E2' : val === 'AL DÍA' ? 'FFD1FAE5' : zebraFg } };
            cell.font = { size: 9.5, name: 'Calibri', bold: esDeuda, color: { argb: esDeuda ? 'FFB91C1C' : val === 'AL DÍA' ? 'FF166534' : 'FF9CA3AF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            if (esDeuda) cell.numFmt = '#,##0';
          } else if (esTotalCol) {
            const esDeudaTotal = (cell.value || 0) > 0;
            cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: esDeudaTotal ? 'FFFEE2E2' : 'FFD1FAE5' } };
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.font = { size: 10, name: 'Calibri', bold: true, color: { argb: esDeudaTotal ? 'FFB91C1C' : 'FF166534' } };
          } else if (esUniCol) {
            const sinPendienteUni = f.uniDeuda === 0;
            cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: sinPendienteUni ? 'FFD1FAE5' : 'FFFEE2E2' } };
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.font = { size: 10, name: 'Calibri', bold: !sinPendienteUni, color: { argb: sinPendienteUni ? 'FF166534' : 'FFB91C1C' } };
          } else {
            if (esPend) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };
              cell.font = { size: 10, name: 'Calibri', bold: true, italic: true, color: { argb: 'FF9A3412' } };
            } else if (esInactivo) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
              cell.font = { size: 10, name: 'Calibri', italic: true, color: { argb: 'FF9CA3AF' } };
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraFg } };
              cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF1E293B' } };
            }
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
        row.height = 19;
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement('a');
      a.href       = url;
      a.download   = `balance-general-${anio}-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setShowBalance(false);
    } catch (err) {
      console.error('[balance Excel]', err);
      alert('Error al generar el Excel: ' + err.message);
    } finally {
      setBalanceLoading(false);
    }
  }

  return (
    <>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: '16px', overflow: 'hidden' }}>

        {/* HEADER */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-sub)' }}>
          <div className="flex flex-col gap-3">
            {/* Fila 1: título + acciones */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: '22px', letterSpacing: '-0.2px', color: 'var(--text-pri)' }}>
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
                    className="w-full sm:w-60 pl-10 pr-4 py-2 rounded-xl text-sm text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[var(--cc)]/50 transition"
                  />
                </div>

                {/* Filtro de estado */}
                <FiltroEstadoDropdown value={filtroEstado} onChange={setFiltroEstado} opciones={estados} />

                {/* Filtro de deporte (solo si hay más de un deporte en el club) */}
                {opcionesDeporte.length > 0 && (
                  <FiltroEstadoDropdown value={filtroDeporte} onChange={setFiltroDeporte} opciones={opcionesDeporte} />
                )}

                {/* Filtro de categoría / equipo */}
                {opcionesCategoria.length > 1 && (
                  <FiltroCategoriaDropdown value={filtroCategoria} onChange={setFiltroCategoria} opciones={opcionesCategoria} />
                )}

                {/* Filtro de deuda de uniforme */}
                {(uniformes || []).length > 0 && (
                  <FiltroEstadoDropdown
                    value={filtroUniforme}
                    onChange={setFiltroUniforme}
                    opciones={['TODOS', 'CON_DEUDA', 'ENTREGADO', 'SIN_PEDIDO']}
                    placeholder="Uniforme"
                    todosLabel="Todos (uniforme)"
                    labels={{ CON_DEUDA: 'Con deuda', ENTREGADO: 'Al día / Entregado', SIN_PEDIDO: 'Sin pedido' }}
                  />
                )}

                {/* Exportar Excel */}
                <button
                  onClick={exportarCSV}
                  title="Exportar ficha completa de los jugadores filtrados — resalta datos faltantes"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.08)'}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Excel</span>
                </button>

                {/* Estado Actual — Excel 12 meses */}
                <button
                  onClick={exportarEstadoActual}
                  title={`Descargar estado de los 12 meses de ${new Date().getFullYear()} para todos los jugadores`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
                  style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.28)', color: '#38bdf8', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(56,189,248,0.08)'}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Estado Actual</span>
                </button>

                {/* Exportar PDF */}
                <button
                  onClick={exportarPDF}
                  title={`Reporte PDF de jugadores con estado y deuda — ${filtered.length} jugadores`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
                  style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', color: '#A855F7', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,85,247,0.08)'}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reporte</span>
                </button>

                {/* Balance general: mensualidades + torneos + uniformes */}
                <button
                  onClick={() => setShowBalance(true)}
                  title="Balance general por jugador — mensualidades, torneos y uniformes (PDF o Excel)"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.28)', color: '#FBBF24', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,191,36,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(251,191,36,0.08)'}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Balance</span>
                </button>

                {/* Importar jugadores Excel */}
                <button
                  onClick={() => setShowImportar(true)}
                  title="Importar jugadores desde Excel"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
                  style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)', color: '#60A5FA', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(96,165,250,0.08)'}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Importar</span>
                </button>

                {/* Toggle inactivos */}
                <button
                  onClick={() => { setVerArchivados(v => !v); setFiltroEstado('TODOS'); setSearch(''); }}
                  title={verArchivados ? 'Ver jugadores activos' : 'Ver jugadores inactivos'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
                  style={{ background: verArchivados ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${verArchivados ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.12)'}`, color: verArchivados ? '#EF4444' : 'var(--text-mut)', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{verArchivados ? 'Activos' : 'Inactivos'}</span>
                </button>

                {/* Importar estados mensualidades */}
                <button
                  onClick={() => setShowImportarMensualidades(true)}
                  title="Actualizar estados de mensualidades desde Excel"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
                  style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: '#34D399', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(52,211,153,0.08)'}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Estados</span>
                </button>
              </div>
            </div>

            {/* Fila 2: chips de filtros activos */}
            {(filtroEstado !== 'TODOS' || filtroCategoria !== 'TODOS' || filtroUniforme !== 'TODOS' || search) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[var(--text-mut)]">Filtros activos:</span>
                {filtroCategoria !== 'TODOS' && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition hover:opacity-80"
                    style={filtroCategoria === SIN_EQUIPO
                      ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', color: '#F59E0B' }
                      : { background: 'var(--cc12)', border: '1px solid var(--cc30)', color: 'var(--cc)' }}
                    onClick={() => setFiltroCategoria('TODOS')}
                  >
                    {filtroCategoria === SIN_EQUIPO ? <UserX className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                    {filtroCategoria === SIN_EQUIPO ? 'Sin equipo' : filtroCategoria}
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
                {filtroUniforme !== 'TODOS' && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition hover:opacity-80"
                    style={{ background: `${ESTADO_DOT[filtroUniforme]}20`, border: `1px solid ${ESTADO_DOT[filtroUniforme]}50`, color: ESTADO_DOT[filtroUniforme] }}
                    onClick={() => setFiltroUniforme('TODOS')}
                  >
                    <Shirt className="w-3 h-3" />
                    {{ CON_DEUDA: 'Uniforme: con deuda', ENTREGADO: 'Uniforme: al día', SIN_PEDIDO: 'Uniforme: sin pedido' }[filtroUniforme]}
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

        {/* RESUMEN EQUIPOS */}
        {categoriasJugadores.length > 0 && (
          <ResumenEquipos
            jugadores={jugadoresConPago}
            categoriasJugadores={categoriasJugadores}
            filtroActivo={filtroCategoria}
            onSelect={setFiltroCategoria}
          />
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
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
                    style={{ color: sortField === col.key ? 'var(--cc)' : 'var(--text-mut)' }}
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
                  style={{ borderBottom: '1px solid var(--border-sub)' }}
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
                        style={{ background: 'var(--cc12)', border: '1px solid var(--cc30)', color: 'var(--cc)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--cc20)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--cc12)'}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[var(--text-pri)] text-sm">{j.nombreCompleto}</span>
                          {String(j.cedula).startsWith('PEND_') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-400/10 text-orange-400 border border-orange-400/20">
                              ⚠ Datos pendientes
                            </span>
                          )}
                          {Number(j.descuento_pct) >= 100 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-400/10 text-sky-400 border border-sky-400/20">
                              EXENTO
                            </span>
                          )}
                          {(() => {
                            const s = asistenciaStats[j.cedula];
                            if (!s || !s.total_eventos) return null;
                            const c = s.presentes === 0 ? '#6B7280'
                              : s.porcentaje >= 75 ? '#22C55E'
                              : s.porcentaje >= 50 ? '#F59E0B'
                              : '#EF4444';
                            return (
                              <button
                                onClick={e => { e.stopPropagation(); abrirHoja(j, 'asistencia'); }}
                                title={`${s.porcentaje}% — ${s.presentes} de ${s.total_eventos} eventos`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border transition-opacity hover:opacity-75"
                                style={{ color: c, background: `${c}15`, borderColor: `${c}30` }}>
                                {s.presentes}/{s.total_eventos} asist.
                              </button>
                            );
                          })()}
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
                            {open && (() => {
                              const uData = uniformeData(j.cedula);
                              return (
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
                                {status === 'abono' && uData && (
                                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-sec)' }}>
                                    Abonado {formatCOP(uData.valor_pagado || 0)} · Saldo {formatCOP((uData.total || 0) - (uData.valor_pagado || 0))}
                                  </p>
                                )}
                              </div>
                              );
                            })()}
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
                      {Number(j.descuento_pct) >= 100 ? (
                        <button
                          onClick={() => abrirHoja(j, 'financiero')}
                          title="Jugador exento de mensualidades"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                          style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.18)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(56,189,248,0.08)'}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Exento</span>
                        </button>
                      ) : (
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
                      )}

                      {/* Inactivar / Restaurar */}
                      {verArchivados ? (
                        <button
                          onClick={() => setJugadorAArchivar({ ...j, accion: 'restaurar' })}
                          title="Restaurar jugador"
                          className="p-1.5 rounded-lg transition text-[var(--text-mut)] hover:text-green-500 hover:bg-green-500/10"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setJugadorAArchivar({ ...j, accion: 'archivar' })}
                          title="Inactivar jugador"
                          className="p-1.5 rounded-lg transition text-[var(--text-mut)] hover:text-orange-400 hover:bg-orange-400/10"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}

                      {/* Eliminar definitivamente */}
                      <button
                        onClick={() => setJugadorAEliminar(j)}
                        title="Eliminar jugador definitivamente"
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
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ background: 'var(--cc12)', border: '1px solid var(--cc20)' }}>
                <Users className="w-5 h-5 text-[var(--text-mut)]" />
              </div>
              <p className="text-[var(--text-sec)] text-sm font-medium mb-1">
                {filtroCategoria === SIN_EQUIPO
                  ? 'Todos los jugadores tienen equipo asignado'
                  : filtroCategoria !== 'TODOS'
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
                  className="mt-3 text-xs text-[var(--cc)] hover:underline"
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
            <span className="flex items-center gap-1.5 text-xs" style={{ color: filtroCategoria === SIN_EQUIPO ? '#F59E0B' : 'var(--cc)' }}>
              {filtroCategoria === SIN_EQUIPO ? <UserX className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
              Listado: {filtroCategoria === SIN_EQUIPO ? 'Sin equipo' : filtroCategoria} · CSV y PDF exportan este grupo
            </span>
          )}
        </div>
      </div>

      {/* MODAL IMPORTAR JUGADORES */}
      {showImportar && (
        <ImportarJugadoresModal
          onClose={() => setShowImportar(false)}
          onSuccess={() => { setShowImportar(false); onRefresh(); }}
        />
      )}

      {/* MODAL IMPORTAR ESTADOS MENSUALIDADES */}
      {showImportarMensualidades && (
        <MensualidadesImportModal
          color={color}
          onClose={() => setShowImportarMensualidades(false)}
          onSuccess={() => { setShowImportarMensualidades(false); onRefresh(); }}
        />
      )}

      {/* MODAL BALANCE GENERAL */}
      {showBalance && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !balanceLoading && setShowBalance(false)}>
          <div className="bg-[var(--bg-card)] border border-[var(--cc30)] rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--cc30)]">
              <h2 className="text-[var(--text-pri)] font-bold">Balance general</h2>
              <button onClick={() => setShowBalance(false)} className="text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-[var(--text-sec)] leading-relaxed">
                Igual que <strong>Estado Actual</strong> (grid de 12 meses), pero en la misma tabla se agrega una columna por cada torneo del club y el total de uniformes. Elige el formato:
              </p>
              <button onClick={exportarBalancePDF} disabled={balanceLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.35)', color: '#A855F7' }}>
                {balanceLoading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} Descargar PDF
              </button>
              <button onClick={exportarBalanceExcel} disabled={balanceLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.35)', color: '#38bdf8' }}>
                {balanceLoading ? <Loader2 size={15} className="animate-spin" /> : <ClipboardList size={15} />} Descargar Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER HOJA DE VIDA */}
      {jugadorDetalle && (
        <HojaDeVida
          jugador={jugadorDetalle}
          mensualidades={mensualidades}
          torneos={torneos || []}
          suspensiones={suspensiones}
          initialTab={jugadorDetalleTab}
          visibleTabs={jugadorDetalleTab === 'financiero' ? ['financiero'] : ['perfil', 'asistencia', 'carnet']}
          onClose={() => setJugadorDetalle(null)}
          onRefresh={onRefresh}
          categoriasJugadores={categoriasJugadores}
          clubConfig={clubConfig}
        />
      )}

      {/* MODAL ARCHIVAR / RESTAURAR */}
      {jugadorAArchivar && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => !archivando && setJugadorAArchivar(null)}
        >
          <div
            style={{ background: 'var(--bg-card)', border: jugadorAArchivar.accion === 'archivar' ? '1.5px solid rgba(251,146,60,0.5)' : '1.5px solid rgba(34,197,94,0.5)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icono + título */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: jugadorAArchivar.accion === 'archivar' ? 'rgba(251,146,60,0.15)' : 'rgba(34,197,94,0.15)', border: `1.5px solid ${jugadorAArchivar.accion === 'archivar' ? 'rgba(251,146,60,0.4)' : 'rgba(34,197,94,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {jugadorAArchivar.accion === 'archivar' ? <Archive size={22} color="#FB923C" /> : <RotateCcw size={22} color="#22C55E" />}
              </div>
              <div>
                <div style={{ color: 'var(--text-pri)', fontWeight: 700, fontSize: '18px', lineHeight: 1.3 }}>
                  {jugadorAArchivar.accion === 'archivar' ? '¿Inactivar jugador?' : '¿Restaurar jugador?'}
                </div>
                <div style={{ color: 'var(--text-sec)', fontSize: '14px', marginTop: '4px', lineHeight: 1.4 }}>
                  {jugadorAArchivar.accion === 'archivar'
                    ? 'El jugador quedará inactivo. Sus datos se conservan y puedes restaurarlo cuando quieras.'
                    : 'El jugador vuelve a la lista activa con todos sus datos intactos.'}
                </div>
              </div>
            </div>

            {/* Datos del jugador */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '14px 16px', borderLeft: `3px solid ${jugadorAArchivar.accion === 'archivar' ? '#FB923C' : '#22C55E'}` }}>
              <div style={{ color: 'var(--text-pri)', fontWeight: 700, fontSize: '16px' }}>{jugadorAArchivar.nombreCompleto}</div>
              <div style={{ color: 'var(--text-sec)', fontSize: '13px', marginTop: '2px' }}>CC {jugadorAArchivar.cedula}</div>
            </div>

            {/* Botones acción */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setJugadorAArchivar(null)}
                disabled={archivando}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border-sub)', background: 'transparent', color: 'var(--text-sec)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmarArchivar(jugadorAArchivar.accion === 'restaurar')}
                disabled={archivando}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: jugadorAArchivar.accion === 'archivar' ? '#FB923C' : '#22C55E', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: archivando ? 'not-allowed' : 'pointer', opacity: archivando ? 0.7 : 1 }}
              >
                {archivando
                  ? (jugadorAArchivar.accion === 'archivar' ? 'Inactivando…' : 'Restaurando…')
                  : (jugadorAArchivar.accion === 'archivar' ? 'Sí, inactivar' : 'Sí, restaurar')}
              </button>
            </div>

            {/* Eliminar definitivamente — solo desde archivados */}
            {jugadorAArchivar.accion === 'restaurar' && (
              <div style={{ borderTop: '1px solid var(--border-sub)', paddingTop: '16px' }}>
                <p style={{ color: 'var(--text-sec)', fontSize: '13px', marginBottom: '10px', textAlign: 'center' }}>
                  ¿Ya no necesitas este jugador?
                </p>
                <button
                  onClick={() => { setJugadorAEliminar(jugadorAArchivar); setJugadorAArchivar(null); }}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #EF4444', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <AlertTriangle size={16} /> Eliminar definitivamente
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {jugadorAEliminar && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => !eliminando && setJugadorAEliminar(null)}
        >
          <div
            style={{ background: 'var(--bg-card)', border: '2px solid rgba(239,68,68,0.5)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 24px 60px rgba(239,68,68,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Franja de alerta */}
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1.5px solid rgba(239,68,68,0.35)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={24} color="#EF4444" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '16px' }}>Acción irreversible</div>
                <div style={{ color: '#f87171', fontSize: '13px', marginTop: '2px' }}>Esta acción no se puede deshacer. El jugador y todos sus datos se borrarán permanentemente.</div>
              </div>
            </div>

            {/* Datos del jugador */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '14px 16px', borderLeft: '3px solid #EF4444' }}>
              <div style={{ color: 'var(--text-pri)', fontWeight: 700, fontSize: '16px' }}>{jugadorAEliminar.nombreCompleto}</div>
              <div style={{ color: 'var(--text-sec)', fontSize: '13px', marginTop: '2px' }}>CC {jugadorAEliminar.cedula}</div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setJugadorAEliminar(null)}
                disabled={eliminando}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border-sub)', background: 'transparent', color: 'var(--text-sec)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: eliminando ? 'not-allowed' : 'pointer', opacity: eliminando ? 0.7 : 1 }}
              >
                {eliminando ? 'Eliminando…' : 'Sí, eliminar para siempre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
