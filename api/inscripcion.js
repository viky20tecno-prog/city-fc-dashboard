import { google } from 'googleapis';

const SHEET_ID = '1oyrm3WeCXJbmxMhSWFjhnvpZ2XDr6DK9Dm__rLqO6gA';
const HOJA_JUGADORES = 'JUGADORES';
const HOJA_MENSUALIDADES = 'ESTADO_MENSUALIDADES';
const HOJA_TORNEOS = 'ESTADO_TORNEOS';
const CUOTA_DEFAULT = 65000;

// Inicializar Google Sheets
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

// Validar datos del formulario
function validarDatos(data) {
  const errores = [];
  
  if (!data.cedula || !/^\d{7,15}$/.test(data.cedula.trim())) {
    errores.push('Cédula inválida (7-15 dígitos)');
  }
  if (!data.nombre || data.nombre.trim().length < 2) {
    errores.push('Nombre requerido');
  }
  if (!data.apellidos || data.apellidos.trim().length < 2) {
    errores.push('Apellidos requeridos');
  }
  if (!data.celular || !/^\d{10}$/.test(data.celular.trim())) {
    errores.push('Celular inválido (10 dígitos)');
  }
  if (!data.correo_electronico || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo_electronico.trim())) {
    errores.push('Email inválido');
  }
  if (!data.lugar_de_nacimiento || data.lugar_de_nacimiento.trim().length < 2) {
    errores.push('Lugar de nacimiento requerido');
  }
  if (!data.fecha_nacimiento) {
    errores.push('Fecha de nacimiento requerida');
  }
  if (!data.tipo_sangre) {
    errores.push('Tipo de sangre requerido');
  }
  if (!data.eps || data.eps.trim().length < 2) {
    errores.push('EPS requerida');
  }
  if (!data.municipio || data.municipio.trim().length < 2) {
    errores.push('Municipio requerido');
  }
  if (!data.familiar_emergencia || data.familiar_emergencia.trim().length < 2) {
    errores.push('Contacto de emergencia requerido');
  }
  if (!data.celular_contacto || !/^\d{10}$/.test(data.celular_contacto.trim())) {
    errores.push('Celular de contacto inválido (10 dígitos)');
  }
  if (data.celular.trim() === data.celular_contacto.trim()) {
    errores.push('Celular de emergencia debe ser diferente al tuyo');
  }
  
  return errores;
}

// Crear fila para JUGADORES
function crearFilaJugador(data) {
  return [
    data.cedula.trim(), // cedula (PRIMERA columna si no tienes club_id como col A)
    data.nombre.trim(),
    data.apellidos.trim(),
    data.tipo_id || 'Cédula de Ciudadanía',
    data.celular.trim(),
    data.correo_electronico.trim(),
    data.instagram || '',
    data.lugar_de_nacimiento.trim(),
    data.fecha_nacimiento,
    data.tipo_sangre,
    data.eps.trim(),
    data.estatura || '',
    data.peso || '',
    data.direccion || '',
    data.municipio.trim(),
    data.barrio || '',
    data.familiar_emergencia.trim(),
    data.celular_contacto.trim(),
    'SI', // activo
    'NA', // tipo_descuento
    CUOTA_DEFAULT, // mensualidad_2026
    new Date().toISOString().split('T')[0], // fecha_inscripcion
    'city-fc' // club_id (ÚLTIMA columna)
  ];
}

// Crear 12 filas para ESTADO_MENSUALIDADES
function crearFilasMensualidades(data) {
  const now = new Date();
  const mesActual = now.getMonth() + 1;
  const anio = now.getFullYear();
  const nombreCompleto = `${data.nombre.trim()} ${data.apellidos.trim()}`;
  const fechaHoy = now.toISOString().split('T')[0];
  
  const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  const filas = [];
  for (let mes = 1; mes <= 12; mes++) {
    const esPasado = mes < mesActual;
    const cuota = esPasado ? 0 : CUOTA_DEFAULT;
    filas.push([
      'city-fc',
      data.cedula.trim(),
      nombreCompleto,
      anio,
      meses[mes],
      mes,
      cuota,
      0,
      cuota,
      esPasado ? 'AL_DIA' : 'PENDIENTE',
      fechaHoy
    ]);
  }
  return filas;
}

// Crear 4 filas para ESTADO_TORNEOS
function crearFilasTorneos(data) {
  const anio = new Date().getFullYear();
  const nombreCompleto = `${data.nombre.trim()} ${data.apellidos.trim()}`;
  const fechaHoy = new Date().toISOString().split('T')[0];
  
  const torneos = [
    { nombre: 'Punto y Coma', valor: 80000 },
    { nombre: 'JBC (Fútbol 7)', valor: 50000 },
    { nombre: 'INDESA 2026 I', valor: 120000 },
    { nombre: 'INDER Envigado', valor: 100000 }
  ];
  
  return torneos.map(t => [
    'city-fc',
    data.cedula.trim(),
    nombreCompleto,
    anio,
    t.nombre,
    t.valor,
    0,
    t.valor,
    'PENDIENTE',
    fechaHoy
  ]);
}

// Handler principal
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }
  
  try {
    const data = req.body;
    
    // Validar datos
    const errores = validarDatos(data);
    if (errores.length > 0) {
      return res.status(400).json({ success: false, error: errores.join(', ') });
    }
    
    const sheets = getSheetsClient();
    
    // 1. Insertar en JUGADORES
    const filaJugador = crearFilaJugador(data);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${HOJA_JUGADORES}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [filaJugador]
      }
    });
    
    // 2. Insertar 12 meses en ESTADO_MENSUALIDADES
    const filasMensualidades = crearFilasMensualidades(data);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${HOJA_MENSUALIDADES}!A:K`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: filasMensualidades
      }
    });
    
    // 3. Insertar 4 torneos en ESTADO_TORNEOS
    const filasTorneos = crearFilasTorneos(data);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${HOJA_TORNEOS}!A:J`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: filasTorneos
      }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Inscripción exitosa',
      nombre: `${data.nombre} ${data.apellidos}`
    });
    
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error en inscripción'
    });
  }
}
