const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'GET /api/invoices - Implementar', club_id: req.club_id });
});

router.get('/player/:cedula', (req, res) => {
  res.json({ message: 'GET /api/invoices/player/:cedula - Implementar', cedula: req.params.cedula });
});

module.exports = router;
