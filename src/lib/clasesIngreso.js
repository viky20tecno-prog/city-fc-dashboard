// Clases de ingreso: las 2 primeras clases de cada jugador recién inscrito. Se guardan en
// `calendario` como eventos tipo CLASE_INGRESO con `convocados = [cedula]` (así la toma de
// asistencia de ese evento muestra solo al jugador nuevo). El número de clase (1ª/2ª) no se
// guarda: sale del orden por fecha de los eventos de ese jugador.

export const TIPO_INGRESO = 'CLASE_INGRESO';
export const CLASES_POR_JUGADOR = 2;
export const DIAS_JUGADOR_NUEVO = 30;

const DIA_MS = 86400000;
const esIngreso = (ev) => ev.tipo === TIPO_INGRESO && !ev.suspendido;
const fechaLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Clases de ingreso de un jugador, en orden de fecha.
export function clasesDeJugador(cedula, eventos) {
  return (eventos || [])
    .filter(ev => esIngreso(ev) && (ev.convocados || []).map(String).includes(String(cedula)))
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
}

// Jugadores activos inscritos en los últimos `dias` que todavía no tienen sus 2 clases de
// ingreso agendadas. Más recientes primero.
export function jugadoresSinIngreso(jugadores, eventos, hoy = new Date(), dias = DIAS_JUGADOR_NUEVO) {
  const desde = hoy.getTime() - dias * DIA_MS;
  return (jugadores || [])
    .filter(j => j.activo !== false && j.created_at && new Date(j.created_at).getTime() >= desde)
    .map(j => ({ jugador: j, agendadas: clasesDeJugador(j.cedula, eventos).length }))
    .filter(x => x.agendadas < CLASES_POR_JUGADOR)
    .sort((a, b) => new Date(b.jugador.created_at) - new Date(a.jugador.created_at));
}

// Próximos entrenamientos del equipo del jugador (o de su categoría si no tiene equipo),
// desde hoy — los candidatos para sus clases de ingreso.
export function entrenamientosDelEquipo(jugador, eventos, hoy = new Date(), max = 6) {
  const grupo = jugador.equipo || jugador.categoria;
  if (!grupo) return [];
  return (eventos || [])
    .filter(ev => ev.tipo === 'ENTRENAMIENTO' && !ev.suspendido && ev.equipo === grupo && new Date(ev.fecha_inicio) >= hoy)
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
    .slice(0, max);
}

// Recordatorios para la campanita:
//  - 'manana' / 'hoy': la clase es mañana u hoy (y todavía no pasó)
//  - 'asistencia': la clase ya pasó (hasta hace 3 días) y falta marcar si el jugador fue
//    (`asistenciaPorEvento[evId]` = estado del jugador en esa clase, si ya se marcó)
export function recordatoriosIngreso(eventos, jugadores, hoy = new Date(), asistenciaPorEvento = {}) {
  const porCedula = Object.fromEntries((jugadores || []).map(j => [String(j.cedula), j]));
  const hoyStr = fechaLocal(hoy);
  const mananaStr = fechaLocal(new Date(hoy.getTime() + DIA_MS));
  const hace3 = hoy.getTime() - 3 * DIA_MS;
  const out = [];
  (eventos || []).filter(esIngreso).forEach(ev => {
    const cedula = String((ev.convocados || [])[0] || '');
    const jugador = porCedula[cedula];
    if (!jugador) return;
    const numero = clasesDeJugador(cedula, eventos).findIndex(e => e.id === ev.id) + 1;
    const inicio = new Date(ev.fecha_inicio);
    const dia = fechaLocal(inicio);
    const base = { id: ev.id, evento: ev, jugador, numero, inicio };
    if (inicio >= hoy && dia === hoyStr) out.push({ ...base, cuando: 'hoy' });
    else if (dia === mananaStr) out.push({ ...base, cuando: 'manana' });
    else if (inicio < hoy && inicio.getTime() >= hace3) {
      const estado = asistenciaPorEvento[ev.id];
      if (!estado || estado === 'PENDIENTE') out.push({ ...base, cuando: 'asistencia' });
    }
  });
  const orden = { hoy: 0, manana: 1, asistencia: 2 };
  return out.sort((a, b) => orden[a.cuando] - orden[b.cuando] || a.inicio - b.inicio);
}
