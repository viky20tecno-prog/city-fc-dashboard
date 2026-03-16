const express = require('express');
const SheetsClient = require('../services/sheets');

const router = express.Router();
const sheetsClient = new SheetsClient();

/**
 * GET /api/payments?club_id=city-fc&limit=50
 * Historial de pagos registrados
 * Query params:
 *   - limit: cantidad máxima de registros (default 50)
 *   - cedula: filtrar por cédula del jugador (opcional)
 *   - estado_revision: filtrar por estado (opcional)
 */
router.get('/', async (req, res) => {
  try {
    const club_id = req.club_id || 'city-fc';
    const { limit = 50, cedula, estado_revision } = req.query;
    
    // Obtener todos los pagos
    let payments = await sheetsClient.getAllRows('REGISTRO_PAGOS');
    
    // Filtrar por cédula si aplica
    if (cedula) {
      payments = payments.filter(p => p.cedula === cedula);
    }
    
    // Filtrar por estado de revisión si aplica
    if (estado_revision) {
      payments = payments.filter(p => p.estado_revision === estado_revision);
    }
    
    // Ordenar por fecha más reciente primero
    payments.sort((a, b) => {
      const dateA = new Date(a.fecha_proceso || 0);
      const dateB = new Date(b.fecha_proceso || 0);
      return dateB - dateA;
    });
    
    // Limitar a X registros
    const limitNum = Math.min(parseInt(limit) || 50, 500);
    payments = payments.slice(0, limitNum);
    
    // Mapear a formato API
    const mapped = payments.map(p => ({
      id_transaccion: p.id_transaccion,
      fecha_proceso: p.fecha_proceso,
      cedula: p.cedula,
      nombre_detectado: p.nombre_detectado || '',
      monto: parseFloat(p.monto_imagen) || 0,
      fecha_comprobante: p.fecha_comprobante,
      banco: p.banco,
      referencia: p.referencia,
      concepto: p.conceptos_json ? parseConceptos(p.conceptos_json) : [],
      suma_conceptos: parseFloat(p.suma_conceptos) || 0,
      validacion_monto: p.validacion_monto,
      estado_revision: p.estado_revision,
      mensaje_alerta: p.mensaje_alerta || '',
      url_comprobante: p.url_comprobante || '',
    }));
    
    res.json({
      success: true,
      club_id,
      total_registros: mapped.length,
      limit: limitNum,
      filters: { cedula: cedula || 'TODOS', estado_revision: estado_revision || 'TODOS' },
      data: mapped,
    });
  } catch (error) {
    console.error('Error in GET /payments:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching payments',
      message: error.message,
    });
  }
});

/**
 * POST /api/payments
 * Registrar un pago manual (desde dashboard o webhook Make)
 * Body:
 * {
 *   cedula: string,
 *   nombre_detectado: string,
 *   monto: number,
 *   fecha_comprobante: string (YYYY-MM-DD),
 *   banco: string,
 *   referencia: string,
 *   conceptos: [ { tipo: "mensualidad", valor: 65000 }, ... ],
 *   url_comprobante: string (opcional),
 * }
 */
router.post('/', async (req, res) => {
  try {
    const club_id = req.club_id || 'city-fc';
    const {
      cedula,
      nombre_detectado,
      monto,
      fecha_comprobante,
      banco,
      referencia,
      conceptos = [],
      url_comprobante = '',
    } = req.body;
    
    // Validar campos requeridos
    if (!cedula || !monto || !banco) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: cedula, monto, banco',
      });
    }
    
    // Validar que el jugador existe
    const player = await sheetsClient.searchRow('JUGADORES', 'cedula', cedula);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
        cedula,
      });
    }
    
    // Generar ID de transacción
    const id_transaccion = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Preparar fila para insertar
    const newPayment = [
      id_transaccion,
      new Date().toISOString().split('T')[0], // fecha_proceso (hoy)
      cedula,
      nombre_detectado || player['nombre(s)'] || '',
      monto,
      fecha_comprobante || new Date().toISOString().split('T')[0],
      new Date().getFullYear(), // anio_sistema
      banco,
      referencia || '',
      JSON.stringify(conceptos), // conceptos_json
      conceptos.reduce((sum, c) => sum + (c.valor || 0), 0), // suma_conceptos
      monto >= conceptos.reduce((sum, c) => sum + (c.valor || 0), 0) ? 'correcto' : 'discrepancia', // validacion_monto
      'aprobado_automaticamente', // estado_revision (por defecto)
      '', // mensaje_alerta
      url_comprobante,
    ];
    
    // Insertar en REGISTRO_PAGOS
    await sheetsClient.appendRow('REGISTRO_PAGOS', newPayment);
    
    res.json({
      success: true,
      club_id,
      id_transaccion,
      mensaje: 'Pago registrado exitosamente',
      pago: {
        id_transaccion,
        cedula,
        monto,
        banco,
        referencia,
        estado: 'aprobado_automaticamente',
        fecha_proceso: new Date().toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Error in POST /payments:', error);
    res.status(500).json({
      success: false,
      error: 'Error registering payment',
      message: error.message,
    });
  }
});

/**
 * Helper: Parsear JSON de conceptos
 */
function parseConceptos(jsonStr) {
  try {
    if (typeof jsonStr === 'string') {
      return JSON.parse(jsonStr);
    }
    return jsonStr || [];
  } catch (e) {
    return [];
  }
}

module.exports = router;
