const express = require('express');
const SheetsClient = require('../services/sheets');

const router = express.Router();
const sheetsClient = new SheetsClient();
const CLUB_ID = 'city-fc';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const ANO = '2026';
const CUOTA = 65000;

/**
 * POST /api/inscripcion
 * Inscribir un nuevo jugador
 */
router.post('/', async (req, res) => {
  try {
    const {
      cedula, nombre, apellidos, tipo_id,
      celular, correo_electronico, instagram,
      lugar_de_nacimiento, fecha_nacimiento, tipo_sangre, eps,
      estatura, peso, direccion, municipio, barrio,
      familiar_emergencia, celular_contacto,
      tipo_descuento = 'NA',
    } = req.body;

    // Validar campos obligatorios
    if (!cedula || !nombre || !apellidos || !celular || !municipio || !familiar_emergencia || !celular_contacto) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos obligatorios',
      });
    }

    // Verificar que el jugador no exista ya
    const existente = await sheetsClient.searchRow('JUGADORES', 'cedula', cedula);
    if (existente) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un jugador con esa cédula',
        cedula,
      });
    }

    const hoy = new Date().toISOString().split('T')[0];

    // ✅ Orden exacto de columnas en JUGADORES:
    // club_id | cedula | nombre(s) | apellido(s) | tipo_de_documento | celular |
    // correo_electronico | instagram | lugar_de_nacimiento | fecha_nacimiento |
    // tipo_sangre | eps | estatura | peso | direccion_de_residencia | municipio |
    // barrio | contacto_en_caso_de_emergencia | celular_contacto |
    // mensualidad_2026 | tipo_descuento | observacion_descuento | activo
    await sheetsClient.appendRow('JUGADORES', [
      CLUB_ID,
      cedula,
      nombre,
      apellidos,
      tipo_id || 'Cédula de Ciudadanía',
      celular,
      correo_electronico || '',
      instagram || '',
      lugar_de_nacimiento || '',
      fecha_nacimiento || '',
      tipo_sangre || '',
      eps || '',
      estatura || '',
      peso || '',
      direccion || '',
      municipio,
      barrio || '',
      familiar_emergencia,
      celular_contacto,
      String(CUOTA),
      tipo_descuento,
      '',
      'SI',
    ]);

    const nombreCompleto = `${nombre} ${apellidos}`.trim();

    // ✅ Crear 12 filas en ESTADO_MENSUALIDADES
    // club_id | cedula | nombre | anio | mes | numero_mes | valor_oficial | valor_pagado | saldo_pendiente | estado | fecha_ultima_actualizacion
    for (let i = 0; i < 12; i++) {
      const mesNum = i + 1;
      const valor = mesNum <= 2 ? 0 : CUOTA; // Enero y Febrero gratuitos
      await sheetsClient.appendRow('ESTADO_MENSUALIDADES', [
        CLUB_ID,
        cedula,
        nombreCompleto,
        ANO,
        MESES[i],
        String(mesNum),
        String(valor),
        '0',
        String(valor),
        valor === 0 ? 'AL_DIA' : 'PENDIENTE',
        hoy,
      ]);
    }

    // ✅ Crear fila en ESTADO_UNIFORMES
    // club_id | cedula | nombre | anio | tipo_uniforme | valor_oficial | valor_pagado | saldo_pendiente | estado | fecha_ultima_actualizacion
    await sheetsClient.appendRow('ESTADO_UNIFORMES', [
      CLUB_ID,
      cedula,
      nombreCompleto,
      ANO,
      'General',
      '90000',
      '0',
      '90000',
      'PENDIENTE',
      hoy,
    ]);

    res.json({
      success: true,
      message: 'Jugador inscrito exitosamente',
      data: { cedula, nombre: nombreCompleto, club_id: CLUB_ID },
    });

  } catch (error) {
    console.error('Error in POST /inscripcion:', error);
    res.status(500).json({
      success: false,
      error: 'Error al inscribir jugador',
      message: error.message,
    });
  }
});

/**
 * GET /api/inscripcion/verificar?cedula=XXX
 * Verificar si una cédula ya está inscrita
 */
router.get('/verificar', async (req, res) => {
  try {
    const { cedula } = req.query;
    if (!cedula) {
      return res.status(400).json({ success: false, error: 'cedula requerida' });
    }
    const jugador = await sheetsClient.searchRow('JUGADORES', 'cedula', cedula);
    res.json({ success: true, existe: !!jugador });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
