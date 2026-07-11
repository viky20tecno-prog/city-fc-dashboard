import { useState } from 'react';
import { X, Users, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * Modal de confirmación que aparece al cambiar el valor de mensualidad del club
 * cuando hay jugadores con beca/descuento activo con mensualidades pendientes.
 * Permite revisar/editar el valor final de cada uno (precargado preservando su %
 * actual) o aplicar un mismo valor a todos de una vez.
 */
export default function ModalDescuentosAfectados({ color = '#E14924', becados, onClose, onConfirm }) {
  const c = color;
  const [rows, setRows] = useState(
    becados.map(b => ({ ...b, valor_final: b.valor_sugerido }))
  );
  const [bulkValue, setBulkValue] = useState('');
  const [applying, setApplying] = useState(false);

  const setRowValue = (cedula, val) => {
    setRows(rs => rs.map(r => r.cedula === cedula ? { ...r, valor_final: Math.max(0, Number(val) || 0) } : r));
  };

  const aplicarATodos = () => {
    const val = Math.max(0, Number(bulkValue) || 0);
    setRows(rs => rs.map(r => ({ ...r, valor_final: val })));
  };

  const handleConfirm = async () => {
    setApplying(true);
    try {
      await onConfirm(rows.map(r => ({ cedula: r.cedula, valor_oficial: r.valor_final })));
    } finally {
      setApplying(false);
    }
  };

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '7px 10px',
    color: '#fff', fontSize: 12.5, outline: 'none',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 700,
        background: 'rgba(4,6,12,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: '#0D1627', borderRadius: 18,
        border: `1px solid ${c}30`,
        boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 48px ${c}12`,
        width: '100%', maxWidth: 560, maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} color={c} strokeWidth={1.8} />
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>Jugadores con beca/descuento</p>
                <p style={{ color: '#8B95A3', fontSize: 11, margin: '2px 0 0' }}>
                  {rows.length} jugador{rows.length !== 1 ? 'es' : ''} con condición especial, no se tocan automáticamente
                </p>
              </div>
            </div>
            <button onClick={onClose} disabled={applying} style={{ background: 'none', border: 'none', color: '#8B95A3', cursor: 'pointer', padding: 4 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 22px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          <p style={{ fontSize: 12, color: '#8B95A3', margin: 0, lineHeight: 1.6 }}>
            El nuevo valor de mensualidad del club <strong>no se aplica</strong> a estos jugadores para no pisar su beneficio.
            Define el valor mensual que debe pagar cada uno, o aplica el mismo valor a todos.
          </p>

          {/* Aplicar a todos */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', background: `${c}0d`, border: `1px solid ${c}30`, borderRadius: 10 }}>
            <input type="number" min={0} step={1000} placeholder="Valor mensual para todos"
              value={bulkValue} onChange={e => setBulkValue(e.target.value)}
              style={{ ...inp, flex: 1 }} />
            <button type="button" onClick={aplicarATodos} disabled={!bulkValue}
              style={{
                padding: '7px 14px', background: c, border: 'none', borderRadius: 8,
                color: '#fff', fontSize: 12, fontWeight: 700, cursor: bulkValue ? 'pointer' : 'not-allowed',
                opacity: bulkValue ? 1 : 0.5, whiteSpace: 'nowrap',
              }}>
              Aplicar a todos
            </button>
          </div>

          {/* Lista de jugadores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map(r => {
              return (
                <div key={r.cedula} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.nombre || r.cedula}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#8B95A3' }}>
                      {r.tipo_descuento} · hoy ${Number(r.valor_actual).toLocaleString('es-CO')}/mes ({r.descuento_pct}% desc.)
                    </p>
                  </div>
                  <div style={{ width: 130, flexShrink: 0 }}>
                    <input type="number" min={0} step={1000}
                      value={r.valor_final}
                      onChange={e => setRowValue(r.cedula, e.target.value)}
                      style={inp} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onClose} disabled={applying}
            style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#8B95A3', fontSize: 13, cursor: applying ? 'not-allowed' : 'pointer', fontWeight: 500 }}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={applying}
            style={{
              padding: '9px 22px', background: c, border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: applying ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 7, opacity: applying ? 0.7 : 1,
              boxShadow: `0 4px 16px ${c}40`,
            }}>
            {applying ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={14} />}
            {applying ? 'Aplicando…' : `Confirmar y aplicar (${rows.length})`}
          </button>
        </div>

      </div>
    </div>
  );
}
