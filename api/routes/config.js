const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'GET /api/config - Implementar', club_id: req.club_id });
});

module.exports = router;
