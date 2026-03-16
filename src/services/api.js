/**
 * API Service — Lee desde City FC API en lugar de Google Sheets directo
 * Base URL: https://city-fc-api-v2.vercel.app
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';
const CLUB_ID = 'city-fc';

/**
 * Fetch con manejo de errores
 */
async function apiCall(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`API Call failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Obtener todos los datos del club (equivalente a fetchAllData anterior)
 */
export async function fetchAllData() {
  try {
    // Llamadas paralelas a todos los endpoints
    const [
      playersRes,
      invoicesRes,
      paymentsRes,
      reportsRes,
    ] = await Promise.all([
      apiCall(`/players?club_id=${CLUB_ID}`),
      apiCall(`/invoices?club_id=${CLUB_ID}&anio=2026`),
      apiCall(`/payments?club_id=${CLUB_ID}&limit=100`),
      apiCall(`/reports/summary?club_id=${CLUB_ID}`),
    ]);

    // Mapear datos al formato que espera el dashboard
    const jugadores = playersRes.data || [];
    const mensualidades = invoicesRes.data || [];
    const registroPagos = paymentsRes.data || [];
    
    // Uniformes y torneos (por ahora vacíos, pero disponibles en API)
    const uniformes = [];
    const torneos = [];

    // Calcular morosos desde el reporte
    const morosos = reportsRes.mensualidades?.morosos_cédulas?.map(m => {
      const jugador = jugadores.find(j => j.cedula === m.cedula);
      return {
        cedula: m.cedula,
        nombre: jugador?.nombre_completo || '',
        celular: jugador?.celular || '',
        meses_mora: 1,
        saldo_total: m.saldo_pendiente || 0,
      };
    }) || [];

    return { 
      jugadores, 
      mensualidades, 
      uniformes, 
      torneos, 
      registroPagos, 
      morosos,
      // Guardar reporte completo para stats
      reporteSummary: reportsRes,
    };
  } catch (error) {
    console.error('Error fetching all data from API:', error);
    throw error;
  }
}

/**
 * Obtener detalle de un jugador
 */
export async function fetchPlayerDetail(cedula) {
  return apiCall(`/players/${cedula}?club_id=${CLUB_ID}`);
}

/**
 * Obtener mensualidades de un jugador
 */
export async function fetchPlayerInvoices(cedula) {
  return apiCall(`/invoices/player/${cedula}?club_id=${CLUB_ID}`);
}

/**
 * Obtener resumen del club
 */
export async function fetchSummary(mes, anio) {
  let url = `/reports/summary?club_id=${CLUB_ID}`;
  if (mes) url += `&mes=${mes}`;
  if (anio) url += `&anio=${anio}`;
  return apiCall(url);
}

/**
 * Obtener lista de morosos
 */
export async function fetchDefaulters(anio = 2026) {
  return apiCall(`/reports/defaulters?club_id=${CLUB_ID}&anio=${anio}`);
}

/**
 * Obtener configuración del club
 */
export async function fetchConfig() {
  return apiCall(`/config?club_id=${CLUB_ID}`);
}

/**
 * Registrar un pago manualmente (POST)
 */
export async function registerPayment(paymentData) {
  const url = `${API_BASE_URL}/payments?club_id=${CLUB_ID}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    if (!res.ok) {
      throw new Error(`Payment registration failed: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error registering payment:', error);
    throw error;
  }
}
