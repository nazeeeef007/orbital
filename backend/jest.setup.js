// backend/jest.setup.js (or tests/jest.setup.js)
const { connectRedis, disconnectRedis } = require('./utils/redis'); // Adjust path as needed

// Connect Redis before all tests run
beforeAll(async () => {
  console.log('Jest beforeAll: Connecting Redis client for tests...');
  await connectRedis();
});

// Disconnect Redis after all tests have finished
afterAll(async () => {
  console.log('Jest afterAll: Disconnecting Redis client after tests...');
  await disconnectRedis();
});

// Optional: If you want to clear Redis data between test runs.
// Use with caution, as it clears ALL data in the selected Redis DB.
// afterEach(async () => {
//   const { redisClient } = require('./utils/redis');
//   if (redisClient.isReady) {
//     console.log('Jest afterEach: Flushing Redis DB...');
//     await redisClient.flushDb();
//   }
// });