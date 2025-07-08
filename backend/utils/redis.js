// utils/redis.js
const { createClient } = require('redis');
require('dotenv').config(); // Loads REDIS_URL from .env

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

// Optional: Handle errors
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

// Optional: Ready log
redisClient.on('ready', () => {
  console.log('✅ Redis is ready to use');
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

module.exports = {
  redisClient,
  connectRedis,
};
