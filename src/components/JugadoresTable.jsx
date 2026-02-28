import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { ESTADO_COLORS } from '../config';

function EstadoBadge({ estado }) {
  const colors = ESTADO_COLORS[estado] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
      {estado}
    </span>
  );
}

export default function JugadoresTable({ jugadores, pagos }) {
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [sortField, setSortField] = useState('nombre');
  const [sortDir, setSortDir] = useState('asc');

  // Merge jugadores con su último pago
  const jugadoresConPago = useMemo(() => {
    return jugadores.map(j => {
      const pagosJugador = pagos.filter(p => p.cedula === j.cedula);
      const ultimoPago = pagosJugador[pagosJugador.length - 1];
      return {
        ...j,
        estadoPago: ultimoPago?.estado || 'PENDIENTE',
        ultimoMonto: ultimoPago?.monto || '0',
        ultimaFecha: ultimoPago?.fecha_pago || '-',
        montoAcumulado: ultimoPago?.monto_acumulado || '0',
      };
    });
  }, [jugadores, pagos]);

  const filtered = useMemo(() => {
    return jugadoresConPago
      .filter(j => {
        const matchSearch = search === '' || 
          j.nombre?.toLowerCase().includes(search.toLowerCase()) ||
          j.apellidos?.toLowerCase().includes(search.toLowerCase()) ||
          j.cedula?.includes(search);
        const matchEstado = filtroEstado === 'TODOS' || j.estadoPago === filtroEstado;
        return matchSearch && matchEstado;
      })
      .sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        const cmp = aVal.localeCompare(bVal, 'es', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [jugadoresConPago, search, filtroEstado, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const estados = ['TODOS', 'PAGADO', 'PENDIENTE', 'ABONO PARCIAL', 'MORA', 'POR VALIDAR'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Jugadores</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar nombre o cédula..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {[
                { key: 'nombre', label: 'Nombre' },
                { key: 'cedula', label: 'Cédula' },
                { key: 'celular', label: 'Celular' },
                { key: 'estadoPago', label: 'Estado' },
                { key: 'ultimaFecha', label: 'Último Pago' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon field={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((j, i) => (
              <tr key={j.cedula || i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{j.nombre} {j.apellidos}</div>
                  <div className="text-xs text-gray-400">{j.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">{j.cedula}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{j.celular}</td>
                <td className="px-6 py-4"><EstadoBadge estado={j.estadoPago} /></td>
                <td className="px-6 py-4 text-sm text-gray-500">{j.ultimaFecha}</td>
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

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-400">
        {filtered.length} de {jugadores.length} jugadores
      </div>
    </div>
  );
}
