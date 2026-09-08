// Módulo puro — rollup del estado de cuenta del jugador (Capa 1: solo mensualidades).
// Sin red, sin React. El backend sigue siendo dueño del estado/saldo por mes
// (persistido en `invoices`); este módulo solo agrupa y resume.
// Ver dashboard/docs/adr/0001-modulo-estado-de-cuenta.md (local, no en el repo público).
//
// El criterio de "mes en mora" es un espejo intencional de api/services/mora.js —
// el frontend no puede importar del repo de la API. Mantenido en sincronía vía
// src/test/fixtures/mora-vectors.json (copia idéntica en ambos repos, con checksum).

// Mismo ranking que ya usaba JugadoresTable (peorEstado) — no se inventa uno nuevo.
const PRIORIDAD_ESTADO = { MORA: 4, PENDIENTE: 3, PARCIAL: 2, AL_DIA: 1, NO_APLICA: 0, SIN_DATOS: 0 };

const BADGES = {
  AL_DIA:      { label: 'Al día',        bg: 'bg-[rgba(0,208,132,0.12)]',   text: 'text-[#00D084]', dot: 'bg-[#00D084]' },
  PARCIAL:     { label: 'Abono parcial', bg: 'bg-[rgba(74,158,255,0.12)]',  text: 'text-[#4A9EFF]', dot: 'bg-[#4A9EFF]' },
  PENDIENTE:   { label: 'Pendiente',     bg: 'bg-[rgba(245,166,35,0.12)]',  text: 'text-[#F5A623]', dot: 'bg-[#F5A623]' },
  MORA:        { label: 'En mora',       bg: 'bg-[rgba(255,94,94,0.12)]',   text: 'text-[#FF5E5E]', dot: 'bg-[#FF5E5E]' },
  POR_VALIDAR: { label: 'Por validar',   bg: 'bg-[rgba(192,120,255,0.12)]', text: 'text-[#C678FF]', dot: 'bg-[#C678FF]' },
  NO_APLICA:   { label: 'No aplica',     bg: 'bg-[rgba(148,163,184,0.12)]', text: 'text-[#94A3B8]', dot: 'bg-[#94A3B8]' },
};

// Reemplaza config.ESTADO_COLORS + las copias divergentes (migración en Fase B).
export function badgeEstado(estado) {
  return BADGES[estado] || { label: estado || 'Sin datos', bg: 'bg-white/5', text: 'text-[var(--text-sec)]', dot: 'bg-[var(--text-sec)]' };
}

// Agrupa mensualidades/suspensiones (y, para la capa 2, torneos/uniformes) por
// cédula, una vez, para consultarlas O(1) por jugador.
export function construirIndiceCuenta({
  mensualidades = [],
  suspensiones = [],
  torneos = [],
  pedidosUniformes = [],
} = {}) {
  const mensIdx = {};
  mensualidades.forEach(m => {
    const ced = String(m.cedula || m.player_id || '');
    if (!mensIdx[ced]) mensIdx[ced] = [];
    mensIdx[ced].push(m);
  });
  // Clave `anio:mes` — una suspensión de 2025 no debe excusar el mismo mes de 2026.
  // Mismo criterio que api/services/mora.js (isSuspendido cruza también el año).
  const suspIdx = {};
  suspensiones.forEach(s => {
    if (!s.activa) return;
    const ced = String(s.cedula || '');
    const anioS = parseInt(s.anio);
    if (!suspIdx[ced]) suspIdx[ced] = new Set();
    for (let m = s.mes_inicio; m <= s.mes_fin; m++) suspIdx[ced].add(`${anioS}:${m}`);
  });

  // Capa 2 — torneos inscritos por cédula, deduplicados por nombre (última fila gana,
  // mismo criterio que la tabla de Balance previa).
  const torneoIdx = {};
  torneos.forEach(t => {
    const ced = String(t.cedula || t.player_id || '');
    if (!torneoIdx[ced]) torneoIdx[ced] = {};
    torneoIdx[ced][t.nombre_torneo] = {
      nombre: t.nombre_torneo,
      estado: t.estado,
      saldo: parseFloat(t.saldo_pendiente) || 0,
    };
  });

  // Capa 2 — pedidos de uniformes por cédula, acumulados (pagado / saldo).
  const uniformeIdx = {};
  pedidosUniformes.forEach(p => {
    const ced = String(p.cedula || '');
    if (!uniformeIdx[ced]) uniformeIdx[ced] = { pagado: 0, saldo: 0 };
    const total  = parseFloat(p.total)        || 0;
    const pagado = parseFloat(p.valor_pagado) || 0;
    uniformeIdx[ced].pagado += pagado;
    uniformeIdx[ced].saldo  += Math.max(0, total - pagado);
  });

  return { mensIdx, suspIdx, torneoIdx, uniformeIdx };
}

function estaSuspendido(suspIdx, cedula, mesNum, anio) {
  return suspIdx[String(cedula)]?.has(`${anio}:${mesNum}`) || false;
}

// Un mes cuenta como "causado" (ya facturable) solo si es del año actual o anterior,
// y dentro del año actual, solo hasta el mes en curso — los meses futuros aún no se
// facturan y no deben afectar estado ni saldo.
function yaCausado(mensualidad, anioActual, mesActual) {
  const anioM = parseInt(mensualidad.anio) || anioActual;
  const mesM  = parseInt(mensualidad.numero_mes);
  return anioM < anioActual || (anioM === anioActual && mesM <= mesActual);
}

