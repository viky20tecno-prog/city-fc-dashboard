/**
 * API Service — Lee desde City FC API
 * Base URL: https://city-fc-api-v2.vercel.app
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';
const CLUB_ID = import.meta.env.VITE_CLUB_ID || 'city-fc';

async function apiCall(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error(`API Call failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * ✅ Calcular morosos directamente desde mensualidades
 * Un jugador está en MORA si tiene al menos 1 mes ANTERIOR al actual
 * con estado PENDIENTE, PARCIAL o MORA y saldo_pendiente > 0
 */
function calcularMorosos(mensualidades, jugadores) {
  const mesActual = new Date().getMonth() + 1; // 1-12

  // Agrupar mensualidades por cédula
  const porCedula = {};
  for (const m of mensualidades) {
    const ced = String(m.cedula || m.jugador_id || '').trim();
    if (!ced) continue;
    if (!porCedula[ced]) porCedula[ced] = [];
    porCedula[ced].push(m);
  }

  const morosos = [];

  for (const [cedula, meses] of Object.entries(porCedula)) {
    // Buscar meses ANTERIORES al actual con saldo pendiente
    const mesesEnMora = meses.filter(m => {
      const numMes = parseInt(m.numero_mes) || 0;
      const estado = String(m.estado || '').toUpperCase();
      const saldo = parseFloat(m.saldo_pendiente) || 0;
      return numMes < mesActual &&
        (estado === 'PENDIENTE' || estado === 'PARCIAL' || estado === 'MORA') &&
        saldo > 0;
    });

    if (mesesEnMora.length === 0) continue;

    // Calcular saldo total en mora
    const saldoTotal = mesesEnMora.reduce((sum, m) => sum + (parseFloat(m.saldo_pendiente) || 0), 0);

    // Buscar datos del jugador
    const jugador = jugadores.find(j => String(j.cedula).trim() === cedula);
    const nombre = jugador
      ? `${jugador['nombre(s)'] || jugador.nombre || ''} ${jugador['apellido(s)'] || jugador.apellidos || ''}`.trim()
      : `CC ${cedula}`;

    morosos.push({
      cedula,
      nombre,
      celular: jugador?.celular || '',
      meses_mora: mesesEnMora.length,
      meses_detalle: mesesEnMora.map(m => m.mes).join(', '),
      saldo_total: saldoTotal,
    });
  }

  // Ordenar por mayor saldo primero
  return morosos.sort((a, b) => b.saldo_total - a.saldo_total);
}

/**
 * Obtener todos los datos del club
 */
export async function fetchAllData() {
  try {
    const [
      playersRes,
      invoicesRes,
      paymentsRes,
      uniformesRes,
      torneosRes,
    ] = await Promise.all([
      apiCall(`/players?club_id=${CLUB_ID}`),
      apiCall(`/invoices?club_id=${CLUB_ID}&anio=2026`),
      apiCall(`/payments?club_id=${CLUB_ID}&limit=100`),
      apiCall(`/invoices/uniformes?club_id=${CLUB_ID}`),
      apiCall(`/invoices/torneos?club_id=${CLUB_ID}`),
    ]);

    const jugadores = playersRes.data || [];
    const mensualidades = invoicesRes.data || [];
    const registroPagos = paymentsRes.data || [];
    const uniformes = uniformesRes.data || [];
    const torneos = torneosRes.data || [];

    // ✅ Calcular morosos desde mensualidades directamente
    const morosos = calcularMorosos(mensualidades, jugadores);

    return {
      jugadores,
      mensualidades,
      uniformes,
      torneos,
      registroPagos,
      morosos,
    };
  } catch (error) {
    console.error('Error fetching all data from API:', error);
    throw error;
  }
}

export async function fetchPlayerDetail(cedula) {
  return apiCall(`/players/${cedula}?club_id=${CLUB_ID}`);
}

export async function fetchPlayerInvoices(cedula) {
  return apiCall(`/invoices/player/${cedula}?club_id=${CLUB_ID}`);
}

export async function fetchSummary(mes, anio) {
  let url = `/reports/summary?club_id=${CLUB_ID}`;
  if (mes) url += `&mes=${mes}`;
  if (anio) url += `&anio=${anio}`;
  return apiCall(url);
}

export async function fetchDefaulters(anio = 2026) {
  return apiCall(`/reports/defaulters?club_id=${CLUB_ID}&anio=${anio}`);
}

export async function fetchConfig() {
  return apiCall(`/config?club_id=${CLUB_ID}`);
}

export async function registerPayment(paymentData) {
  const url = `${API_BASE_URL}/payments?club_id=${CLUB_ID}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    if (!res.ok) throw new Error(`Payment registration failed: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error registering payment:', error);
    throw error;
  }
}
