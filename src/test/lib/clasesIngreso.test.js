import { describe, it, expect } from 'vitest';
import { jugadoresSinIngreso, entrenamientosDelEquipo, recordatoriosIngreso, clasesDeJugador } from '../../lib/clasesIngreso';

const hoy = new Date('2026-09-28T14:00:00-05:00');
const jug = (cedula, creado, extra = {}) => ({ cedula, nombre: 'N' + cedula, apellidos: 'A', equipo: 'SUB-9 A', activo: true, created_at: creado, ...extra });
const ingreso = (id, cedula, fecha) => ({ id, tipo: 'CLASE_INGRESO', convocados: [cedula], fecha_inicio: fecha, equipo: 'SUB-9 A' });
const entreno = (id, fecha, equipo = 'SUB-9 A', extra = {}) => ({ id, tipo: 'ENTRENAMIENTO', equipo, fecha_inicio: fecha, ...extra });

describe('clasesIngreso', () => {
  it('lista inscritos de los últimos 30 días a los que les faltan clases, más recientes primero', () => {
    const jugadores = [
      jug('1', '2026-09-20T10:00:00Z'),                    // nuevo, sin clases
      jug('2', '2026-09-25T10:00:00Z'),                    // nuevo, con 1 clase
      jug('3', '2026-09-10T10:00:00Z'),                    // nuevo, con 2 clases → fuera
      jug('4', '2026-07-01T10:00:00Z'),                    // viejo → fuera
      jug('5', '2026-09-26T10:00:00Z', { activo: false }), // archivado → fuera
    ];
    const eventos = [ingreso('a', '2', '2026-09-30T21:00:00Z'), ingreso('b', '3', '2026-09-12T21:00:00Z'), ingreso('c', '3', '2026-09-15T21:00:00Z')];
    const r = jugadoresSinIngreso(jugadores, eventos, hoy);
    expect(r.map(x => [x.jugador.cedula, x.agendadas])).toEqual([['2', 1], ['1', 0]]);
  });

  it('sugiere los próximos entrenamientos del equipo, sin suspendidos ni pasados', () => {
    const eventos = [
      entreno('p', '2026-09-27T21:00:00Z'),
      entreno('s', '2026-09-29T21:00:00Z', 'SUB-9 A', { suspendido: true }),
      entreno('x', '2026-09-30T21:00:00Z', 'SUB-11 A'),
      entreno('b', '2026-10-02T21:00:00Z'),
      entreno('a', '2026-09-30T21:00:00Z'),
    ];
    expect(entrenamientosDelEquipo(jug('1', '2026-09-20'), eventos, hoy).map(e => e.id)).toEqual(['a', 'b']);
  });

  it('numera las clases por fecha', () => {
    const eventos = [ingreso('dos', '1', '2026-10-02T21:00:00Z'), ingreso('uno', '1', '2026-09-30T21:00:00Z')];
    expect(clasesDeJugador('1', eventos).map(e => e.id)).toEqual(['uno', 'dos']);
  });

  it('recordatorios: hoy, mañana y asistencia pendiente de una clase pasada', () => {
    const jugadores = [jug('1', '2026-09-20'), jug('2', '2026-09-20'), jug('3', '2026-09-20')];
    const eventos = [
      ingreso('hoy', '1', '2026-09-28T16:00:00-05:00'),
      ingreso('man', '2', '2026-09-29T16:00:00-05:00'),
      ingreso('ayer', '3', '2026-09-27T16:00:00-05:00'),
      ingreso('ayer-ok', '1', '2026-09-26T16:00:00-05:00'),
      ingreso('lejos', '2', '2026-10-10T16:00:00-05:00'),
    ];
    const r = recordatoriosIngreso(eventos, jugadores, hoy, { 'ayer-ok': 'PRESENTE' });
    expect(r.map(x => [x.id, x.cuando, x.numero])).toEqual([['hoy', 'hoy', 2], ['man', 'manana', 1], ['ayer', 'asistencia', 1]]);
  });
});
