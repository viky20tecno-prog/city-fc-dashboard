import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';

// Club ID dinámico - se obtiene desde localStorage o sesión del usuario
export function getClubId() {
  return localStorage.getItem('clubId') || 'city-fc'; // fallback para compatibilidad
}

export function setClubId(clubId) {
  localStorage.setItem('clubId', clubId);
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiCall(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error(`API Call failed: ${endpoint}`, error);
    throw error;
  }
}

async function apiCallSafe(endpoint, fallback = { data: [] }) {
  try {
    return await apiCall(endpoint);
  } catch {
    return fallback;
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
      suspensionesRes,
    ] = await Promise.all([
      apiCall(`/players?club_id=${getClubId()}`),
      apiCall(`/invoices?club_id=${getClubId()}&anio=2026`),
      apiCall(`/payments?club_id=${getClubId()}&limit=100`),
      apiCallSafe(`/reports/summary?club_id=${getClubId()}`, {}),
      apiCall(`/invoices/uniformes?club_id=${getClubId()}`),
      apiCall(`/invoices/torneos?club_id=${getClubId()}`),
      apiCall(`/suspensiones?club_id=${getClubId()}`),
    ]);

    const jugadores     = playersRes.data       || [];
    const mensualidades = invoicesRes.data      || [];
    const registroPagos = paymentsRes.data      || [];
    const uniformes     = uniformesRes.data     || [];
    const torneos       = torneosRes.data       || [];
    const suspensiones  = suspensionesRes.data  || [];

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


    return { jugadores, mensualidades, uniformes, torneos, registroPagos, morosos, suspensiones, reporteSummary: reportsRes };
  } catch (error) {
    console.error('Error fetching all data from API:', error);
    throw error;
  }
}

export async function fetchPlayerDetail(cedula) {
  return apiCall(`/players/${cedula}?club_id=${getClubId()}`);
}

export async function fetchPlayerInvoices(cedula) {
  return apiCall(`/invoices/player/${cedula}?club_id=${getClubId()}`);
}

export async function fetchSummary(mes, anio) {
  let url = `/reports/summary?club_id=${getClubId()}`;
  if (mes)  url += `&mes=${mes}`;
  if (anio) url += `&anio=${anio}`;
  return apiCall(url);
}

export async function fetchDefaulters(anio = 2026) {
  return apiCall(`/reports/defaulters?club_id=${getClubId()}&anio=${anio}`);
}

export async function fetchConfig() {
  return apiCall(`/config?club_id=${getClubId()}`);
}

export async function deletePlayer(cedula) {
  const url = `${API_BASE_URL}/players/${cedula}?club_id=${getClubId()}`;
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return await res.json();
}

export async function fetchClubConfig() {
  const clubId = getClubId();
  const url = `${API_BASE_URL}/config?club_id=${clubId}`;
  const headers = await getAuthHeaders();
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return await res.json();
}

export async function importarJugadoresBulk(jugadores) {
  const url = `${API_BASE_URL}/players/bulk?club_id=${getClubId()}`;
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body:    JSON.stringify({ jugadores }),
  });
  if (!res.ok) throw new Error(`Import failed: ${res.status}`);
  return await res.json();
}

export async function registerPayment(paymentData) {
  const url = `${API_BASE_URL}/payments?club_id=${getClubId()}`;
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(paymentData),
    });
    if (!res.ok) throw new Error(`Payment registration failed: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error registering payment:', error);
    throw error;
  }
}
