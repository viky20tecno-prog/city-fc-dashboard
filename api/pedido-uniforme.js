import { google } from 'googleapis';

const SHEET_ID = '1oyrm3WeCXJbmxMhSWFjhnvpZ2XDr6DK9Dm__rLqO6gA';
const HOJA_PEDIDOS = 'PEDIDOS_UNIFORMES';
const HOJA_JUGADORES = 'JUGADORES';

const PRECIOS_UNIFORMES = {
  'General': 90000,
  'Campeones EVG/SAB': 60000,
  'Arqueros EVG/SAB': 120000,
  'Arqueros General': 160000
};

const TALLAS_VALIDAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}');
  return google.sheets({
    version: 'v4',
    auth: new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })
  });
}

function validarDatos(data) {
  const errores = [];
  
  if (!data.cedula || !/^\d{7,15}$/.test(data.cedula.trim())) {
    errores.push('Cédula inválida');
  }
  if (!data.tipo || !PRECIOS_UNIFORMES[data.tipo]) {
    errores.push('Tipo uniforme inválido');
  }
  if (!data.talla || !TALLAS_VALIDAS.includes(data.talla.toUpperCase())) {
    errores.push('Talla inválida. Válidas: XS, S, M, L, XL, XXL');
  }
  if (!data.nombre_estampar || data.nombre_estampar.trim().length === 0 || data.nombre_estampar.trim().length > 12) {
    errores.push('Nombre a estampar: 1-12 caracteres');
  }
  if (!data.numero_estampar || !/^\d{1,2}$/.test(data.numero_estampar.toString()) || data.numero_estampar < 1 || data.numero_estampar > 99) {
    errores.push('Número estampar debe ser 1-99');
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.nombre_estampar.trim())) {
    errores.push('Nombre a estampar solo puede contener letras y espacios');
  }
  
  return errores;
}

async function obtenerJugador(sheets, cedula) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${HOJA_JUGADORES}!A:C`
    });
    
    const rows = response.data.values || [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toString().trim() === cedula.toString().trim()) {
        return {
          cedula: rows[i][0],
          nombre: rows[i][1] || '',
          apellidos: rows[i][2] || ''
        };
      }
    }
    return null;
  } catch (err) {
    console.error('Error buscando jugador:', err);
    return null;
  }
}

function crearFilaPedido(data, jugador) {
  const fechaHoy = new Date().toISOString().split('T')[0];
  
  return [
    'city-fc', // club_id
    data.cedula.trim(), // cedula
    `${jugador.nombre} ${jugador.apellidos}`, // nombre completo
    data.tipo, // tipo
    data.talla.toUpperCase(), // talla
    data.nombre_estampar.trim().toUpperCase(), // nombre_estampar
    data.numero_estampar, // numero_estampar
    fechaHoy, // fecha
    'PENDIENTE' // estado
  ];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }
  
  try {
    const data = req.body;
    
    // Validar datos
    const errores = validarDatos(data);
    if (errores.length > 0) {
      return res.status(400).json({ success: false, error: errores.join('; ') });
    }
    
    const sheets = getSheetsClient();
    
    // Verificar que el jugador existe
    const jugador = await obtenerJugador(sheets, data.cedula);
    if (!jugador) {
      return res.status(404).json({ success: false, error: 'Jugador no encontrado' });
    }
    
    // Crear fila en PEDIDOS_UNIFORMES
    const filaPedido = crearFilaPedido(data, jugador);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${HOJA_PEDIDOS}!A:I`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [filaPedido]
      }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Pedido de uniforme registrado',
      pedido: {
        jugador: `${jugador.nombre} ${jugador.apellidos}`,
        tipo: data.tipo,
        talla: data.talla.toUpperCase(),
        nombre_estampar: data.nombre_estampar.trim().toUpperCase(),
        numero_estampar: data.numero_estampar,
        fecha: new Date().toISOString().split('T')[0],
        estado: 'PENDIENTE'
      }
    });
    
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error registrando pedido'
    });
  }
}
