import { SHEET_ID, API_KEY, SHEETS } from '../config';

const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;

async function fetchSheet(sheetName) {
  const url = `${BASE_URL}/${encodeURIComponent(sheetName)}?key=${API_KEY}&majorDimension=ROWS`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error fetching ${sheetName}: ${res.status}`);
  const data = await res.json();
  
  if (!data.values || data.values.length < 2) return [];
  
  const [headers, ...rows] = data.values;
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim().toLowerCase()] = row[i] || '';
    });
    return obj;
  });
}

export async function fetchJugadores() {
  return fetchSheet(SHEETS.JUGADORES);
}

export async function fetchPagos() {
  return fetchSheet(SHEETS.PAGOS);
}

export async function fetchMorosos() {
  return fetchSheet(SHEETS.MOROSOS);
}

export async function fetchDashboard() {
  return fetchSheet(SHEETS.DASHBOARD);
}

export async function fetchAllData() {
  const [jugadores, pagos, morosos, dashboard] = await Promise.all([
    fetchJugadores(),
    fetchPagos(),
    fetchMorosos(),
    fetchDashboard(),
  ]);
  return { jugadores, pagos, morosos, dashboard };
}
