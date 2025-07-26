const request = require('supertest');
const express = require('express');
const expressApp = express();
expressApp.use(express.json());

// Attach mock user for authentication (needed for req.user.id)
expressApp.use((req, res, next) => {
  req.user = { id: 'user1' };
  next();
});

// --- Start of Redis Mocks ---
// Define mock functions for Redis methods
const mockRedisGet = jest.fn();
const mockRedisSetEx = jest.fn();

// Mock the entire '../../utils/redis' module
jest.mock('../../utils/redis', () => ({
  redisClient: {
    get: mockRedisGet,
    setEx: mockRedisSetEx,
    // Add other methods if they are called in your controller and need mocking
    // e.g., connect, quit, on if your controller directly uses them
    connect: jest.fn().mockResolvedValue(), // Add if connect is called in context
    quit: jest.fn().mockResolvedValue(),   // Add if quit is called in context
    on: jest.fn(),                         // Add if on is called for events
  },
}));
// --- End of Redis Mocks ---


// --- Start of Supabase Mocks ---
const mockOrder = jest.fn();
const mockGte = jest.fn(() => ({ order: mockOrder }));
const mockEq = jest.fn(() => ({ gte: mockGte }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      from: mockFrom,
    }),
  };
});
// --- End of Supabase Mocks ---


// Import controller AFTER all mocks are defined
const macroController = require('../../controllers/macroController');
expressApp.get('/api/macros/history/:id', macroController.getMacroHistory);

describe('GET /api/macros/history', () => {
  beforeEach(() => {
    // Clear all mock call histories before each test
    jest.clearAllMocks();

    // Reset mock implementations to their default behavior for each test
    // This is crucial to prevent state leakage from previous tests.
    mockRedisGet.mockResolvedValue(null); // Default: cache miss
    mockRedisSetEx.mockResolvedValue('OK'); // Default: set successful

    // Reset Supabase mocks as well, even though clearAllMocks() covers call history
    // mockFrom and its chained methods will be reset by clearAllMocks
  });

  it('should return 7-day macro history with sanitized null values', async () => {
    // We want this test to go through Supabase and then cache the result.
    // So, we ensure Redis is initially empty.
    mockRedisGet.mockResolvedValueOnce(null); // Explicitly ensure cache miss for this specific call

    mockOrder.mockReturnValue({
      data: [
        { date: '2023-07-01', calories: 2000, protein: 100, carbs: 250, fat: 70 },
        { date: '2023-07-02', calories: null, protein: null, carbs: null, fat: null }
      ],
      error: null
    });

    const res = await request(expressApp).get('/api/macros/history/user1');

    expect(mockRedisGet).toHaveBeenCalledWith('macro_history:user1');
    expect(mockFrom).toHaveBeenCalledWith("daily_macro_history");
    expect(mockSelect).toHaveBeenCalledWith("date, calories, protein, carbs, fat");
    expect(mockEq).toHaveBeenCalledWith("id", "user1");
    expect(mockGte).toHaveBeenCalled();
    expect(mockOrder).toHaveBeenCalledWith("date", { ascending: true });
    expect(mockRedisSetEx).toHaveBeenCalled(); // Expect caching to occur

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([
      {
        date: '2023-07-01',
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 70
      },
      {
        date: '2023-07-02',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      }
    ]);
  });

  it('should return 500 on Supabase error', async () => {
    // We want this test to try to fetch from Supabase, and then get an error.
    // So, we ensure Redis is initially empty.
    mockRedisGet.mockResolvedValueOnce(null); // Explicitly ensure cache miss for this specific call

    mockOrder.mockReturnValue({ // This mock will only be hit if Supabase is called
      data: null,
      error: { message: 'DB Failure' }
    });

    const res = await request(expressApp).get('/api/macros/history/user1');

    expect(mockRedisGet).toHaveBeenCalledWith('macro_history:user1');
    expect(mockFrom).toHaveBeenCalledWith("daily_macro_history"); // This should now be called
    expect(mockSelect).toHaveBeenCalledWith("date, calories, protein, carbs, fat");
    expect(mockEq).toHaveBeenCalledWith("id", "user1");
    expect(mockGte).toHaveBeenCalled();
    expect(mockOrder).toHaveBeenCalledWith("date", { ascending: true });
    expect(mockRedisSetEx).not.toHaveBeenCalled(); // No caching on error

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Failed to fetch macro history');
  });

  // Optional: Add a test for cache hit scenario (good to confirm caching works as expected)
  it('should return cached data if available', async () => {
    const cachedData = [{ date: '2023-07-01', calories: 1000, protein: 50, carbs: 120, fat: 30 }];
    // For this test, we want to simulate a cache hit.
    mockRedisGet.mockResolvedValueOnce(JSON.stringify(cachedData)); // Simulate a cache hit

    const res = await request(expressApp).get('/api/macros/history/user1');

    expect(mockRedisGet).toHaveBeenCalledWith('macro_history:user1');
    expect(mockFrom).not.toHaveBeenCalled(); // Supabase should NOT be called if cached
    expect(mockRedisSetEx).not.toHaveBeenCalled(); // No new caching

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(cachedData);
  });
});