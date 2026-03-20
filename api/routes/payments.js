const express = require('express');
const SheetsClient = require('../services/sheets');

const router = express.Router();
const sheetsClient = new SheetsClient();

/**
 * GET /api/payments
 */
router.get('/', async (req, res) => {
  try {
    const club_id = req.club_id || 'city-fc';
    const { limit = 50, cedula, estado_revision } = req.query;

    let payments = await sheetsClient.getAllRows('REGISTRO_PAGOS');

    if (cedula) {
      payments = payments.filter(p => p.cedula === cedula);
    }

    if (estado_revision) {
      payments = payments.filter(p => p.estado_revision === estado_revision);
    }

    payments.sort((a, b) => {
      const dateA = new Date(a.fecha_proceso || 0);
      const dateB = new Date(b.fecha_proceso || 0);
      return dateB - dateA;
    });

    const limitNum = Math.min(parseInt(limit) || 50, 500);
    payments = payments.slice(0, limitNum);

    const mapped = payments.map(p => ({
      id_transaccion: p.id_transaccion,
      fecha_proceso: p.fecha_proceso,
      telefono: p.telefono,
      nombre_detectado: p.nombre_detectado || '',
      monto: parseFloat(p.monto_imagen) || 0,
      banco: p.banco,
      referencia: p.referencia,
      conceptos: p.conceptos_json ? parseConceptos(p.conceptos_json) : [],
      estado_revision: p.estado_revision,
    }));

    res.json({
      success: true,
      club_id,
      data: mapped,
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

    if (!cedula || !monto || !banco) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos obligatorios'
      });
    }

    const jugador = await sheetsClient.searchRow('JUGADORES', 'cedula', cedula);

    if (!jugador) {
      return res.status(404).json({
        success: false,
        error: 'Jugador no encontrado'
      });
    }

    const id_transaccion = `TXN-${Date.now()}`;

    const suma_conceptos = conceptos.reduce((acc, c) => acc + Number(c.valor || 0), 0);

    const validacion_monto = monto >= suma_conceptos ? 'OK' : 'DIFERENCIA';

    let mensaje_alerta = '';

    // 🔥 REGISTRO_PAGOS ORDEN CORRECTO
    const row = [
      club_id,
      id_transaccion,
      new Date().toISOString(),
      jugador.celular || '',
      jugador.nombre || '',
      monto,
      fecha_comprobante || '',
      '2026',
      banco,
      referencia || '',
      JSON.stringify(conceptos),
      suma_conceptos,
      validacion_monto,
      'PENDIENTE',
      '',
      url_comprobante
    ];

    await sheetsClient.appendRow('REGISTRO_PAGOS', row);

    // 🔥 ACTUALIZAR ESTADOS
    const mesActual = new Date().getMonth() + 1;

    for (const c of conceptos) {

      if (c.tipo === 'Mensualidad') {
        const rows = await sheetsClient.getAllRows('ESTADO_MENSUALIDADES');

        const index = rows.findIndex(r =>
          r.cedula == cedula && Number(r.mes) === mesActual
        );

        if (index !== -1) {
          const row = rows[index];

          const pagado = Number(row.valor_pagado || 0) + Number(c.valor || 0);
          const total = Number(row.valor_total || 0);
          const saldo = total - pagado;

          const estado = saldo <= 0 ? 'AL_DIA' : 'PARCIAL';

          await sheetsClient.updateRow('ESTADO_MENSUALIDADES', index + 2, [
            row.club_id,
            row.cedula,
            row.nombre,
            row.mes,
            total,
            pagado,
            saldo,
            estado
          ]);
        }
      }

      if (c.tipo === 'Uniforme') {
        const rows = await sheetsClient.getAllRows('ESTADO_UNIFORMES');

        const index = rows.findIndex(r => r.cedula == cedula);

        if (index !== -1) {
          const row = rows[index];

          const pagado = Number(row.valor_pagado || 0) + Number(c.valor || 0);
          const total = Number(row.valor_total || 0);
          const saldo = total - pagado;

          const estado = saldo <= 0 ? 'AL_DIA' : 'PARCIAL';

          await sheetsClient.updateRow('ESTADO_UNIFORMES', index + 2, [
            row.club_id,
            row.cedula,
            row.nombre,
            total,
            pagado,
            saldo,
            estado
          ]);
        }
      }

      if (c.tipo === 'Torneo') {
        const rows = await sheetsClient.getAllRows('ESTADO_TORNEOS');

        const index = rows.findIndex(r =>
          r.cedula == cedula && r.torneo === c.torneo
        );

        if (index !== -1) {
          const row = rows[index];

          const pagado = Number(row.valor_pagado || 0) + Number(c.valor || 0);
          const total = Number(row.valor_total || 0);
          const saldo = total - pagado;

          const estado = saldo <= 0 ? 'AL_DIA' : 'PARCIAL';

          await sheetsClient.updateRow('ESTADO_TORNEOS', index + 2, [
            row.club_id,
            row.cedula,
            row.nombre,
            row.torneo,
            total,
            pagado,
            saldo,
            estado
          ]);
        }
      }

      if (c.tipo === 'Otro') {
        mensaje_alerta = c.descripcion || 'Pago no categorizado';
      }
    }

    res.json({
      success: true,
      id_transaccion
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

function parseConceptos(jsonStr) {
  try {
    return typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
  } catch {
    return [];
  }
}

module.exports = router;
