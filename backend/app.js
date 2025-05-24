const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const chatBotRoutes = require('./routes/chatBotRoutes');

// ✅ Enable CORS for frontend at localhost:5173
app.use(cors({
  origin: 'http://localhost:8081',
  credentials: true, // Optional: if using cookies/auth headers
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/bot', chatBotRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
