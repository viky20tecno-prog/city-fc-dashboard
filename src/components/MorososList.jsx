import { AlertCircle, Phone } from 'lucide-react';

export default function MorososList({ morosos }) {
  if (morosos.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Morosos</h2>
        <div className="text-center py-8 text-gray-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
          ¡Sin morosos! 🎉
        </div>
      </div>
    );
  }

  const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseInt(n) || 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Morosos</h2>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          {morosos.length} jugadores
        </span>
      </div>
      <div className="space-y-3">
        {morosos.map((m, i) => (
          <div key={m.cedula || i} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100">
            <div>
              <p className="font-medium text-gray-900 text-sm">{m.nombre}</p>
              <p className="text-xs text-gray-500">CC {m.cedula} · {m.dias_mora} días de mora</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-red-600 text-sm">{formatCOP(m.monto_pendiente)}</p>
              <a href={`tel:${m.celular}`} className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center gap-1">
                <Phone className="w-3 h-3" />{m.celular}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
