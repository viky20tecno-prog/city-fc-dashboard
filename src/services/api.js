import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

export function getClubId() {
  return localStorage.getItem('clubId') || null;
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
  const clubId = getClubId();
  if (!clubId) throw new Error('No hay club activo en sesión.');

  const anio = new Date().getFullYear();

  const [
    playersRes,
    invoicesRes,
    paymentsRes,
    reportsRes,
    uniformesRes,
    torneosRes,
    suspensionesRes,
  ] = await Promise.all([
    apiCallSafe(`/players?club_id=${clubId}&incluir_archivados=true`,   { data: [] }),
    apiCallSafe(`/invoices?club_id=${clubId}&anio=${anio}`,            { data: [] }),
    apiCallSafe(`/payments?club_id=${clubId}&limit=100`,               { data: [] }),
    apiCallSafe(`/reports/summary?club_id=${clubId}`,                  {}),
    apiCallSafe(`/uniforms?club_id=${clubId}`,                         { data: [] }),
    apiCallSafe(`/invoices/torneos?club_id=${clubId}`,                 { data: [] }),
    apiCallSafe(`/suspensiones?club_id=${clubId}`,                     { data: [] }),
  ]);

  const jugadores     = playersRes.data      || [];
  const mensualidades = invoicesRes.data     || [];
  const registroPagos = paymentsRes.data     || [];
  const uniformes     = uniformesRes.data    || [];
  const torneos       = torneosRes.data      || [];
  const suspensiones  = suspensionesRes.data || [];

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
}

export async function deletePlayer(cedula) {
  const clubId = getClubId();
  if (!clubId) throw new Error('No hay club activo en sesión.');
  const url = `${API_BASE_URL}/players/${cedula}?club_id=${clubId}`;
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return await res.json();
}

export async function archivePlayer(cedula, activo) {
  const clubId = getClubId();
  if (!clubId) throw new Error('No hay club activo en sesión.');
  const url = `${API_BASE_URL}/players/${cedula}?club_id=${clubId}`;
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ activo }),
  });
  if (!res.ok) throw new Error(`Archive failed: ${res.status}`);
  return await res.json();
}

export async function fetchClubConfig() {
  const clubId = getClubId();
  if (!clubId) throw new Error('No hay club activo en sesión.');
  const url = `${API_BASE_URL}/config?club_id=${clubId}`;
  const headers = await getAuthHeaders();
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return await res.json();
}

export async function importarJugadoresBulk(jugadores) {
  const clubId = getClubId();
  if (!clubId) throw new Error('No hay club activo en sesión.');
  const url = `${API_BASE_URL}/players/bulk?club_id=${clubId}`;
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body:    JSON.stringify({ jugadores }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Import failed: ${res.status}`);
  }
  return await res.json();
}
