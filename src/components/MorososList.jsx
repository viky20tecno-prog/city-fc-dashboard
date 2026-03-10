import { AlertCircle, Phone } from 'lucide-react';

export default function MorososList({ morosos }) {
  if (morosos.length === 0) {
    return (
      <div className="bg-[#161B22] rounded-2xl border border-[#30363D] p-6">
        <h2 className="text-lg font-semibold text-[#E6EDF3] mb-4">Morosos</h2>
        <div className="text-center py-8 text-[#8B949E]">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#00D084]" />
          ¡Sin morosos! 🎉
        </div>
      </div>
    );
  }

  const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseInt(n) || 0);

  return (
    <div className="bg-[#161B22] rounded-2xl border border-[#30363D] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#E6EDF3]">Morosos</h2>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(255,94,94,0.12)] text-[#FF5E5E]">
          {morosos.length} jugadores
        </span>
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {morosos.map((m, i) => (
          <div key={m.cedula || i} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,94,94,0.06)] border border-[#30363D]">
            <div>
              <p className="font-medium text-[#E6EDF3] text-sm">{m.nombre}</p>
              <p className="text-xs text-[#8B949E]">CC {m.cedula} · {m.meses_mora} mes{m.meses_mora > 1 ? 'es' : ''} de mora</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[#FF5E5E] text-sm">{formatCOP(m.saldo_total)}</p>
              {m.celular && (
                <a href={`https://wa.me/57${m.celular}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8B949E] hover:text-[#4A9EFF] inline-flex items-center gap-1">
                  <Phone className="w-3 h-3" />{m.celular}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
