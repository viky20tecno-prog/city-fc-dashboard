import { AlertCircle, Phone, FileDown } from 'lucide-react';
import { formatMoney, getCodigoPais } from '../lib/formatMoney';

const formatCOP = (n) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(parseInt(n) || 0);

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function exportarPDF(morosos, clubNombre = 'Mi Club', color = 'var(--cc)', logoUrl = '') {
  const fecha      = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  const mesActual  = new Date().toLocaleString('es-CO', { month: 'long', year: 'numeric' });
  const totalSaldo = morosos.reduce((sum, m) => sum + (parseInt(m.saldo_total) || 0), 0);
  const c          = (typeof color === 'string' && color.startsWith('#')) ? color : '#E14924';

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="" style="height:44px;width:44px;object-fit:contain;border-radius:8px;margin-right:14px;flex-shrink:0" />`
    : '';

  const sorted = [...morosos].sort((a, b) => (a.nombre||'').toUpperCase().localeCompare((b.nombre||'').toUpperCase(), 'es'));
  const filas = sorted.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280">${i + 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600;color:#111">${esc((m.nombre||'').toUpperCase())}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280">${esc(m.cedula)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280">${esc(m.celular) || '—'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center">
        <span style="background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600">
          ${m.meses_mora} mes${m.meses_mora !== 1 ? 'es' : ''}
        </span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#dc2626;line-height:1.5">
        ${m.meses_detalle
          ? m.meses_detalle.split(' · ').map(mes =>
              `<span style="display:inline-block;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:1px 6px;margin:1px 2px;font-size:11px;white-space:nowrap">${esc(mes)}</span>`
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
  <title>Reporte Morosos — ${esc(clubNombre)}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; color: #111; background: #fff; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <!-- Header banda color club -->
  <div style="background:${c};padding:18px 32px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center">
      ${logoHtml}
      <div>
        <p style="font-size:17px;font-weight:800;color:#fff;letter-spacing:-0.3px">${esc(clubNombre)}</p>
        <p style="font-size:11px;color:rgba(255,255,255,0.8);margin-top:2px">ZenSports — Gestión deportiva</p>
      </div>
    </div>
    <div style="text-align:right">
      <p style="font-size:13px;font-weight:700;color:#fff">Reporte de Morosos</p>
      <p style="font-size:11px;color:rgba(255,255,255,0.8);margin-top:2px">${mesActual} · Generado: ${fecha}</p>
    </div>
  </div>

  <!-- Cuerpo -->
  <div style="padding:28px 32px">
    <!-- Resumen -->
    <div style="display:flex;gap:14px;margin-bottom:24px">
      <div style="flex:1;border:1px solid #e5e7eb;border-radius:10px;padding:16px;text-align:center;border-top:3px solid #dc2626">
        <p style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">En mora</p>
        <p style="font-size:30px;font-weight:800;color:#dc2626">${morosos.length}</p>
      </div>
      <div style="flex:1;border:1px solid #e5e7eb;border-radius:10px;padding:16px;text-align:center;border-top:3px solid ${c}">
        <p style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Total a cobrar</p>
        <p style="font-size:26px;font-weight:800;color:${c}">${formatCOP(totalSaldo)}</p>
      </div>
      <div style="flex:1;border:1px solid #e5e7eb;border-radius:10px;padding:16px;text-align:center;border-top:3px solid #16a34a">
        <p style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Promedio/jugador</p>
        <p style="font-size:26px;font-weight:800;color:#16a34a">${formatCOP(morosos.length ? Math.round(totalSaldo / morosos.length) : 0)}</p>
      </div>
    </div>

    <!-- Tabla -->
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:${c};font-weight:700;border-bottom:2px solid #e5e7eb">#</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:${c};font-weight:700;border-bottom:2px solid #e5e7eb">Jugador</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:${c};font-weight:700;border-bottom:2px solid #e5e7eb">Cédula</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:${c};font-weight:700;border-bottom:2px solid #e5e7eb">Celular</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;color:${c};font-weight:700;border-bottom:2px solid #e5e7eb">Meses</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:${c};font-weight:700;border-bottom:2px solid #e5e7eb">Detalle</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;color:${c};font-weight:700;border-bottom:2px solid #e5e7eb">Saldo</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot>
        <tr style="background:#f9fafb">
          <td colspan="6" style="padding:12px;font-size:13px;font-weight:700;text-align:right;border-top:2px solid #e5e7eb;color:#374151">Total a cobrar</td>
          <td style="padding:12px;font-size:14px;font-weight:800;color:#dc2626;text-align:right;border-top:2px solid #e5e7eb">${formatCOP(totalSaldo)}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Footer -->
    <div style="margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">
      <p style="font-size:10px;color:#9ca3af">${clubNombre} · Documento confidencial — no compartir públicamente</p>
      <p style="font-size:10px;color:#9ca3af">zensports.zenpra.ai</p>
    </div>
  </div>

  <div class="no-print" style="padding:0 32px 28px;text-align:center">
    <button onclick="window.print()" style="background:${c};color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">
      Imprimir / Guardar PDF
    </button>
  </div>
</body>
</html>`;

  const ventana = window.open('', '_blank');
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
}

export default function MorososList({ morosos, codigoPais = '57', clubNombre = 'Mi Club', color = 'var(--cc)', logoUrl = '' }) {
  if (!morosos || morosos.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)', borderRadius: '16px',
        border: '1px solid var(--cc20)', padding: '24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--cc50), transparent)',
          pointerEvents: 'none',
        }} />
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-pri)', marginBottom: '16px' }}>Morosos</h2>
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-mut)' }}>
          <AlertCircle style={{ width: '32px', height: '32px', margin: '0 auto 8px', color: '#22C55E' }} />
          ¡Sin morosos!
        </div>
      </div>
    );
  }

  const totalSaldo = morosos.reduce((sum, m) => sum + (parseInt(m.saldo_total) || 0), 0);

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: '16px',
      border: '1px solid var(--cc20)', padding: '24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--cc50), transparent)',
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
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-pri)', letterSpacing: '-0.2px' }}>Morosos</h2>
          <span style={{
            padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
            background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            {morosos.length} jugadores
          </span>
        </div>
        <button
          onClick={() => exportarPDF(morosos, clubNombre, color, logoUrl)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
            border: '1px solid var(--cc30)', background: 'var(--cc12)',
            color: 'var(--cc)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.5px',
            transition: 'background-color 0.2s, border-color 0.2s',
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
            border: '1px solid var(--cc20)',
            transition: 'background-color 0.2s',
          }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-pri)', fontSize: '13px' }}>{m.nombre}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-mut)', marginTop: '3px' }}>
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
                  style={{ fontSize: '11px', color: 'var(--text-mut)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', textDecoration: 'none' }}
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
        borderTop: '1px solid var(--cc20)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative',
      }}>
        <span style={{ fontSize: '12px', color: 'var(--text-mut)' }}>Total en mora</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#EF4444' }}>
          {formatCOP(totalSaldo)}
        </span>
      </div>
    </div>
  );
}
