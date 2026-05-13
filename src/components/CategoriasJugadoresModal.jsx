import { useState } from 'react';
import { X, Tag, Plus, Check } from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import { API_BASE_URL } from '../config';
import { getClubId } from '../services/api';

const SUGERENCIAS = ['Benjamín', 'Infantil', 'Pre-juvenil', 'Juvenil', 'Sub-17', 'Sub-20', 'Mayores', 'Veteranos', 'Femenino'];

export default function CategoriasJugadoresModal({ categorias: inicial = [], onClose, onSaved }) {
  const [categorias, setCategorias] = useState(inicial);
  const [nueva,      setNueva]      = useState('');
  const [guardando,  setGuardando]  = useState(false);
  const [guardado,   setGuardado]   = useState(false);

  const agregar = (cat) => {
    const trimmed = cat.trim();
    if (!trimmed || categorias.includes(trimmed)) return;
    setCategorias(prev => [...prev, trimmed]);
    setNueva('');
  };

  const eliminar = (idx) => setCategorias(prev => prev.filter((_, i) => i !== idx));

  const guardar = async () => {
    setGuardando(true);
    try {
      await authFetch(`${API_BASE_URL}/config?club_id=${getClubId()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categorias_jugadores: categorias }),
      });
      setGuardado(true);
      onSaved?.(categorias);
      setTimeout(onClose, 900);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const disponibles = SUGERENCIAS.filter(s => !categorias.includes(s));

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999,
               display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={!guardando ? onClose : undefined}
    >
      <div
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)',
                 borderRadius: 18, width: '100%', maxWidth: 480,
                 display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-sub)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--cc12)', border: '1px solid var(--cc20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={16} color="var(--cc)" />
            </div>
            <div>
              <div style={{ color: 'var(--text-pri)', fontWeight: 600, fontSize: 14 }}>Categorías de jugadores</div>
              <div style={{ color: 'var(--text-mut)', fontSize: 11 }}>Define las categorías de tu club</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)', padding: 4 }}>
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Categorías actuales */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-sec)', marginBottom: 10 }}>
              Configuradas ({categorias.length})
            </div>
            {categorias.length === 0 ? (
              <div style={{ padding: '14px', borderRadius: 10, background: 'var(--bg-card)', border: '1px dashed var(--border-sub)', textAlign: 'center', color: 'var(--text-mut)', fontSize: 13 }}>
                Sin categorías — agrega la primera abajo
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categorias.map((cat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 12px', borderRadius: 20, background: 'var(--cc12)', border: '1px solid var(--cc30)', color: 'var(--cc)', fontSize: 12, fontWeight: 600 }}>
                    {cat}
                    <button
                      onClick={() => eliminar(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--cc)', opacity: 0.55, padding: 0, lineHeight: 1 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agregar */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-sec)', marginBottom: 8 }}>
              Nueva categoría
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Ej: Sub-15, Mayores, Femenino…"
                value={nueva}
                onChange={e => setNueva(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregar(nueva)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-sub)', color: 'var(--text-pri)', fontSize: 13, outline: 'none' }}
              />
              <button
                onClick={() => agregar(nueva)}
                disabled={!nueva.trim()}
                style={{ padding: '8px 14px', borderRadius: 10, background: nueva.trim() ? 'var(--cc12)' : 'var(--bg-card)', border: `1px solid ${nueva.trim() ? 'var(--cc30)' : 'var(--border-sub)'}`, color: nueva.trim() ? 'var(--cc)' : 'var(--text-mut)', cursor: nueva.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                <Plus size={14} /> Agregar
              </button>
            </div>
          </div>

          {/* Sugerencias */}
          {disponibles.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-mut)', marginBottom: 7 }}>Sugerencias rápidas:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {disponibles.map(s => (
                  <button
                    key={s}
                    onClick={() => agregar(s)}
                    style={{ padding: '4px 10px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border-sub)', color: 'var(--text-sec)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cc30)'; e.currentTarget.style.color = 'var(--cc)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-sub)'; e.currentTarget.style.color = 'var(--text-sec)'; }}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-sub)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border-sub)', background: 'var(--bg-card)', color: 'var(--text-sec)', fontSize: 13, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            style={{ padding: '8px 20px', borderRadius: 10, border: `1px solid ${guardado ? 'rgba(34,197,94,0.35)' : 'var(--cc30)'}`, background: guardado ? 'rgba(34,197,94,0.12)' : 'var(--cc12)', color: guardado ? '#22C55E' : 'var(--cc)', fontSize: 13, fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', opacity: guardando ? 0.7 : 1 }}
          >
            {guardado ? <><Check size={14} /> Guardado</> : guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
