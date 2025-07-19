// backend/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const authRoutes     = require('./routes/authRoutes');
const profileRoutes  = require('./routes/profileRoutes');
const botRoutes      = require('./routes/botRoutes');
const uploadRoutes   = require('./routes/uploadRoutes');
const mealRoutes     = require('./routes/mealRoutes');
const searchRoutes   = require('./routes/searchRoutes');
const macroRoutes    = require('./routes/macroRoutes');
const ingredientsRoutes = require('./routes/ingredientsRoutes');

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth',     authRoutes);
app.use('/api/profile',  profileRoutes);
app.use('/api/bot',      botRoutes);
app.use('/api/upload',   uploadRoutes);
app.use('/api/meals',    mealRoutes);
app.use('/api/search',   searchRoutes);
app.use('/api/macro',    macroRoutes);
app.use('/api/ingredients', ingredientsRoutes);

module.exports = app; // 👈 Export the app so tests can import it
