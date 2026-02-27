const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./modules/auth/routes/auth.routes');
const errorHandler = require('./shared/middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.use('/api/v1/auth', authRoutes);

app.use('*splat', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
