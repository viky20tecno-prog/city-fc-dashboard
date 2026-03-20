const express = require('express');
const SheetsClient = require('../services/sheets');

const router = express.Router();
const sheetsClient = new SheetsClient();

/**
 * GET /api/payments
 */
router.get('/', async (req, res) => {
  try {
    let payments = await sheetsClient.getAllRows('REGISTRO_PAGOS');

    payments = payments.map(p => ({
      id_transaccion: p.id_transaccion,
      fecha_proceso: p.fecha_proceso,
      telefono: p.telefono,
      nombre_detectado: p.nombre_detectado,
      monto: p.monto_imagen,
      banco: p.banco,
      referencia: p.referencia,
      estado_revision: p.estado_revision
    }));

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('GET payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/payments
 */
router.post('/', async (req, res) => {
  try {
    const club_id = req.club_id || 'city-fc';

    const {
      cedula,
      monto,
      fecha_comprobante,
      banco,
      referencia,
      conceptos = [],
      url_comprobante = ''
    } = req.body;

    const jugador = await sheetsClient.searchRow('JUGADORES', 'cedula', cedula);

    if (!jugador) {
      return res.status(404).json({
        success: false,
        error: 'Jugador no encontrado'
      });
    }

    const id_transaccion = `TXN-${Date.now()}`;

    const suma_conceptos = conceptos.reduce((acc, c) => acc + Number(c.valor || 0), 0);

    const row = [
      club_id,
      id_transaccion,
      new Date().toISOString(),
      jugador.celular || '',
      jugador.nombre || jugador['nombre(s)'] || '',
      monto,
      fecha_comprobante || '',
      '2026',
      banco,
      referencia || '',
      JSON.stringify(conceptos),
      suma_conceptos,
      'OK',
      'PENDIENTE',
      '',
      url_comprobante,
      cedula
    ];

    await sheetsClient.appendRow('REGISTRO_PAGOS', row);

    res.json({
      success: true,
      id_transaccion
    });

  } catch (error) {
    console.error('POST payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
