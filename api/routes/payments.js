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

    res.json({ success: true, data: payments });

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
      url_comprobante = '',
      observacion = '',
      meses = []
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

    await sheetsClient.appendRow('REGISTRO_PAGOS', [
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
      monto >= suma_conceptos ? 'correcto' : 'discrepancia',
      'PENDIENTE',
      observacion,
      url_comprobante
    ]);

    // ===== ACTUALIZAR MENSUALIDADES =====
    if (conceptos.some(c => c.tipo === 'mensualidad') && meses.length > 0) {

      const valorPorMes = monto / meses.length;
      const rows = await sheetsClient.getAllRows('ESTADO_MENSUALIDADES');

      for (const mes of meses) {
        const index = rows.findIndex(r =>
          r.cedula == cedula &&
          Number(r.numero_mes) === mes &&
          Number(r.anio) === 2026
        );

        if (index !== -1) {
          const row = rows[index];

          const pagado = Number(row.valor_pagado || 0) + valorPorMes;
          const total = Number(row.valor_oficial || 0);
          const saldo = total - pagado;

          let estado = 'PARCIAL';
          if (saldo <= 0) estado = 'AL_DIA';

          await sheetsClient.updateRow('ESTADO_MENSUALIDADES', index + 2, [
            row.club_id,
            row.cedula,
            row.nombre,
            row.anio,
            row.mes,
            row.numero_mes,
            total,
            pagado,
            saldo,
            estado,
            new Date().toISOString().split('T')[0]
          ]);
        }
      }
    }

    res.json({ success: true, id_transaccion });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
