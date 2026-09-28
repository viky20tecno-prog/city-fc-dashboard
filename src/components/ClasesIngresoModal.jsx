import { useMemo, useState } from 'react';
import { X, UserPlus, Loader2, Check, CalendarDays } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';
import {
  TIPO_INGRESO, CLASES_POR_JUGADOR, DIAS_JUGADOR_NUEVO,
  jugadoresSinIngreso, entrenamientosDelEquipo, clasesDeJugador,
} from '../lib/clasesIngreso';

const fechaLarga = (iso) => new Date(iso).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const diasDesde = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

// Agenda las 2 primeras clases de los jugadores recién inscritos: por cada uno propone los
// próximos entrenamientos de su equipo y crea eventos CLASE_INGRESO (convocados = [cedula])
// en esas mismas fechas, horas y lugar. Si el equipo no tiene entrenamientos agendados, se
// eligen fecha y hora a mano.
export default function ClasesIngresoModal({ jugadores, eventos, clubId, color, onClose, onAgendado }) {
  const pendientes = useMemo(() => jugadoresSinIngreso(jugadores, eventos), [jugadores, eventos]);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[88vh] overflow-y-auto bg-[var(--bg-card)] sm:rounded-2xl border border-[var(--cc30)] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-[var(--bg-card)] flex items-center justify-between gap-3 p-5 border-b border-[var(--cc30)]">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-pri)]"><UserPlus size={18} style={{ color }} /> Clases de ingreso</h2>
            <p className="text-xs text-[var(--text-sec)] mt-0.5">Las {CLASES_POR_JUGADOR} primeras clases de los jugadores inscritos en los últimos {DIAS_JUGADOR_NUEVO} días</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-[var(--text-pri)]" aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          {pendientes.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-mut)]">
              <Check size={32} className="mx-auto mb-2 text-[#22C55E]" />
              <p className="text-sm">Todos los jugadores nuevos ya tienen sus clases de ingreso agendadas.</p>
            </div>
          ) : pendientes.map(({ jugador, agendadas }) => (
            <TarjetaJugador key={jugador.cedula} jugador={jugador} agendadas={agendadas} eventos={eventos}
              clubId={clubId} color={color} onAgendado={onAgendado} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TarjetaJugador({ jugador, agendadas, eventos, clubId, color, onAgendado }) {
  const faltan = CLASES_POR_JUGADOR - agendadas;
  const yaAgendadas = clasesDeJugador(jugador.cedula, eventos);
  const opciones = useMemo(() => {
    const ocupadas = new Set(yaAgendadas.map(e => e.fecha_inicio));
    return entrenamientosDelEquipo(jugador, eventos).filter(e => !ocupadas.has(e.fecha_inicio));
  }, [jugador, eventos, yaAgendadas]);
  const manual = opciones.length === 0;

  // `null` = sin tocar: se usa la sugerencia calculada con los eventos ACTUALES (el modal
  // puede abrirse antes de que termine de cargar el calendario y la sugerencia inicial
  // saldría vacía). Al primer cambio del admin queda su elección.
  const [elegidasManual, setElegidasManual] = useState(null);
  const elegidas = elegidasManual ?? opciones.slice(0, faltan).map(e => e.id);
  const setElegidas = (fn) => setElegidasManual(fn(elegidas));
  const [manuales, setManuales] = useState(() => Array.from({ length: faltan }, () => ({ fecha: '', hora: '16:00' })));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const nombre = `${jugador.nombre} ${jugador.apellidos || ''}`.trim();
  const listo = manual ? manuales.every(m => m.fecha && m.hora) : elegidas.length === faltan && new Set(elegidas).size === faltan && elegidas.every(Boolean);

  const agendar = async () => {
    setGuardando(true); setError('');
    try {
      const bases = manual
        ? manuales.map(m => {
            const inicio = new Date(`${m.fecha}T${m.hora}`);
            return { fecha_inicio: inicio.toISOString(), fecha_fin: new Date(inicio.getTime() + 90 * 60000).toISOString(), lugar: null };
          })
        : elegidas.map(id => { const e = opciones.find(o => o.id === id); return { fecha_inicio: e.fecha_inicio, fecha_fin: e.fecha_fin, lugar: e.lugar }; });
      bases.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
      for (const [i, b] of bases.entries()) {
        const numero = agendadas + i + 1;
        const r = await authFetch(`${API_BASE_URL}/calendario?club_id=${clubId}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: TIPO_INGRESO,
            titulo: `${numero}ª clase de ingreso · ${nombre}`,
            descripcion: `Clase ${numero} de ${CLASES_POR_JUGADOR} del jugador nuevo (${jugador.equipo || jugador.categoria || 'sin equipo'})`,
            equipo: jugador.equipo || jugador.categoria || null,
            convocados: [String(jugador.cedula)],
            ...b,
          }),
        });
        const d = await r.json();
        if (!d.success) throw new Error(d.error || 'No se pudo agendar');
      }
      onAgendado();
    } catch (e) {
      setError(e.message);
      setGuardando(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--cc30)] bg-[var(--bg-surface)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-pri)] break-words">{nombre}</p>
          <p className="text-xs text-[var(--text-mut)]">{jugador.equipo || jugador.categoria || 'Sin equipo'} · inscrito hace {diasDesde(jugador.created_at)} día{diasDesde(jugador.created_at) === 1 ? '' : 's'}</p>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[var(--cc30)] text-[var(--text-sec)] shrink-0">{agendadas}/{CLASES_POR_JUGADOR} agendadas</span>
      </div>

      {yaAgendadas.map((e, i) => (
        <p key={e.id} className="text-xs text-[var(--text-sec)] flex items-center gap-1.5"><Check size={12} className="text-[#22C55E]" /> {i + 1}ª clase: {fechaLarga(e.fecha_inicio)}</p>
      ))}

      {manual ? (
        <>
          <p className="text-xs text-[#F59E0B]">Su equipo no tiene entrenamientos próximos en el calendario — elige fecha y hora.</p>
          {manuales.map((m, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--text-sec)] w-14 shrink-0">{agendadas + i + 1}ª clase</span>
              <input type="date" value={m.fecha} onChange={e => setManuales(ms => ms.map((x, j) => j === i ? { ...x, fecha: e.target.value } : x))}
                className="flex-1 min-w-[140px] bg-[var(--bg-app)] border border-[var(--cc30)] rounded-lg px-2 py-1.5 text-sm text-[var(--text-pri)]" style={{ colorScheme: 'dark' }} />
              <input type="time" value={m.hora} onChange={e => setManuales(ms => ms.map((x, j) => j === i ? { ...x, hora: e.target.value } : x))}
                className="w-28 bg-[var(--bg-app)] border border-[var(--cc30)] rounded-lg px-2 py-1.5 text-sm text-[var(--text-pri)]" style={{ colorScheme: 'dark' }} />
            </div>
          ))}
        </>
      ) : (
        Array.from({ length: faltan }).map((_, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-sec)] w-14 shrink-0">{agendadas + i + 1}ª clase</span>
            <select value={elegidas[i] || ''} onChange={e => setElegidas(el => { const n = [...el]; n[i] = e.target.value; return n; })}
              className="flex-1 min-w-0 bg-[var(--bg-app)] border border-[var(--cc30)] rounded-lg px-2 py-1.5 text-sm text-[var(--text-pri)]">
              <option value="">Elegir entrenamiento…</option>
              {opciones.map(o => (
                <option key={o.id} value={o.id} disabled={elegidas.includes(o.id) && elegidas[i] !== o.id}>
                  {fechaLarga(o.fecha_inicio)}{o.lugar ? ` · ${o.lugar}` : ''}
                </option>
              ))}
            </select>
          </div>
        ))
      )}

      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
      <button onClick={agendar} disabled={!listo || guardando} style={{ background: color }}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-40">
        {guardando ? <Loader2 size={15} className="animate-spin" /> : <CalendarDays size={15} />}
        Agendar {faltan === 1 ? 'clase' : `${faltan} clases`}
      </button>
    </div>
  );
}
