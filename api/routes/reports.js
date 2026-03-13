const express = require('express');
const { getSheetData } = require('../services/sheets');

const router = express.Router();

/**
 * GET /api/reports/summary?club_id=city-fc
 */
router.get('/summary', async (req, res) => {
  try {
    const { club_id } = req;
    
    const jugadores = await getSheetData('JUGADORES', club_id);
    const mensualidades = await getSheetData('ESTADO_MENSUALIDADES', club_id);
    
    const total_jugadores = jugadores.length;
    const activos = jugadores.filter(j => j.activo === 'SI').length;
    const en_mora = mensualidades.filter(m => m.estado === 'MORA').length;
    
    // Recaudacion mes actual
    const hoy = new Date();
    const mes_actual = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const ano_actual = hoy.getFullYear();
    
    const pagos_mes = mensualidades.filter(m => 
      m.mes === mes_actual && m.anio === ano_actual
    );
    const recaudacion = pagos_mes.reduce((sum, m) => sum + (parseInt(m.valor_pagado) || 0), 0);
    
    res.json({
      total_jugadores,
      activos,
      inactivos: total_jugadores - activos,
      en_mora,
      recaudacion_mes_actual: recaudacion,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reports/defaulters?club_id=city-fc
 */
router.get('/defaulters', async (req, res) => {
  try {
    const { club_id } = req;
    
    const mensualidades = await getSheetData('ESTADO_MENSUALIDADES', club_id);
    const morosos = mensualidades.filter(m => m.estado === 'MORA' || m.estado === 'PENDIENTE');
    
    res.json(morosos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
