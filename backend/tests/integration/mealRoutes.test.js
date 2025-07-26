const request = require('supertest');
const express = require('express');
const mealRoutes = require('../../routes/mealRoutes');
const { authenticate } = require('../../middleware/authMiddleware'); // Adjust path as needed

// Correct way to define mocks for Jest
// Define all mock functions *inside* the jest.mock factory
// This ensures they are defined when Jest evaluates this mock.
jest.mock('../../utils/supabaseClient', () => {
  const mockAuthGetUser = jest.fn();
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockOrder = jest.fn();
  const mockSingle = jest.fn();
  const mockMaybeSingle = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();

  // Return the object that the mock will represent
  return {
    auth: {
      getUser: mockAuthGetUser,
    },
    from: mockFrom,
    // Export all the individual mock functions so we can access them in tests
    // using `supabase.<methodName>` or by re-exporting them from this mock.
    // For convenience in tests, we can re-export them from here.
    // However, the best practice is to access them via the `supabase` object directly.
    // We will ensure that the `beforeEach` block sets up their behaviors.
    _mockAuthGetUser: mockAuthGetUser, // Export for direct access in tests if needed (less common)
    _mockFrom: mockFrom,
    _mockSelect: mockSelect,
    _mockEq: mockEq,
    _mockOrder: mockOrder,
    _mockSingle: mockSingle,
    _mockMaybeSingle: mockMaybeSingle,
    _mockInsert: mockInsert,
    _mockUpdate: mockUpdate,
    _mockDelete: mockDelete,
  };
});

// Now import `supabase` *after* defining its mock, so it imports the mocked version.
const supabase = require('../../utils/supabaseClient');


const app = express();
app.use(express.json());

// Apply the actual (but internally mocked) authentication middleware
app.use(authenticate);

// Use the mealRoutes router
app.use('/api/meals', mealRoutes);

