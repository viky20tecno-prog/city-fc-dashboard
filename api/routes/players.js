const express = require('express');
const { getSheetData } = require('../services/sheets');

const router = express.Router();

/**
 * GET /api/players?club_id=city-fc
 */
router.get('/', async (req, res) => {
  try {
    const { club_id } = req;
    const data = await getSheetData('JUGADORES', club_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/players/:cedula?club_id=city-fc
 */
router.get('/:cedula', async (req, res) => {
  try {
    const { club_id } = req;
    const { cedula } = req.params;
    
    const data = await getSheetData('JUGADORES', club_id);
    const player = data.find(p => p.cedula === cedula);
    
    if (!player) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }
    
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
