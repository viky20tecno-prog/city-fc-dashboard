import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, UserCheck, Loader2 } from 'lucide-react';
import { ESTADO_COLORS } from '../config';
import { activarJugador } from '../services/writeSheets';

function EstadoBadge({ estado }) {
  const colors = ESTADO_COLORS[estado] || { bg: 'bg-[#1E2530]', text: 'text-[#8B949E]', dot: 'bg-[#8B949E]' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
      {estado}
    </span>
  );
}

export default function JugadoresTable({ jugadores, pagos, onRefresh }) {
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [sortField, setSortField] = useState('nombre');
  const [sortDir, setSortDir] = useState('asc');
  const [activando, setActivando] = useState(null);

  const jugadoresConPago = useMemo(() => {
    return jugadores.map(j => {
      const pagosJugador = pagos.filter(p => p.cedula === j.cedula);
      const ultimoPago = pagosJugador[pagosJugador.length - 1];
      const estadoJugador = (j.estado || '').toUpperCase();
      return {
        ...j,
        estadoJugador,
        estadoPago: estadoJugador === 'PRUEBA' ? 'PRUEBA' : (ultimoPago?.estado || 'PENDIENTE'),
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

  const estados = ['TODOS', 'PAGADO', 'PENDIENTE', 'ABONO PARCIAL', 'MORA', 'POR VALIDAR', 'PRUEBA'];

  const handleActivar = async (cedula) => {
    if (!confirm('¿Activar este jugador? Pasará de PRUEBA a ACTIVO y se le notificará por WhatsApp.')) return;
    setActivando(cedula);
    try {
      const result = await activarJugador(cedula);
      if (result.success) {
        alert('✅ Jugador activado. Se enviará mensaje de bienvenida por WhatsApp.');
        if (onRefresh) onRefresh();
      } else {
        alert('❌ Error: ' + (result.error || 'No se pudo activar'));
      }
    } catch (err) {
      alert('❌ Error de conexión: ' + err.message);
    } finally {
      setActivando(null);
    }
  };

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
                { key: 'nombre', label: 'Nombre' },
                { key: 'cedula', label: 'Cédula' },
                { key: 'celular', label: 'Celular' },
                { key: 'estadoPago', label: 'Estado' },
                { key: 'ultimaFecha', label: 'Último Pago' },
                { key: 'acciones', label: 'Acciones' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => col.key !== 'acciones' && toggleSort(col.key)}
                  className="text-left px-6 py-3 text-xs font-medium text-[#8B949E] uppercase tracking-wider cursor-pointer hover:text-[#E6EDF3] select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.key !== 'acciones' && <SortIcon field={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363D]/50">
            {filtered.map((j, i) => (
              <tr key={j.cedula || i} className="hover:bg-[#1E2530]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-[#E6EDF3]">{j.nombre} {j.apellidos}</div>
                  <div className="text-xs text-[#8B949E]">{j.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-[#8B949E] font-mono">{j.cedula}</td>
                <td className="px-6 py-4 text-sm text-[#8B949E]">{j.celular}</td>
                <td className="px-6 py-4"><EstadoBadge estado={j.estadoPago} /></td>
                <td className="px-6 py-4 text-sm text-[#8B949E]">{j.ultimaFecha}</td>
                <td className="px-6 py-4">
                  {j.estadoJugador === 'PRUEBA' && (
                    <button
                      onClick={() => handleActivar(j.cedula)}
                      disabled={activando === j.cedula}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00D084] text-[#0D1117] rounded-lg text-xs font-medium hover:bg-[#00D084]/80 transition-colors disabled:opacity-50"
                    >
                      {activando === j.cedula ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserCheck className="w-3 h-3" />
                      )}
                      Activar
                    </button>
                  )}
                </td>
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
