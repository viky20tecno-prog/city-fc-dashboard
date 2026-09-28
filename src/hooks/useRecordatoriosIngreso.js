import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';
import { TIPO_INGRESO, recordatoriosIngreso } from '../lib/clasesIngreso';

const DIA_MS = 86400000;
const REFRESCO_MS = 10 * 60 * 1000;

// Recordatorios de clases de ingreso para la campanita: la de hoy, la de mañana y las que
// ya pasaron (hasta hace 3 días) sin asistencia marcada del jugador nuevo.
export function useRecordatoriosIngreso({ clubId, jugadores, enabled = true }) {
  const [recordatorios, setRecordatorios] = useState([]);

  useEffect(() => {
    if (!enabled || !clubId) return undefined;
    let vivo = true;
    const cargar = async () => {
      try {
        const ahora = new Date();
        const desde = new Date(ahora.getTime() - 3 * DIA_MS).toISOString();
        const hasta = new Date(ahora.getTime() + 2 * DIA_MS).toISOString();
        const r = await authFetch(`${API_BASE_URL}/calendario?club_id=${clubId}&desde=${desde}&hasta=${hasta}`);
        const d = await r.json();
        const eventos = (d.data || []).filter(e => e.tipo === TIPO_INGRESO);
        // Solo para las clases que ya pasaron: ¿se marcó la asistencia del jugador nuevo?
        const pasadas = eventos.filter(e => new Date(e.fecha_inicio) < ahora);
        const asistencia = {};
        await Promise.all(pasadas.map(async e => {
          try {
            const ra = await authFetch(`${API_BASE_URL}/asistencia/${e.id}?club_id=${clubId}`);
            const da = await ra.json();
            const cedula = String((e.convocados || [])[0] || '');
            asistencia[e.id] = (da.data || []).find(x => String(x.cedula) === cedula)?.estado;
          } catch { /* sin dato de asistencia: se recuerda marcarla */ }
        }));
        if (vivo) setRecordatorios(recordatoriosIngreso(eventos, jugadores, new Date(), asistencia));
      } catch { /* la campanita sigue con lo demás */ }
    };
    cargar();
    const t = setInterval(cargar, REFRESCO_MS);
    return () => { vivo = false; clearInterval(t); };
  }, [clubId, jugadores, enabled]);

  return recordatorios;
}
