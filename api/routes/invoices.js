const express = require('express');
const { getSheetData } = require('../services/sheets');

const router = express.Router();

/**
 * GET /api/invoices?club_id=city-fc&status=PENDIENTE
 */
router.get('/', async (req, res) => {
  try {
    const { club_id } = req;
    const { status } = req.query;
    
    const data = await getSheetData('ESTADO_MENSUALIDADES', club_id);
    
    if (status) {
      return res.json(data.filter(inv => inv.estado === status));
    }
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/invoices/player/:cedula?club_id=city-fc
 */
router.get('/player/:cedula', async (req, res) => {
  try {
    const { club_id } = req;
    const { cedula } = req.params;
    
    const data = await getSheetData('ESTADO_MENSUALIDADES', club_id);
    const invoices = data.filter(inv => inv.cedula === cedula);
    
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
