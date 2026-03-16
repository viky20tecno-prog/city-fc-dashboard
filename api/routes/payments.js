const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'GET /api/payments - Implementar', club_id: req.club_id });
});

router.post('/', (req, res) => {
  res.json({ message: 'POST /api/payments - Implementar', club_id: req.club_id });
});

module.exports = router;
