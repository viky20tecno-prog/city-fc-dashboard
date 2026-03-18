const express = require('express');
const SheetsClient = require('../services/sheets');

const router = express.Router();
const sheetsClient = new SheetsClient();

/**
 * GET /api/uniforms
 * Lista todos los pedidos de uniformes
 */
router.get('/', async (req, res) => {
  try {
    const pedidos = await sheetsClient.getAllRows('PEDIDO_UNIFORMES');
    res.json({
      success: true,
      total: pedidos.length,
      data: pedidos,
    });
  } catch (error) {
    console.error('Error in GET /uniforms:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching uniforms',
      message: error.message,
    });
  }
});

/**
 * GET /api/uniforms/numeros
 * Devuelve los números ya asignados para validar duplicados
 */
router.get('/numeros', async (req, res) => {
  try {
    const pedidos = await sheetsClient.getAllRows('PEDIDO_UNIFORMES');
    const numerosUsados = pedidos.map(p => p.NUMERO).filter(Boolean);
    res.json({
      success: true,
      numeros: numerosUsados,
    });
  } catch (error) {
    console.error('Error in GET /uniforms/numeros:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching numbers',
      message: error.message,
    });
  }
});

/**
 * POST /api/uniforms
 * Registrar pedido de uniforme
 */
router.post('/', async (req, res) => {
  try {
    const { cedula, nombre, tipo, nombre_estampar, talla, numero } = req.body;

    // Validar campos obligatorios
    if (!cedula || !nombre || !tipo || !talla || !numero) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos obligatorios',
      });
    }

    // Validar que el jugador existe
    const jugador = await sheetsClient.searchRow('JUGADORES', 'cedula', cedula);
    if (!jugador) {
      return res.status(404).json({
        success: false,
        error: 'Jugador no encontrado',
        message: 'La cédula no corresponde a ningún jugador inscrito',
      });
    }

    // Validar que el jugador no tenga ya un pedido
    const pedidoExistente = await sheetsClient.searchRow('PEDIDO_UNIFORMES', 'CEDULA', cedula);
    if (pedidoExistente) {
      return res.status(409).json({
        success: false,
        error: 'Pedido duplicado',
        message: 'Este jugador ya tiene un pedido de uniforme registrado',
      });
    }

    // Validar que el número no esté repetido
    const pedidos = await sheetsClient.getAllRows('PEDIDO_UNIFORMES');
    const numeroRepetido = pedidos.some(p => p.NUMERO === String(numero));
    if (numeroRepetido) {
      return res.status(409).json({
        success: false,
        error: 'Número repetido',
        message: `El número ${numero} ya está asignado a otro jugador`,
      });
    }

    // Guardar en PEDIDO_UNIFORMES
    const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    await sheetsClient.appendRow('PEDIDO_UNIFORMES', [
      cedula,
      nombre,
      tipo,
      nombre_estampar || '',
      talla,
      numero,
      fecha,
      'PENDIENTE',
    ]);

    res.json({
      success: true,
      message: 'Pedido de uniforme registrado exitosamente',
      data: { cedula, nombre, tipo, nombre_estampar, talla, numero, fecha },
    });

  } catch (error) {
    console.error('Error in POST /uniforms:', error);
    res.status(500).json({
      success: false,
      error: 'Error registrando pedido',
      message: error.message,
    });
  }
});

module.exports = router;
