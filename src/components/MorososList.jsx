import { AlertCircle, Phone } from 'lucide-react';

export default function MorososList({ morosos }) {

  const formatCOP = (n) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(parseInt(n) || 0);

  if (morosos.length === 0) {
    return (
      <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 overflow-hidden">

        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-green-500/10 blur-2xl" />
        </div>

        <h2 className="text-lg font-semibold text-white mb-4">Morosos</h2>

        <div className="text-center py-10 text-gray-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
          ¡Sin morosos!
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 overflow-hidden">

      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-red-500/10 blur-2xl" />
      </div>

      <div className="flex items-center justify-between mb-5 relative">
        <h2 className="text-lg font-semibold text-white tracking-tight">
          Morosos
        </h2>

        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          {morosos.length} jugadores
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 relative">

        {morosos.map((m, i) => {

          // 🔥 FIX: construcción de nombre sin tocar backend
          const nombre =
            m.nombre ||
            `${m["nombre(s)"] || ''} ${m["apellido(s)"] || ''}`.trim() ||
            `CC ${m.cedula}`;

          return (
            <div
              key={m.cedula || i}
              className="group flex items-center justify-between p-4 rounded-xl 
              bg-red-500/5 border border-white/10 
              hover:border-red-500/30 hover:bg-red-500/10 
              transition-all duration-300"
            >

              {/* izquierda */}
              <div>
                <p className="font-medium text-white text-sm">
                  {nombre}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  CC {m.cedula} · {m.meses_mora} mes{m.meses_mora > 1 ? 'es' : ''} de mora
                </p>
              </div>

              {/* derecha */}
              <div className="text-right">

                <p className="font-semibold text-red-400 text-sm">
                  {formatCOP(m.saldo_total)}
                </p>

                {m.celular && (
                  <a
                    href={`https://wa.me/57${m.celular}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-green-400 inline-flex items-center gap-1 mt-1 transition"
                  >
                    <Phone className="w-3 h-3" />
                    {m.celular}
                  </a>
                )}

              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
