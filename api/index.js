const express = require('express');
const cors = require('cors');
require('dotenv').config();

const playersRouter = require('./routes/players');
const invoicesRouter = require('./routes/invoices');
const paymentsRouter = require('./routes/payments');
const configRouter = require('./routes/config');
const reportsRouter = require('./routes/reports');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check (sin validación club_id)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth middleware (aplica a las rutas de API)
app.use('/api', (req, res, next) => {
  const club_id = req.query.club_id || req.body.club_id;
  if (!club_id && req.path !== '/health') {
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

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}

// Exportar para Vercel
module.exports = app;