/**
 * Rollup del estado de cuenta de un jugador — Capa 1, solo mensualidades.
 *
 * @param {object} jugador - registro del jugador (usa cedula, descuento_pct).
 * @param {object} indice - salida de construirIndiceCuenta.
 * @param {object} clubConfig - { dias_gracia_mora }.
 * @param {object} [ahora] - { anio, mesActual, diaHoy } inyectables para tests;
 *   en producción se usan por defecto los del reloj real.
 */
export function estadoCuenta(jugador, indice, clubConfig = {}, ahora = {}) {
  const cedula = String(jugador?.cedula || '');
  const hoy    = new Date();
  const anio       = ahora.anio ?? hoy.getFullYear();
  const mesActual  = ahora.mesActual ?? hoy.getMonth() + 1;
  const diaHoy     = ahora.diaHoy ?? hoy.getDate();
  const diasGracia = clubConfig?.dias_gracia_mora ?? 0;

  // Exento = 100% de descuento — mismo criterio que ya usa JugadoresTable
  // (Number(j.descuento_pct) >= 100), no un flag booleano aparte.
  const exento = Number(jugador?.descuento_pct) >= 100;

  const { mensIdx, suspIdx } = indice;
  const misMensualidades = (mensIdx[cedula] || []).filter(m => parseInt(m.anio) === anio);

  const meses = misMensualidades
    .map(m => {
      const numeroMes = parseInt(m.numero_mes);
      return {
        numeroMes,
        estado: m.estado,
        saldo: parseFloat(m.saldo_pendiente) || 0,
        suspendido: estaSuspendido(suspIdx, cedula, numeroMes, anio),
        causado: yaCausado(m, anio, mesActual),
      };
    })
    .sort((a, b) => a.numeroMes - b.numeroMes);

  const mesesCausadosNoSuspendidos = meses.filter(m => m.causado && !m.suspendido);

  // El saldo ignora los días de gracia (Fork C del ADR): un mes causado impago suma
  // al saldo aunque el jugador esté dentro de los días de gracia. La gracia solo
  // decide `mesesEnMora`/`estado` (el flag de moroso), no cuánto debe.
  const saldoMensualidades = mesesCausadosNoSuspendidos.reduce((s, m) => s + m.saldo, 0);

  // Espejo de mesesEnMora (api/services/mora.js) — mismo criterio, dos repos.
  // Ver src/test/fixtures/mora-vectors.json.
  const mesesEnMora = exento ? [] : mesesCausadosNoSuspendidos
    .filter(m => {
      if (['AL_DIA', 'EXENTO', 'SUSPENDIDO', 'NO_APLICA'].includes(m.estado)) return false;
      if (m.estado === 'PARCIAL' && m.numeroMes === mesActual) return false;
      if (m.numeroMes < mesActual) return true;
      if (m.numeroMes === mesActual) return diaHoy > diasGracia;
      return false;
    })
    .map(m => m.numeroMes);

  // El estado global del jugador ya no confía en el flag `morosos` del backend —
  // se deriva de mesesEnMora (calculado arriba con el mismo criterio) y, si no hay
  // mora, del peor estado individual entre los meses causados no suspendidos.
  const estado = exento
    ? 'AL_DIA'
    : mesesEnMora.length > 0
      ? 'MORA'
      : mesesCausadosNoSuspendidos.reduce(
          (worst, m) => (PRIORIDAD_ESTADO[m.estado] || 0) > (PRIORIDAD_ESTADO[worst] || 0) ? m.estado : worst,
          'SIN_DATOS',
        );

  return { estado, saldoMensualidades, mesesEnMora, exento, meses };
}

/**
 * Rollup completo del estado de cuenta — Capa 2: mensualidades + torneos + uniformes.
 * Reemplaza `construirBalanceCompleto` de JugadoresTable.
 *
 * El saldo de torneos y uniformes es el `saldo_pendiente` crudo que ya trae cada
 * fila (mismo criterio Fork C que las mensualidades: la fuente de verdad del monto
 * por ítem es el backend, este módulo solo suma). El descuento del 100% (`exento`)
 * NO condona torneos ni uniformes — son cargos aparte de la mensualidad.
 *
 * @param {object} jugador - registro del jugador (usa cedula, descuento_pct).
 * @param {object} indice - salida de construirIndiceCuenta (con torneos/pedidosUniformes).
 * @param {object} clubConfig - { dias_gracia_mora }.
 * @param {object} [ahora] - { anio, mesActual, diaHoy } inyectables para tests.
 */
export function saldoTotal(jugador, indice, clubConfig = {}, ahora = {}) {
  const base   = estadoCuenta(jugador, indice, clubConfig, ahora);
  const cedula = String(jugador?.cedula || '');

  const torneos = Object.values(indice?.torneoIdx?.[cedula] || {});
  const saldoTorneos = torneos.reduce((s, t) => s + (t.saldo || 0), 0);

  const uni = indice?.uniformeIdx?.[cedula] || { pagado: 0, saldo: 0 };

  return {
    ...base,
    torneos,
    saldoTorneos,
    saldoUniformes:  uni.saldo,
    uniformesPagado: uni.pagado,
    saldoTotal: base.saldoMensualidades + saldoTorneos + uni.saldo,
  };
}
