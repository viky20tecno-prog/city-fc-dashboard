const express = require('express');
const cors = require('cors');
require('dotenv').config();

const playersRouter = require('./routes/players');
const invoicesRouter = require('./routes/invoices');
const paymentsRouter = require('./routes/payments');
const configRouter = require('./routes/config');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
app.use((req, res, next) => {
  const club_id = req.query.club_id || req.body.club_id;
  if (!club_id) {
    return res.status(400).json({ error: 'club_id requerido' });
  }
  req.club_id = club_id;
  next();
});

// Routes
app.use('/api/players', playersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/config', configRouter);
app.use('/api/reports', reportsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