describe('Meal Routes', () => {

  beforeEach(() => {
    jest.clearAllMocks(); // Clear call counts and reset mock implementations

    // --- Reset default chainable mock behaviors for .from() ---
    // Ensure all methods return 'this' for chaining
    supabase._mockSelect.mockReturnThis();
    supabase._mockEq.mockReturnThis();
    supabase._mockOrder.mockReturnThis();
    supabase._mockSingle.mockReturnThis();
    supabase._mockMaybeSingle.mockReturnThis();
    supabase._mockInsert.mockReturnThis();
    supabase._mockUpdate.mockReturnThis();
    supabase._mockDelete.mockReturnThis();

    // Default resolved values for terminal methods
    supabase._mockOrder.mockResolvedValue({ data: [], error: null });
    supabase._mockSingle.mockResolvedValue({ data: null, error: null });
    supabase._mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    supabase._mockInsert.mockResolvedValue({ data: [], error: null });
    supabase._mockUpdate.mockResolvedValue({ data: [], error: null });
    supabase._mockDelete.mockResolvedValue({ data: [], error: null });

    // Handle the specific `select('id', { count: 'exact', head: true })` case
    supabase._mockSelect.mockImplementation((columns, options) => {
      if (options && options.count === 'exact' && options.head === true) {
        return {
          eq: jest.fn(() => ({
            then: jest.fn(callback => callback({ count: 0, error: null })), // Default count to 0
          })),
        };
      }
      // This is crucial: return the builder for continued chaining for non-count selects
      return {
        select: supabase._mockSelect,
        eq: supabase._mockEq,
        order: supabase._mockOrder,
        single: supabase._mockSingle,
        maybeSingle: supabase._mockMaybeSingle,
        insert: supabase._mockInsert,
        update: supabase._mockUpdate,
        delete: supabase._mockDelete,
      };
    });


    // Implement supabase.from to always return the consistent builder object
    supabase._mockFrom.mockImplementation((table) => {
      return {
        select: supabase._mockSelect,
        eq: supabase._mockEq,
        order: supabase._mockOrder,
        single: supabase._mockSingle,
        maybeSingle: supabase._mockMaybeSingle,
        insert: supabase._mockInsert,
        update: supabase._mockUpdate,
        delete: supabase._mockDelete,
      };
    });

    // --- Set default successful authentication for most tests ---
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: '11111111-1111-1111-1111-111111111111' } },
      error: null,
    });
  });

  it('GET /api/meals should return enriched meals', async () => {
    // 1. Mock the main 'meals' query (supabase.from('meals').select().eq().order())
    // We target the *last* method in the chain that returns data: `order`
    supabase._mockOrder.mockResolvedValueOnce({
      data: [{ id: 'meal1', user_id: '11111111-1111-1111-1111-111111111111' }],
      error: null,
    });

    // 2. Mocks for Promise.all: likesCount, savesCount, comments
    // The `select` method itself is mocked to handle the `count` option.
    // We need to ensure that when `select('id', { count: 'exact', head: true })` is called,
    // it returns the correct count.
    // The order of these mockImplementationOnce calls on `_mockSelect` matters
    // as they will be consumed sequentially for the different `select` calls made by your controller.
    supabase._mockSelect.mockImplementationOnce((columns, options) => {
      if (options && options.count === 'exact' && options.head === true) {
        return {
          eq: jest.fn(() => ({
            then: jest.fn(callback => callback({ count: 5, error: null })), // For likesCount
          })),
        };
      }
      // Fallback for this specific call to ensure the general mock behaviour
      return {
        select: supabase._mockSelect, // Return chainable mock for others
        eq: supabase._mockEq,
        order: supabase._mockOrder,
        single: supabase._mockSingle,
        maybeSingle: supabase._mockMaybeSingle,
        insert: supabase._mockInsert,
        update: supabase._mockUpdate,
        delete: supabase._mockDelete,
      };
    });
    supabase._mockSelect.mockImplementationOnce((columns, options) => {
      if (options && options.count === 'exact' && options.head === true) {
        return {
          eq: jest.fn(() => ({
            then: jest.fn(callback => callback({ count: 2, error: null })), // For savesCount
          })),
        };
      }
      return {
        select: supabase._mockSelect,
        eq: supabase._mockEq,
        order: supabase._mockOrder,
        single: supabase._mockSingle,
        maybeSingle: supabase._mockMaybeSingle,
        insert: supabase._mockInsert,
        update: supabase._mockUpdate,
        delete: supabase._mockDelete,
      };
    });

    // For comments: this is a regular select, targeting the order method
    supabase._mockOrder.mockResolvedValueOnce({
      data: [{ content: 'Great meal!', created_at: '2024-01-01', user_id: 'user2' }],
      error: null,
    });

    // 3. Mocks for userLike and userSave (single results)
    // These are also regular select calls, but their chain ends with .single()
    supabase._mockSingle.mockResolvedValueOnce({ data: { id: 'like1' }, error: null }); // For isLikedByCurrentUser
    supabase._mockSingle.mockResolvedValueOnce({ data: { id: 'save1' }, error: null }); // For isSavedByCurrentUser


    const res = await request(app)
      .get('/api/meals')
      .set('Authorization', 'Bearer dummy-token');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const meal = res.body[0];
    expect(meal).toHaveProperty('likesCount', 5);
    expect(meal).toHaveProperty('savesCount', 2);
    expect(meal).toHaveProperty('comments');
    expect(meal.comments).toEqual([{ content: 'Great meal!', created_at: '2024-01-01', user_id: 'user2' }]);
    expect(meal).toHaveProperty('isLikedByCurrentUser', true);
    expect(meal).toHaveProperty('isSavedByCurrentUser', true);

    expect(supabase.auth.getUser).toHaveBeenCalledWith('dummy-token'); // Check the auth mock
    expect(supabase.from).toHaveBeenCalledWith('meals');
    expect(supabase.from).toHaveBeenCalledWith('meal_likes');
    expect(supabase.from).toHaveBeenCalledWith('meal_saves');
    expect(supabase.from).toHaveBeenCalledWith('meal_comments');

    // More granular assertions for chained calls can be added here if necessary
    // E.g., expect(supabase._mockSelect).toHaveBeenCalledWith('*')
    // expect(supabase._mockEq).toHaveBeenCalledWith('user_id', '11111111-1111-1111-1111-111111111111');
  });

  it('GET /api/meals should return 500 on Supabase error', async () => {
    // Mock for initial 'meals' query to return an error from the `order` method
    supabase._mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: 'Supabase error' },
    });

    const res = await request(app)
      .get('/api/meals')
      .set('Authorization', 'Bearer another-dummy-token');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Supabase error');

    expect(supabase.auth.getUser).toHaveBeenCalledWith('another-dummy-token');
    expect(supabase.from).toHaveBeenCalledWith('meals');
  });

  it('GET /api/meals should return 401 if no token provided', async () => {
    const res = await request(app).get('/api/meals');

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('No token provided');
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });

  it('GET /api/meals should return 401 if token is invalid', async () => {
    // Mock supabase.auth.getUser to return an error/null user for this specific test
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null }, // Simulate invalid token
      error: { message: 'JWT expired' }, // The error message from authMiddleware
    });

    const res = await request(app)
      .get('/api/meals')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid token'); // Matches your auth middleware's error message
    expect(supabase.auth.getUser).toHaveBeenCalledWith('invalid-token');
  });
});