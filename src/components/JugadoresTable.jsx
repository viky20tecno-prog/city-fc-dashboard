import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, BookOpen, PauseCircle, Check, DollarSign, Trash2, AlertTriangle, Shirt } from 'lucide-react';
import { ESTADO_COLORS } from '../config';
import HojaDeVida from './HojaDeVida';
import SuspensionModal from './SuspensionModal';
import { deletePlayer } from '../services/api';

/* ── colores de cada estado para el dropdown ── */
const ESTADO_DOT = {
  TODOS:    '#6A6A6A',
  AL_DIA:   '#22C55E',
  PENDIENTE:'#F59E0B',
  PARCIAL:  '#60A5FA',
  MORA:     '#EF4444',
};

/* ── dropdown custom (reemplaza <select> nativo) ── */
function FiltroDropdown({ value, onChange, opciones }) {
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
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)', minWidth: '140px' }}
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm text-[var(--text-pri)] hover:border-[#E14924]/50 transition"
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ESTADO_DOT[value] || '#6A6A6A' }} />
          {value}
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
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-[var(--bg-surface)] text-left"
              style={{ color: value === opt ? '#E14924' : '#F5F5F5' }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ESTADO_DOT[opt] || '#6A6A6A' }} />
              <span className="flex-1">{opt}</span>
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
export default function JugadoresTable({ jugadores, mensualidades, uniformes, torneos, registroPagos, suspensiones = [], morosos = [], onRefresh, categoriasJugadores = [] }) {
  const [search, setSearch]               = useState('');
  const [filtroEstado, setFiltroEstado]   = useState('TODOS');
  const [sortField, setSortField]         = useState('nombreCompleto');
  const [sortDir, setSortDir]             = useState('asc');
  const [jugadorDetalle, setJugadorDetalle]       = useState(null);
  const [jugadorDetalleTab, setJugadorDetalleTab] = useState('perfil');
  const [jugadorSuspension, setJugadorSuspension] = useState(null);
  const [jugadorAEliminar, setJugadorAEliminar]   = useState(null);
  const [eliminando, setEliminando]               = useState(false);

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

  const filtered = useMemo(() => {
    return jugadoresConPago
      .filter(j => {
        const matchSearch  = search === '' || j.nombreCompleto?.toLowerCase().includes(search.toLowerCase()) || j.cedula?.includes(search);
        const matchEstado  = filtroEstado === 'TODOS' || j.estadoPago === filtroEstado;
        return matchSearch && matchEstado;
      })
      .sort((a, b) => {
        const cmp = (a[sortField] || '').toString().localeCompare((b[sortField] || '').toString(), 'es', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [jugadoresConPago, search, filtroEstado, sortField, sortDir]);

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

  return (
    <>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: '16px', overflow: 'hidden' }}>

        {/* HEADER */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-sub)' }}>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '22px', letterSpacing: '2px', color: 'var(--text-pri)' }}>
              Jugadores
            </h2>

            <div className="flex gap-2 w-full sm:w-auto">
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

              {/* Filtro de estado — dropdown custom */}
              <FiltroDropdown value={filtroEstado} onChange={setFiltroEstado} opciones={estados} />
            </div>
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
            <div className="text-center py-12 text-[var(--text-sec)] text-sm">
              No se encontraron jugadores
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-sub)', color: 'var(--text-mut)', fontSize: '13px' }}>
          {filtered.length} de {jugadores.length} jugadores
        </div>
      </div>

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
