import { useState } from 'react';
import { X, Tag, Plus, Check, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import { API_BASE_URL } from '../config';
import { getClubId } from '../services/api';
import { normalizarCategorias } from '../lib/categorias';

const SUGERENCIAS = ['Benjamín', 'Infantil', 'Pre-juvenil', 'Juvenil', 'Sub-17', 'Sub-20', 'Mayores', 'Veteranos', 'Femenino'];

export default function CategoriasJugadoresModal({ categorias: inicial = [], onClose, onSaved }) {
  const [categorias, setCategorias] = useState(() => normalizarCategorias(inicial));
  const [nueva,       setNueva]      = useState('');
  const [expandida,   setExpandida]  = useState(null);
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  const [guardando,   setGuardando]  = useState(false);
  const [guardado,    setGuardado]   = useState(false);

  const nombresActuales = categorias.map(c => c.nombre);

  const agregarCategoria = (nombre) => {
    const trimmed = nombre.trim();
    if (!trimmed || nombresActuales.includes(trimmed)) return;
    setCategorias(prev => [...prev, { nombre: trimmed, equipos: [trimmed] }]);
    setNueva('');
  };

  const eliminarCategoria = (idx) => {
    setCategorias(prev => prev.filter((_, i) => i !== idx));
    setExpandida(null);
  };

  const agregarEquipo = (catIdx) => {
    const trimmed = nuevoEquipo.trim();
    if (!trimmed) return;
    setCategorias(prev => prev.map((c, i) => {
      if (i !== catIdx) return c;
      if (c.equipos.includes(trimmed)) return c;
      return { ...c, equipos: [...c.equipos, trimmed] };
    }));
    setNuevoEquipo('');
  };

  const eliminarEquipo = (catIdx, eqIdx) => {
    setCategorias(prev => prev.map((c, i) => {
      if (i !== catIdx) return c;
      const nuevosEquipos = c.equipos.filter((_, j) => j !== eqIdx);
      return { ...c, equipos: nuevosEquipos.length ? nuevosEquipos : c.equipos };
    }));
  };

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

  const disponibles = SUGERENCIAS.filter(s => !nombresActuales.includes(s));

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999,
               display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={!guardando ? onClose : undefined}
    >
      <div
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)',
                 borderRadius: 18, width: '100%', maxWidth: 520,
                 maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-sub)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--cc12)', border: '1px solid var(--cc20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={16} color="var(--cc)" />
            </div>
            <div>
              <div style={{ color: 'var(--text-pri)', fontWeight: 600, fontSize: 14 }}>Categorías y Equipos</div>
              <div style={{ color: 'var(--text-mut)', fontSize: 11 }}>Organiza jugadores por categoría y equipo</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)', padding: 4 }}>
            <X size={17} />
          </button>
        </div>

        {/* Body scrollable */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto', flex: 1 }}>

          {/* Lista de categorías */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-sec)', marginBottom: 10 }}>
              Categorías configuradas ({categorias.length})
            </div>
            {categorias.length === 0 ? (
              <div style={{ padding: '14px', borderRadius: 10, background: 'var(--bg-card)', border: '1px dashed var(--border-sub)', textAlign: 'center', color: 'var(--text-mut)', fontSize: 13 }}>
                Sin categorías — agrega la primera abajo
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categorias.map((cat, catIdx) => {
                  const estaExpandida = expandida === catIdx;
                  return (
                    <div key={catIdx} style={{ borderRadius: 12, border: '1px solid var(--cc20)', overflow: 'hidden' }}>
                      {/* Fila categoría */}
                      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'var(--cc12)', gap: 8 }}>
                        <button
                          onClick={() => setExpandida(estaExpandida ? null : catIdx)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cc)', display: 'flex', alignItems: 'center', padding: 2 }}
                        >
                          {estaExpandida
                            ? <ChevronDown size={14} />
                            : <ChevronRight size={14} />}
                        </button>
                        <span style={{ color: 'var(--cc)', fontSize: 13, fontWeight: 700, flex: 1 }}>{cat.nombre}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-mut)', fontSize: 11 }}>
                          <Users size={11} /> {cat.equipos.length} equipo{cat.equipos.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => eliminarCategoria(catIdx)}
                          title="Eliminar categoría"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mut)', padding: 2, display: 'flex', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-mut)'}
                        >
                          <X size={13} />
                        </button>
                      </div>

                      {/* Equipos expandidos */}
                      {estaExpandida && (
                        <div style={{ padding: '10px 14px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {cat.equipos.map((eq, eqIdx) => (
                              <div key={eqIdx} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px 4px 12px', borderRadius: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-sub)', color: 'var(--text-sec)', fontSize: 12 }}>
                                {eq}
                                {cat.equipos.length > 1 && (
                                  <button
                                    onClick={() => eliminarEquipo(catIdx, eqIdx)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-mut)', padding: 0 }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-mut)'}
                                  >
                                    <X size={11} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {/* Añadir equipo */}
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            <input
                              type="text"
                              placeholder={`Ej: ${cat.nombre} A`}
                              value={nuevoEquipo}
                              onChange={e => setNuevoEquipo(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && agregarEquipo(catIdx)}
                              style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-app)', border: '1px solid var(--border-sub)', color: 'var(--text-pri)', fontSize: 12, outline: 'none' }}
                            />
                            <button
                              onClick={() => agregarEquipo(catIdx)}
                              disabled={!nuevoEquipo.trim()}
                              style={{ padding: '6px 12px', borderRadius: 8, background: nuevoEquipo.trim() ? 'var(--cc12)' : 'var(--bg-app)', border: `1px solid ${nuevoEquipo.trim() ? 'var(--cc30)' : 'var(--border-sub)'}`, color: nuevoEquipo.trim() ? 'var(--cc)' : 'var(--text-mut)', cursor: nuevoEquipo.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}
                            >
                              <Plus size={12} /> Equipo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agregar nueva categoría */}
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
                onKeyDown={e => e.key === 'Enter' && agregarCategoria(nueva)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-sub)', color: 'var(--text-pri)', fontSize: 13, outline: 'none' }}
              />
              <button
                onClick={() => agregarCategoria(nueva)}
                disabled={!nueva.trim()}
                style={{ padding: '8px 14px', borderRadius: 10, background: nueva.trim() ? 'var(--cc12)' : 'var(--bg-card)', border: `1px solid ${nueva.trim() ? 'var(--cc30)' : 'var(--border-sub)'}`, color: nueva.trim() ? 'var(--cc)' : 'var(--text-mut)', cursor: nueva.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                <Plus size={14} /> Agregar
              </button>
            </div>
            <p style={{ color: 'var(--text-mut)', fontSize: 11, marginTop: 6 }}>
              Luego expande la categoría para añadir equipos dentro de ella (Sub-17 A, Sub-17 B…)
            </p>
          </div>

          {/* Sugerencias */}
          {disponibles.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-mut)', marginBottom: 7 }}>Sugerencias rápidas:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {disponibles.map(s => (
                  <button
                    key={s}
                    onClick={() => agregarCategoria(s)}
                    style={{ padding: '4px 10px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border-sub)', color: 'var(--text-sec)', fontSize: 11, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
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
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-sub)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border-sub)', background: 'var(--bg-card)', color: 'var(--text-sec)', fontSize: 13, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            style={{ padding: '8px 20px', borderRadius: 10, border: `1px solid ${guardado ? 'rgba(34,197,94,0.35)' : 'var(--cc30)'}`, background: guardado ? 'rgba(34,197,94,0.12)' : 'var(--cc12)', color: guardado ? '#22C55E' : 'var(--cc)', fontSize: 13, fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background-color 0.2s, border-color 0.2s, color 0.2s', opacity: guardando ? 0.7 : 1 }}
          >
            {guardado ? <><Check size={14} /> Guardado</> : guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
