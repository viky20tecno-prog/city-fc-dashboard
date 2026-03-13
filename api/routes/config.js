const express = require('express');

const router = express.Router();

/**
 * GET /api/config?club_id=city-fc
 */
router.get('/', async (req, res) => {
  try {
    const { club_id } = req;
    
    // TODO: Leer de tabla clubs cuando exista en Postgres
    // Por ahora, valores hardcoded
    
    const config = {
      club_id,
      tarifas: {
        mensualidad: 65000,
        mora_diaria: 2000,
      },
      reglas_mora: {
        dias_preventivo: 25,
        dias_cobro_activo: 1,
        dias_recordatorio: 4,
        dias_vencimiento: 7,
      },
      mensajes: {
        preventivo: 'Recuerda que tu cuota vence pronto',
        mora: 'Tu cuenta está en mora',
      },
    };
    
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
