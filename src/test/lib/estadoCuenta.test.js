import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { construirIndiceCuenta, estadoCuenta, saldoTotal, badgeEstado } from '../../lib/estadoCuenta';
import moraVectors from '../fixtures/mora-vectors.json';

const CEDULA = '1001';
const jugador = { cedula: CEDULA };

function indice({ mensualidades = [], suspensiones = [] }) {
  return construirIndiceCuenta({ mensualidades, suspensiones });
}

function mens(numero_mes, estado, saldo_pendiente, anio = 2026) {
  return { cedula: CEDULA, anio, numero_mes, estado, saldo_pendiente };
}

describe('estadoCuenta', () => {
  it('suma el saldo de los meses causados, sin importar el estado individual', () => {
    const idx = indice({ mensualidades: [mens(1, 'MORA', 50000), mens(2, 'PENDIENTE', 30000)] });
    const r = estadoCuenta(jugador, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.saldoMensualidades).toBe(80000);
  });

  it('ignora meses futuros del año en curso (aún no facturados)', () => {
    const idx = indice({ mensualidades: [mens(3, 'PENDIENTE', 30000)] });
    const r = estadoCuenta(jugador, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.saldoMensualidades).toBe(0);
    expect(r.meses.find(m => m.numeroMes === 3).causado).toBe(false);
  });

  it('el saldo NO excluye los meses dentro de los días de gracia (Fork C del ADR)', () => {
    const idx = indice({ mensualidades: [mens(2, 'PENDIENTE', 30000)] });
    const clubConfig = { dias_gracia_mora: 7 };
    // día 3 del mes 2 → dentro de gracia, pero el saldo igual debe sumar
    const r = estadoCuenta(jugador, idx, clubConfig, { anio: 2026, mesActual: 2, diaHoy: 3 });
    expect(r.saldoMensualidades).toBe(30000);
    expect(r.mesesEnMora).toEqual([]); // la gracia sí excluye el mes de mesesEnMora
  });

  it('un mes PENDIENTE del mes actual pasa a mesesEnMora solo después de la gracia', () => {
    const idx = indice({ mensualidades: [mens(2, 'PENDIENTE', 30000)] });
    const clubConfig = { dias_gracia_mora: 7 };
    const dentro = estadoCuenta(jugador, idx, clubConfig, { anio: 2026, mesActual: 2, diaHoy: 7 });
    const fuera  = estadoCuenta(jugador, idx, clubConfig, { anio: 2026, mesActual: 2, diaHoy: 8 });
    expect(dentro.mesesEnMora).toEqual([]);
    expect(fuera.mesesEnMora).toEqual([2]);
  });

  it('un mes PARCIAL del mes actual nunca cuenta como mora, aunque pase la gracia', () => {
    const idx = indice({ mensualidades: [mens(2, 'PARCIAL', 10000)] });
    const clubConfig = { dias_gracia_mora: 7 };
    const r = estadoCuenta(jugador, idx, clubConfig, { anio: 2026, mesActual: 2, diaHoy: 20 });
    expect(r.mesesEnMora).toEqual([]);
  });

  it('un mes anterior sin pagar siempre cuenta como mora, gracia o no', () => {
    const idx = indice({ mensualidades: [mens(1, 'PENDIENTE', 30000)] });
    const clubConfig = { dias_gracia_mora: 30 };
    const r = estadoCuenta(jugador, idx, clubConfig, { anio: 2026, mesActual: 2, diaHoy: 1 });
    expect(r.mesesEnMora).toEqual([1]);
  });

  it('los meses suspendidos no cuentan ni para el saldo ni para la mora', () => {
    const idx = indice({
      mensualidades: [mens(1, 'PENDIENTE', 30000)],
      suspensiones: [{ cedula: CEDULA, activa: true, anio: 2026, mes_inicio: 1, mes_fin: 2 }],
    });
    const r = estadoCuenta(jugador, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.saldoMensualidades).toBe(0);
    expect(r.mesesEnMora).toEqual([]);
    expect(r.meses[0].suspendido).toBe(true);
  });

  it('una suspensión no activa (cancelada) no excusa el mes', () => {
    const idx = indice({
      mensualidades: [mens(1, 'PENDIENTE', 30000)],
      suspensiones: [{ cedula: CEDULA, activa: false, anio: 2026, mes_inicio: 1, mes_fin: 2 }],
    });
    const r = estadoCuenta(jugador, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.saldoMensualidades).toBe(30000);
  });

  it('estado = MORA cuando hay al menos un mes en mesesEnMora', () => {
    const idx = indice({ mensualidades: [mens(1, 'PENDIENTE', 30000), mens(2, 'PARCIAL', 5000)] });
    const r = estadoCuenta(jugador, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.estado).toBe('MORA');
  });

  it('sin mora, el estado es el peor entre los meses causados no suspendidos', () => {
    const idx = indice({ mensualidades: [mens(1, 'AL_DIA', 0), mens(2, 'PARCIAL', 5000)] });
    const r = estadoCuenta(jugador, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 3 });
    expect(r.estado).toBe('PARCIAL');
  });

  it('sin ninguna mensualidad causada, el estado es SIN_DATOS', () => {
    const idx = indice({ mensualidades: [] });
    const r = estadoCuenta(jugador, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.estado).toBe('SIN_DATOS');
    expect(r.saldoMensualidades).toBe(0);
  });

  it('un jugador con 100% de descuento siempre es exento, sin importar sus mensualidades', () => {
    const idx = indice({ mensualidades: [mens(1, 'MORA', 50000)] });
    const r = estadoCuenta({ cedula: CEDULA, descuento_pct: 100 }, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.exento).toBe(true);
    expect(r.estado).toBe('AL_DIA');
    expect(r.mesesEnMora).toEqual([]);
  });
});

