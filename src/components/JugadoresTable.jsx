import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Eye, PauseCircle } from 'lucide-react';
import { ESTADO_COLORS } from '../config';
import EstadoCuenta from './EstadoCuenta';
import SuspensionModal from './SuspensionModal';

function EstadoBadge({ estado }) {
  const colors = ESTADO_COLORS[estado] || {
    bg: 'bg-white/5',
    text: 'text-gray-400',
    dot: 'bg-gray-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
      {estado}
    </span>
  );
}

export default function JugadoresTable({ jugadores, mensualidades, uniformes, torneos, registroPagos, suspensiones = [], onRefresh }) {
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [sortField, setSortField] = useState('nombreCompleto');
  const [sortDir, setSortDir] = useState('asc');
  const [jugadorDetalle, setJugadorDetalle] = useState(null);
  const [jugadorSuspension, setJugadorSuspension] = useState(null);

  const tieneSuspensionActiva = (cedula) =>
    suspensiones.some(s => s.activa && s.cedula === String(cedula));

  const mesActual = new Date().getMonth() + 1;

  const jugadoresConPago = useMemo(() => {
    return jugadores.map(j => {
      const mensJugador = mensualidades.filter(m => (m.cedula || m.jugador_id) == j.cedula);

      const mesActualData = mensJugador.find(m => parseInt(m.numero_mes) === mesActual);
      const estadoPago = mesActualData?.estado || 'SIN_DATOS';

      const saldoPendiente = mensJugador.reduce((sum, m) => sum + (parseFloat(m.saldo_pendiente) || 0), 0);
      const totalPagado = mensJugador.reduce((sum, m) => sum + (parseFloat(m.valor_pagado) || 0), 0);

      const nombre = `${j.nombre || j['nombre(s)'] || ''} ${j.apellidos || j['apellido(s)'] || ''}`.trim();

      return {
        ...j,
        nombreCompleto: nombre,
        estadoPago,
        saldoPendiente,
        totalPagado,
        activo: j.activo === true || (j.activo || '').toString().toUpperCase() === 'SI',
      };
    });
  }, [jugadores, mensualidades, mesActual]);

  const filtered = useMemo(() => {
    return jugadoresConPago
      .filter(j => {
        const matchSearch =
          search === '' ||
          j.nombreCompleto?.toLowerCase().includes(search.toLowerCase()) ||
          j.cedula?.includes(search);

        const matchEstado =
          filtroEstado === 'TODOS' || j.estadoPago === filtroEstado;

        return matchSearch && matchEstado;
      })
      .sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        const cmp = aVal.toString().localeCompare(bVal.toString(), 'es', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [jugadoresConPago, search, filtroEstado, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc'
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  const estados = ['TODOS', 'AL_DIA', 'PENDIENTE', 'PARCIAL', 'MORA'];

  const formatCOP = (n) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <>
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">

        {/* HEADER */}
        <div className="p-6 border-b border-white/10">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">

            <h2 className="text-lg font-semibold text-white">
              Jugadores
            </h2>

            <div className="flex gap-3 w-full sm:w-auto">

              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  type="text"
                  placeholder="Buscar nombre o cédula..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/30"
                />
              </div>

              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white"
              >
                {estados.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>

            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">

            <thead>
              <tr className="border-b border-white/10">
                {[
                  { key: 'nombreCompleto', label: 'Nombre' },
                  { key: 'cedula', label: 'Cédula' },
                  { key: 'celular', label: 'Celular' },
                  { key: 'estadoPago', label: 'Estado' },
                  { key: 'totalPagado', label: 'Pagado' },
                  { key: 'saldoPendiente', label: 'Pendiente' },
                  { key: 'acciones', label: '' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== 'acciones' && toggleSort(col.key)}
                    className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.key !== 'acciones' && <SortIcon field={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {filtered.map((j, i) => (
                <tr
                  key={j.cedula || i}
                  className="hover:bg-white/5 transition-all"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-white flex items-center gap-2">
                      {j.nombreCompleto}
                      {tieneSuspensionActiva(j.cedula) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                          <PauseCircle className="w-3 h-3" /> Suspendido
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {j.activo ? '🟢 Activo' : '🔴 Inactivo'}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                    {j.cedula}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-400">
                    {j.celular}
                  </td>

                  <td className="px-6 py-4">
                    <EstadoBadge estado={j.estadoPago} />
                  </td>

                  <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                    {formatCOP(j.totalPagado)}
                  </td>

                  <td className="px-6 py-4 text-sm text-yellow-400 font-semibold">
                    {formatCOP(j.saldoPendiente)}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setJugadorDetalle(j)}
                        className="p-2 rounded-lg hover:bg-green-500/10 transition"
                        title="Ver estado de cuenta"
                      >
                        <Eye className="w-4 h-4 text-gray-400 hover:text-green-400" />
                      </button>
                      <button
                        onClick={() => setJugadorSuspension(j)}
                        className={`p-2 rounded-lg transition ${tieneSuspensionActiva(j.cedula) ? 'bg-yellow-400/10 text-yellow-400' : 'hover:bg-yellow-400/10 text-gray-400 hover:text-yellow-400'}`}
                        title="Gestionar suspensión"
                      >
                        <PauseCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No se encontraron jugadores
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-white/10 text-sm text-gray-400">
          {filtered.length} de {jugadores.length} jugadores
        </div>

      </div>

      {/* MODAL ESTADO CUENTA */}
      {jugadorDetalle && (
        <EstadoCuenta
          jugador={jugadorDetalle}
          mensualidades={mensualidades}
          uniformes={uniformes || []}
          torneos={torneos || []}
          registroPagos={registroPagos || []}
          onClose={() => setJugadorDetalle(null)}
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
    </>
  );
}
