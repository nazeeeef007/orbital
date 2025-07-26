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
    try {
      await redisClient.connect();
      console.log('Redis client connected successfully.');
    } catch (err) {
      console.error('Failed to connect Redis client:', err);
    }
  } else {
    console.log('Redis client is already open.');
  }
}

// Ensure this function is present and correctly defined
async function disconnectRedis() {
  if (redisClient.isOpen) {
    try {
      // Use quit() for a graceful shutdown, disconnect() is also an option
      await redisClient.quit();
      console.log('Redis client disconnected successfully.');
    } catch (err) {
      console.error('Failed to disconnect Redis client:', err);
    }
  } else {
    console.log('Redis client is not open to disconnect.');
  }
}

module.exports = {
  redisClient,
  connectRedis,
  disconnectRedis, // <--- THIS LINE IS CRUCIAL AND MUST BE PRESENT
};