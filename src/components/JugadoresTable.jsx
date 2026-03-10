import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { ESTADO_COLORS } from '../config';

function EstadoBadge({ estado }) {
  const colors = ESTADO_COLORS[estado] || { bg: 'bg-[#1E2530]', text: 'text-[#8B949E]', dot: 'bg-[#8B949E]' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
      {estado}
    </span>
  );
}

export default function JugadoresTable({ jugadores, mensualidades, onRefresh }) {
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [sortField, setSortField] = useState('nombre');
  const [sortDir, setSortDir] = useState('asc');

  const mesActual = new Date().getMonth() + 1;

  const jugadoresConPago = useMemo(() => {
    return jugadores.map(j => {
      const mensJugador = mensualidades.filter(m => (m.cedula || m.jugador_id) === j.cedula);
      const mesActualData = mensJugador.find(m => parseInt(m.numero_mes) === mesActual);
      const estadoPago = mesActualData?.estado || 'SIN_DATOS';
      const saldoPendiente = mensJugador.reduce((sum, m) => sum + (parseFloat(m.saldo_pendiente) || 0), 0);
      const totalPagado = mensJugador.reduce((sum, m) => sum + (parseFloat(m.valor_pagado) || 0), 0);
      const nombre = `${j['nombre(s)'] || j.nombre || ''} ${j['apellido(s)'] || j.apellidos || ''}`.trim();
      
      return {
        ...j,
        nombreCompleto: nombre,
        estadoPago,
        saldoPendiente,
        totalPagado,
        activo: (j.activo || '').toUpperCase() === 'SI',
      };
    });
  }, [jugadores, mensualidades, mesActual]);

  const filtered = useMemo(() => {
    return jugadoresConPago
      .filter(j => {
        const matchSearch = search === '' || 
          j.nombreCompleto?.toLowerCase().includes(search.toLowerCase()) ||
          j.cedula?.includes(search);
        const matchEstado = filtroEstado === 'TODOS' || j.estadoPago === filtroEstado;
        return matchSearch && matchEstado;
      })
      .sort((a, b) => {
        const aVal = a[sortField] || a.nombreCompleto || '';
        const bVal = b[sortField] || b.nombreCompleto || '';
        const cmp = aVal.toString().localeCompare(bVal.toString(), 'es', { numeric: true });
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

  const estados = ['TODOS', 'AL_DIA', 'PENDIENTE', 'PARCIAL', 'MORA'];

  const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="bg-[#161B22] rounded-2xl border border-[#30363D]">
      {/* Header */}
      <div className="p-6 border-b border-[#30363D]">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-lg font-semibold text-[#E6EDF3]">Jugadores</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
              <input
                type="text"
                placeholder="Buscar nombre o cédula..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]"
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
            <tr className="border-b border-[#30363D]">
              {[
                { key: 'nombreCompleto', label: 'Nombre' },
                { key: 'cedula', label: 'Cédula' },
                { key: 'celular', label: 'Celular' },
                { key: 'estadoPago', label: 'Estado Mes' },
                { key: 'totalPagado', label: 'Pagado' },
                { key: 'saldoPendiente', label: 'Saldo Pend.' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="text-left px-6 py-3 text-xs font-medium text-[#8B949E] uppercase tracking-wider cursor-pointer hover:text-[#E6EDF3] select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon field={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363D]/50">
            {filtered.map((j, i) => (
              <tr key={j.cedula || i} className="hover:bg-[#1E2530]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-[#E6EDF3]">{j.nombreCompleto}</div>
                  <div className="text-xs text-[#8B949E]">{j.activo ? '🟢 Activo' : '🔴 Inactivo'}</div>
                </td>
                <td className="px-6 py-4 text-sm text-[#8B949E] font-mono">{j.cedula}</td>
                <td className="px-6 py-4 text-sm text-[#8B949E]">{j.celular}</td>
                <td className="px-6 py-4"><EstadoBadge estado={j.estadoPago} /></td>
                <td className="px-6 py-4 text-sm text-[#00D084] font-medium">{formatCOP(j.totalPagado)}</td>
                <td className="px-6 py-4 text-sm text-[#F5A623] font-medium">{formatCOP(j.saldoPendiente)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#8B949E]">
            No se encontraron jugadores
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-[#30363D] text-sm text-[#8B949E]">
        {filtered.length} de {jugadores.length} jugadores
      </div>
    </div>
  );
}
