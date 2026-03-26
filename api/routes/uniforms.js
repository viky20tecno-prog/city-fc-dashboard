const express = require('express');
const SheetsClient = require('../services/sheets');

const router = express.Router();
const sheetsClient = new SheetsClient();
const CLUB_ID = 'city-fc';

/**
 * GET /api/uniforms
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
 */
router.get('/numeros', async (req, res) => {
  try {
    const pedidos = await sheetsClient.getAllRows('PEDIDO_UNIFORMES');
    // ✅ Leer columna correcta y normalizar a entero para evitar problemas con ceros
    const numerosUsados = pedidos
      .map(p => p.numero_estampar || p.numero)
      .filter(Boolean)
      .map(n => String(parseInt(n, 10)));
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
 */
router.post('/', async (req, res) => {
  try {
    const { cedula, nombre, tipo, campeon, nombre_estampar, talla, numero } = req.body;

    if (!cedula || !nombre || !tipo || !talla || !numero) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos obligatorios',
      });
    }

    const jugador = await sheetsClient.searchRow('JUGADORES', 'cedula', cedula);
    if (!jugador) {
      return res.status(404).json({
        success: false,
        error: 'Jugador no encontrado',
        message: 'La cédula no corresponde a ningún jugador inscrito',
      });
    }

    const pedidoExistente = await sheetsClient.searchRow('PEDIDO_UNIFORMES', 'cedula', cedula);
    if (pedidoExistente) {
      return res.status(409).json({
        success: false,
        error: 'Pedido duplicado',
        message: 'Este jugador ya tiene un pedido de uniforme registrado',
      });
    }

    // ✅ Validar número repetido comparando como enteros
    const pedidos = await sheetsClient.getAllRows('PEDIDO_UNIFORMES');
    const numeroNormalizado = String(parseInt(numero, 10));
    const numeroRepetido = pedidos.some(p => {
      const n = p.numero_estampar || p.numero;
      return n && String(parseInt(n, 10)) === numeroNormalizado;
    });

    if (numeroRepetido) {
      return res.status(409).json({
        success: false,
        error: 'Número repetido',
        message: `El número ${numero} ya está asignado a otro jugador`,
      });
    }

    const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    await sheetsClient.appendRow('PEDIDO_UNIFORMES', [
      CLUB_ID,
      cedula,
      nombre,
      tipo,
      campeon ? 'SI' : 'NO',
      talla,
      nombre_estampar || '',
      numero,
      fecha,
      'PENDIENTE',
    ]);

    res.json({
      success: true,
      message: 'Pedido de uniforme registrado exitosamente',
      data: { club_id: CLUB_ID, cedula, nombre, tipo, campeon, talla, nombre_estampar, numero, fecha },
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
