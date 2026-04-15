const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';
const CLUB_ID = 'city-fc';

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

export async function fetchAllData() {
  try {
    const [
      playersRes,
      invoicesRes,
      paymentsRes,
      reportsRes,
      uniformesRes,
      torneosRes,
    ] = await Promise.all([
      apiCall(`/players?club_id=${CLUB_ID}`),
      apiCall(`/invoices?club_id=${CLUB_ID}&anio=2026`),
      apiCall(`/payments?club_id=${CLUB_ID}&limit=100`),
      apiCall(`/reports/summary?club_id=${CLUB_ID}`),
      apiCall(`/invoices/uniformes?club_id=${CLUB_ID}`),
      apiCall(`/invoices/torneos?club_id=${CLUB_ID}`),
    ]);

    const jugadores     = playersRes.data  || [];
    const mensualidades = invoicesRes.data || [];
    const registroPagos = paymentsRes.data || [];
    const uniformes     = uniformesRes.data || [];
    const torneos       = torneosRes.data  || [];

    const morosos = reportsRes.mensualidades?.morosos_cédulas?.map(m => {
      const jugador = jugadores.find(j => j.cedula == m.cedula);
      return {
        cedula:        m.cedula,
        nombre:        jugador
          ? `${jugador.nombre || jugador['nombre(s)'] || ''} ${jugador.apellidos || jugador['apellido(s)'] || ''}`.trim()
          : `CC ${m.cedula}`,
        celular:       jugador?.celular || '',
        meses_mora:    m.meses_en_mora?.length || 1,
        meses_en_mora: m.meses_en_mora || [],
        meses_detalle: (m.meses_en_mora || [])
          .sort((a, b) => (a.numero_mes || 0) - (b.numero_mes || 0))
          .map(x => x.mes)
          .filter(Boolean)
          .join(' · '),
        saldo_total:   m.saldo_pendiente || 0,
      };
    }) || [];


    return { jugadores, mensualidades, uniformes, torneos, registroPagos, morosos, reporteSummary: reportsRes };
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
  if (mes)  url += `&mes=${mes}`;
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
