import { AlertCircle, Phone, FileDown } from 'lucide-react';

const formatCOP = (n) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(parseInt(n) || 0);

function exportarPDF(morosos) {
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  const mesActual = new Date().toLocaleString('es-CO', { month: 'long', year: 'numeric' });
  const totalSaldo = morosos.reduce((sum, m) => sum + (parseInt(m.saldo_total) || 0), 0);

  const filas = morosos.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${i + 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600">${m.nombre}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280">${m.cedula}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280">${m.celular || '—'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center">
        <span style="background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600">
          ${m.meses_mora} mes${m.meses_mora !== 1 ? 'es' : ''}
        </span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#dc2626;line-height:1.5">
        ${m.meses_detalle
          ? m.meses_detalle.split(' · ').map(mes =>
              `<span style="display:inline-block;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:1px 6px;margin:1px 2px;font-size:11px;white-space:nowrap">${mes}</span>`
            ).join('')
          : '<span style="color:#9ca3af">—</span>'
        }
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#dc2626;text-align:right">${formatCOP(m.saldo_total)}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte Morosos — City FC</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; color: #111; background: #fff; padding: 32px; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #10b981">
    <div>
      <h1 style="font-size:22px;font-weight:800;color:#111">⚽ City FC</h1>
      <p style="font-size:13px;color:#6b7280;margin-top:2px">Agente Contable — Sistema de Gestión</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:14px;font-weight:700;color:#dc2626">Reporte de Morosos</p>
      <p style="font-size:12px;color:#6b7280">${mesActual}</p>
      <p style="font-size:12px;color:#6b7280">Generado: ${fecha}</p>
    </div>
  </div>

  <!-- Resumen -->
  <div style="display:flex;gap:16px;margin-bottom:24px">
    <div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;text-align:center">
      <p style="font-size:12px;color:#dc2626;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Jugadores en mora</p>
      <p style="font-size:32px;font-weight:800;color:#dc2626;margin-top:4px">${morosos.length}</p>
    </div>
    <div style="flex:1;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;text-align:center">
      <p style="font-size:12px;color:#ea580c;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Total en mora</p>
      <p style="font-size:28px;font-weight:800;color:#ea580c;margin-top:4px">${formatCOP(totalSaldo)}</p>
    </div>
    <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center">
      <p style="font-size:12px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Promedio por jugador</p>
      <p style="font-size:28px;font-weight:800;color:#16a34a;margin-top:4px">${formatCOP(morosos.length ? Math.round(totalSaldo / morosos.length) : 0)}</p>
    </div>
  </div>

  <!-- Tabla -->
  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <thead>
      <tr style="background:#111827">
        <th style="padding:12px;text-align:left;font-size:12px;color:#9ca3af;font-weight:600">#</th>
        <th style="padding:12px;text-align:left;font-size:12px;color:#9ca3af;font-weight:600">JUGADOR</th>
        <th style="padding:12px;text-align:left;font-size:12px;color:#9ca3af;font-weight:600">CÉDULA</th>
        <th style="padding:12px;text-align:left;font-size:12px;color:#9ca3af;font-weight:600">CELULAR</th>
        <th style="padding:12px;text-align:center;font-size:12px;color:#9ca3af;font-weight:600">MESES</th>
        <th style="padding:12px;text-align:left;font-size:12px;color:#9ca3af;font-weight:600">DETALLE</th>
        <th style="padding:12px;text-align:right;font-size:12px;color:#9ca3af;font-weight:600">SALDO</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
    <tfoot>
      <tr style="background:#f9fafb">
        <td colspan="6" style="padding:12px;font-size:14px;font-weight:700;text-align:right;border-top:2px solid #e5e7eb">
          TOTAL A COBRAR
        </td>
        <td style="padding:12px;font-size:14px;font-weight:800;color:#dc2626;text-align:right;border-top:2px solid #e5e7eb">
          ${formatCOP(totalSaldo)}
        </td>
      </tr>
    </tfoot>
  </table>

  <!-- Footer -->
  <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">
    <p style="font-size:11px;color:#9ca3af">City FC — Documento confidencial · No compartir públicamente</p>
    <p style="font-size:11px;color:#9ca3af">city-fc-dashboard-theta.vercel.app</p>
  </div>

  <!-- Botón imprimir -->
  <div class="no-print" style="margin-top:24px;text-align:center">
    <button onclick="window.print()" style="background:#10b981;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">
      🖨️ Imprimir / Guardar PDF
    </button>
  </div>
</body>
</html>`;

  const ventana = window.open('', '_blank');
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
}

export default function MorososList({ morosos }) {
  if (!morosos || morosos.length === 0) {
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

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white tracking-tight">Morosos</h2>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            {morosos.length} jugadores
          </span>
        </div>
        {/* ✅ Botón exportar PDF */}
        <button
          onClick={() => exportarPDF(morosos)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#00D084]/30 bg-[rgba(0,208,132,0.08)] text-xs font-medium text-[#00D084] hover:bg-[rgba(0,208,132,0.15)] transition-colors"
        >
          <FileDown className="w-3.5 h-3.5" />
          Exportar PDF
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 relative">
        {morosos.map((m, i) => (
          <div key={m.cedula || i}
            className="group flex items-center justify-between p-4 rounded-xl
              bg-red-500/5 border border-white/10
              hover:border-red-500/30 hover:bg-red-500/10
              transition-all duration-300">
            <div>
              <p className="font-medium text-white text-sm">{m.nombre}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                CC {m.cedula} · {m.meses_mora} mes{m.meses_mora !== 1 ? 'es' : ''} de mora
              </p>
              {m.meses_detalle && (
                <p className="text-xs text-red-400/70 mt-0.5">{m.meses_detalle}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-red-400 text-sm">{formatCOP(m.saldo_total)}</p>
              {m.celular && (
                <a href={`https://wa.me/57${m.celular}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-green-400 inline-flex items-center gap-1 mt-1 transition">
                  <Phone className="w-3 h-3" />
                  {m.celular}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center relative">
        <span className="text-xs text-gray-400">Total en mora</span>
        <span className="text-sm font-bold text-red-400">
          {formatCOP(morosos.reduce((sum, m) => sum + (parseInt(m.saldo_total) || 0), 0))}
        </span>
      </div>
    </div>
  );
}
