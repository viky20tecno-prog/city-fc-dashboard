import { google } from 'googleapis';

const SHEET_ID = '1oyrm3WeCXJbmxMhSWFjhnvpZ2XDr6DK9Dm__rLqO6gA';
const HOJA_UNIFORMES = 'ESTADO_UNIFORMES';
const HOJA_JUGADORES = 'JUGADORES';

// Precios de uniformes por tipo
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
  if (!data.tipo_uniforme || !PRECIOS_UNIFORMES[data.tipo_uniforme]) {
    errores.push('Tipo uniforme inválido');
  }
  if (!data.numero || !/^\d{1,2}$/.test(data.numero.toString()) || data.numero < 1 || data.numero > 99) {
    errores.push('Número camiseta debe ser 1-99');
  }
  if (!data.nombre_estampar || data.nombre_estampar.trim().length === 0 || data.nombre_estampar.trim().length > 12) {
    errores.push('Nombre a estampar: 1-12 caracteres');
  }
  if (!data.talla || !TALLAS_VALIDAS.includes(data.talla.toUpperCase())) {
    errores.push('Talla inválida. Válidas: XS, S, M, L, XL, XXL');
  }
  
  // Validar caracteres especiales en nombre
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

function crearFilaUniforme(data, jugador) {
  const fechaHoy = new Date().toISOString().split('T')[0];
  const valorOficial = PRECIOS_UNIFORMES[data.tipo_uniforme];
  
  return [
    'city-fc', // club_id
    data.cedula.trim(), // cedula
    `${jugador.nombre} ${jugador.apellidos}`, // nombre completo
    new Date().getFullYear(), // anio
    data.tipo_uniforme, // tipo_uniforme
    data.numero, // numero
    data.nombre_estampar.trim().toUpperCase(), // nombre_estampar
    data.talla.toUpperCase(), // talla
    valorOficial, // valor_oficial
    0, // valor_pagado
    valorOficial, // saldo_pendiente
    'PENDIENTE', // estado
    fechaHoy // fecha_ultima_actualizacion
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
    
    // Crear fila en ESTADO_UNIFORMES
    const filaUniforme = crearFilaUniforme(data, jugador);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${HOJA_UNIFORMES}!A:M`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [filaUniforme]
      }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Uniforme registrado correctamente',
      uniforme: {
        jugador: `${jugador.nombre} ${jugador.apellidos}`,
        tipo: data.tipo_uniforme,
        numero: data.numero,
        nombre_estampar: data.nombre_estampar.trim().toUpperCase(),
        talla: data.talla.toUpperCase(),
        valor: PRECIOS_UNIFORMES[data.tipo_uniforme]
      }
    });
    
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error registrando uniforme'
    });
  }
}