// Vectores compartidos byte-a-byte con api/services/__fixtures__/mora-vectors.json.
// El mismo archivo se corre allá contra api/services/mora.js. Si el criterio de mora
// se toca en un solo repo, el checksum o algún vector falla.
describe('mora-vectors.json (espejo de api/services/mora.js)', () => {
  it('el archivo no se editó sin recalcular el checksum', () => {
    const suma = 'sha256:' + createHash('sha256').update(JSON.stringify(moraVectors.vectores)).digest('hex');
    expect(suma).toBe(moraVectors.checksum);
  });

  moraVectors.vectores.forEach(v => {
    it(`mesesEnMora — ${v.nombre}`, () => {
      const idx = construirIndiceCuenta({ mensualidades: v.mensualidades, suspensiones: v.suspensiones });
      const r = estadoCuenta({ cedula: v.cedula }, idx, { dias_gracia_mora: 7 }, {
        anio: v.anio,
        mesActual: v.mesActual,
        diaHoy: v.pastGracePeriod ? 20 : 1,
      });
      expect(r.mesesEnMora).toEqual(v.esperado);
    });
  });
});

describe('saldoTotal (capa 2 — mensualidades + torneos + uniformes)', () => {
  function idx2({ mensualidades = [], suspensiones = [], torneos = [], pedidosUniformes = [] }) {
    return construirIndiceCuenta({ mensualidades, suspensiones, torneos, pedidosUniformes });
  }

  it('suma mensualidades + torneos + uniformes', () => {
    const idx = idx2({
      mensualidades: [mens(1, 'MORA', 50000)],
      torneos: [{ cedula: CEDULA, nombre_torneo: 'Copa', estado: 'PENDIENTE', saldo_pendiente: 20000 }],
      pedidosUniformes: [{ cedula: CEDULA, total: 90000, valor_pagado: 30000 }],
    });
    const r = saldoTotal(jugador, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.saldoMensualidades).toBe(50000);
    expect(r.saldoTorneos).toBe(20000);
    expect(r.saldoUniformes).toBe(60000);
    expect(r.uniformesPagado).toBe(30000);
    expect(r.saldoTotal).toBe(130000);
  });

  it('sin torneos ni uniformes, saldoTotal == saldoMensualidades', () => {
    const idx = idx2({ mensualidades: [mens(1, 'PENDIENTE', 30000)] });
    const r = saldoTotal(jugador, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.saldoTorneos).toBe(0);
    expect(r.saldoUniformes).toBe(0);
    expect(r.saldoTotal).toBe(30000);
  });

  it('un pedido de uniformes ya pagado no suma saldo (nunca negativo)', () => {
    const idx = idx2({ pedidosUniformes: [{ cedula: CEDULA, total: 50000, valor_pagado: 80000 }] });
    const r = saldoTotal(jugador, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.saldoUniformes).toBe(0);
  });

  it('acumula varios pedidos de uniformes de la misma cédula', () => {
    const idx = idx2({
      pedidosUniformes: [
        { cedula: CEDULA, total: 40000, valor_pagado: 10000 },
        { cedula: CEDULA, total: 30000, valor_pagado: 0 },
      ],
    });
    const r = saldoTotal(jugador, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.saldoUniformes).toBe(60000);
    expect(r.uniformesPagado).toBe(10000);
  });

  it('el exento (100% descuento) sigue debiendo torneos/uniformes (cargos aparte)', () => {
    // El backend deja las mensualidades del exento en EXENTO / saldo 0; torneos y
    // uniformes son cargos independientes y no los condona el descuento.
    const idx = idx2({
      mensualidades: [mens(1, 'EXENTO', 0)],
      torneos: [{ cedula: CEDULA, nombre_torneo: 'Copa', estado: 'MORA', saldo_pendiente: 20000 }],
      pedidosUniformes: [{ cedula: CEDULA, total: 90000, valor_pagado: 0 }],
    });
    const r = saldoTotal({ cedula: CEDULA, descuento_pct: 100 }, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.exento).toBe(true);
    expect(r.saldoMensualidades).toBe(0);
    expect(r.saldoTorneos).toBe(20000);
    expect(r.saldoUniformes).toBe(90000);
    expect(r.saldoTotal).toBe(110000);
  });

  it('varias filas del mismo torneo: la última gana (no se suman duplicados)', () => {
    const idx = idx2({
      torneos: [
        { cedula: CEDULA, nombre_torneo: 'Copa', estado: 'PENDIENTE', saldo_pendiente: 20000 },
        { cedula: CEDULA, nombre_torneo: 'Copa', estado: 'AL_DIA', saldo_pendiente: 0 },
      ],
    });
    const r = saldoTotal(jugador, idx, {}, { anio: 2026, mesActual: 2, diaHoy: 15 });
    expect(r.saldoTorneos).toBe(0);
  });
});

describe('badgeEstado', () => {
  it('devuelve label/bg/text/dot para cada estado conocido', () => {
    ['AL_DIA', 'PARCIAL', 'PENDIENTE', 'MORA', 'POR_VALIDAR', 'NO_APLICA'].forEach(estado => {
      const b = badgeEstado(estado);
      expect(b).toHaveProperty('label');
      expect(b).toHaveProperty('bg');
      expect(b).toHaveProperty('text');
      expect(b).toHaveProperty('dot');
    });
  });

  it('cae en un badge neutro para un estado desconocido (p.ej. SIN_DATOS)', () => {
    const b = badgeEstado('SIN_DATOS');
    expect(b.label).toBe('SIN_DATOS');
  });
});
