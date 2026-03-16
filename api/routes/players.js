const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'GET /api/players - Implementar', club_id: req.club_id });
});

router.get('/:cedula', (req, res) => {
  res.json({ message: 'GET /api/players/:cedula - Implementar', cedula: req.params.cedula });
});

module.exports = router;
