const express = require('express');
const { getSheetData, appendSheetData } = require('../services/sheets');

const router = express.Router();

/**
 * GET /api/payments?club_id=city-fc
 */
router.get('/', async (req, res) => {
  try {
    const { club_id } = req;
    const data = await getSheetData('REGISTRO_PAGOS', club_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payments
 * Body: { club_id, cedula, monto, fecha, banco, referencia, concepto, source }
 */
router.post('/', async (req, res) => {
  try {
    const { club_id } = req;
    const { cedula, monto, fecha, banco, referencia, concepto, source } = req.body;
    
    if (!cedula || !monto) {
      return res.status(400).json({ error: 'cedula y monto requeridos' });
    }
    
    // TODO: Lógica de aplicar pago a factura, actualizar estado
    // Por ahora, solo agregar a REGISTRO_PAGOS
    
    const id_transaccion = `PAY-${Date.now()}`;
    const values = [
      club_id,
      id_transaccion,
      new Date().toISOString().split('T')[0],
      '', // telefono
      '', // nombre_detectado
      monto,
      fecha,
      new Date().getFullYear(),
      banco,
      referencia,
      concepto,
      monto,
      'correcto',
      'PENDIENTE_APLICACION',
      '',
      '',
    ];
    
    await appendSheetData('REGISTRO_PAGOS', values);
    
    res.json({ 
      success: true, 
      id_transaccion,
      message: 'Pago registrado (pendiente aplicación)' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
