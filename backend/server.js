// backend/server.js
const app = require('./app');
const { connectRedis } = require('./utils/redis'); // 👈 Import Redis connection

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectRedis(); // 👈 Connect to Redis before starting the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on ${process.env.BASE_URL}:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();
