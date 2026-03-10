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

export async function fetchAllData() {
  const [jugadores, mensualidades] = await Promise.all([
    fetchSheet(SHEETS.JUGADORES),
    fetchSheet(SHEETS.ESTADO_MENSUALIDADES),
  ]);

  // Calcular morosos: jugadores con al menos 1 mes en MORA o PENDIENTE vencido
  const mesActual = new Date().getMonth() + 1;
  
  // Agrupar mensualidades por jugador
  const porJugador = {};
  mensualidades.forEach(m => {
    const id = m.cedula || m.jugador_id;
    if (!porJugador[id]) porJugador[id] = [];
    porJugador[id].push(m);
  });

  // Morosos: jugadores con meses vencidos O con estado MORA en cualquier mes
  const morosos = [];
  Object.entries(porJugador).forEach(([cedula, meses]) => {
    const mesesVencidos = meses.filter(m => {
      const numMes = parseInt(m.numero_mes) || 0;
      const estado = (m.estado || '').toUpperCase();
      // Meses anteriores no pagados O cualquier mes en MORA
      return numMes > 0 && (
        (numMes < mesActual && estado !== 'AL_DIA') ||
        estado === 'MORA'
      );
    });
    
    if (mesesVencidos.length > 0) {
      const saldoTotal = mesesVencidos.reduce((sum, m) => sum + (parseFloat(m.saldo_pendiente) || 0), 0);
      const jugador = jugadores.find(j => j.cedula === cedula);
      morosos.push({
        cedula,
        nombre: jugador ? `${jugador['nombre(s)'] || jugador.nombre || ''} ${jugador['apellido(s)'] || jugador.apellidos || ''}`.trim() : (meses[0].nombre || cedula),
        celular: jugador?.celular || '',
        meses_mora: mesesVencidos.length,
        saldo_total: saldoTotal,
      });
    }
  });

  return { jugadores, mensualidades, morosos };
}
