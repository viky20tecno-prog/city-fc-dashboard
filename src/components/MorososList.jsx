import { AlertCircle, Phone, FileDown } from 'lucide-react';

const formatCOP = (n) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(parseInt(n) || 0);

function exportarPDF(morosos) {
  const fecha     = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
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
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #E14924">
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
        <td colspan="6" style="padding:12px;font-size:14px;font-weight:700;text-align:right;border-top:2px solid #e5e7eb">TOTAL A COBRAR</td>
        <td style="padding:12px;font-size:14px;font-weight:800;color:#dc2626;text-align:right;border-top:2px solid #e5e7eb">${formatCOP(totalSaldo)}</td>
      </tr>
    </tfoot>
  </table>

  <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">
    <p style="font-size:11px;color:#9ca3af">City FC — Documento confidencial · No compartir públicamente</p>
    <p style="font-size:11px;color:#9ca3af">city-fc-dashboard-pi.vercel.app</p>
  </div>

  <div class="no-print" style="margin-top:24px;text-align:center">
    <button onclick="window.print()" style="background:#E14924;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">
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

export default function MorososList({ morosos, codigoPais = '57' }) {
  if (!morosos || morosos.length === 0) {
    return (
      <div style={{
        background: '#141414', borderRadius: '16px',
        border: '1px solid rgba(225,73,36,0.22)', padding: '24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(225,73,36,0.45), transparent)',
          pointerEvents: 'none',
        }} />
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Morosos</h2>
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#5A5A5A' }}>
          <AlertCircle style={{ width: '32px', height: '32px', margin: '0 auto 8px', color: '#22C55E' }} />
          ¡Sin morosos!
        </div>
      </div>
    );
  }

  const totalSaldo = morosos.reduce((sum, m) => sum + (parseInt(m.saldo_total) || 0), 0);

  return (
    <div style={{
      background: '#141414', borderRadius: '16px',
      border: '1px solid rgba(225,73,36,0.22)', padding: '24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(225,73,36,0.45), transparent)',
        pointerEvents: 'none',
      }} />
      {/* ambient glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.05) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', letterSpacing: '-0.2px' }}>Morosos</h2>
          <span style={{
            padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
            background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            {morosos.length} jugadores
          </span>
        </div>
        <button
          onClick={() => exportarPDF(morosos)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
            border: '1px solid rgba(225,73,36,0.3)', background: 'rgba(225,73,36,0.08)',
            color: '#E14924', fontSize: '11px', fontWeight: 500, letterSpacing: '0.5px',
            transition: 'all 0.2s',
          }}
        >
          <FileDown size={13} />
          Exportar PDF
        </button>
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto', position: 'relative' }}>
        {morosos.map((m, i) => (
          <div key={m.cedula || i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(225,73,36,0.15)',
            transition: 'all 0.2s',
          }}>
            <div>
              <p style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>{m.nombre}</p>
              <p style={{ fontSize: '11px', color: '#5A5A5A', marginTop: '3px' }}>
                CC {m.cedula} · {m.meses_mora} mes{m.meses_mora !== 1 ? 'es' : ''} de mora
              </p>
              {m.meses_detalle && (
                <p style={{ fontSize: '11px', color: 'rgba(239,68,68,0.7)', marginTop: '2px' }}>{m.meses_detalle}</p>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontWeight: 700, color: '#EF4444', fontSize: '13px' }}>{formatCOP(m.saldo_total)}</p>
              {m.celular && (
                <a
                  href={`https://wa.me/${codigoPais}${m.celular}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '11px', color: '#5A5A5A', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', textDecoration: 'none' }}
                >
                  <Phone size={11} />
                  {m.celular}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        marginTop: '16px', paddingTop: '12px',
        borderTop: '1px solid rgba(225,73,36,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative',
      }}>
        <span style={{ fontSize: '12px', color: '#5A5A5A' }}>Total en mora</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#EF4444' }}>
          {formatCOP(totalSaldo)}
        </span>
      </div>
    </div>
  );
}
