const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const authRoutes     = require('./routes/authRoutes');
const profileRoutes  = require('./routes/profileRoutes');
const chatBotRoutes = require('./routes/chatBotRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const mealRoutes = require('./routes/mealRoutes');
const searchRoutes = require('./routes/searchRoutes');

app.use(cors({ origin: '*', credentials: true }));
// app.options('*', cors());

app.use(express.json());
app.use('/api/auth',     authRoutes);
app.use('/api/profile',  profileRoutes);
app.use('/api/bot', chatBotRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/search', searchRoutes);


const PORT     = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://${process.env.BASE_URL}:${PORT}`);
});
