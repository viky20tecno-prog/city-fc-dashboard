const express = require('express');
const router = express.Router();

router.get('/summary', (req, res) => {
  res.json({ message: 'GET /api/reports/summary - Implementar', club_id: req.club_id });
});

router.get('/defaulters', (req, res) => {
  res.json({ message: 'GET /api/reports/defaulters - Implementar', club_id: req.club_id });
});

module.exports = router;
