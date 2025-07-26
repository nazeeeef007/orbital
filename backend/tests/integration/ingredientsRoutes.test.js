const request = require('supertest');
const express = require('express');

// --- IMPORTANT CHANGE: Mock the entire authMiddleware module ---
// This allows us to control the behavior of `authenticate` directly.
jest.mock('../../middleware/authMiddleware', () => ({
  authenticate: jest.fn((req, res, next) => {
    // Default behavior: Assume successful authentication
    // Set a dummy user ID on the request object, mimicking successful auth
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next(); // Proceed to the next middleware/route handler
  }),
}));

// Now, import the mocked authenticate function
const { authenticate } = require('../../middleware/authMiddleware');

// Import the router you are testing
const ingredientsRoutes = require('../../routes/ingredientsRoutes');


// --- Supabase Mock Setup (Keep this as is, it's correct for mocking Supabase itself) ---
const mockAuthGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIlike = jest.fn();
const mockSingle = jest.fn();

jest.mock('../../utils/supabaseClient', () => ({
  auth: {
    getUser: mockAuthGetUser,
  },
  from: mockFrom,
  _mockAuthGetUser: mockAuthGetUser,
  _mockFrom: mockFrom,
  _mockSelect: mockSelect,
  _mockEq: mockEq,
  _mockIlike: mockIlike,
  _mockSingle: mockSingle,
}));
const supabase = require('../../utils/supabaseClient');
// --- End Supabase Mock Setup ---


const app = express();
app.use(express.json());

// Apply the MOCKED authentication middleware
app.use(authenticate);

// Use the ingredientsRoutes router under the '/api/ingredients' base path
app.use('/api/ingredients', ingredientsRoutes);

describe('Ingredient Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mock call histories and reset their implementations

    // --- Configure Chainable Supabase Mocks in beforeEach ---
    // These ensure that calling .select(), .eq(), .ilike(), .single() on the mock `from`
    // returns a chainable object, allowing us to then set `mockResolvedValueOnce` on the final step.
    supabase._mockSelect.mockReturnThis();
    supabase._mockEq.mockReturnThis();
    supabase._mockIlike.mockReturnThis();
    supabase._mockSingle.mockReturnThis(); // Crucial for single() to return 'this' for potential chaining, though it usually resolves directly

    // Set up default resolved values for the final mock methods.
    // These defaults will be overridden by `mockResolvedValueOnce` in specific tests.
    supabase._mockSelect.mockResolvedValue({ data: [], error: null });
    supabase._mockSingle.mockResolvedValue({ data: null, error: null });
    supabase._mockIlike.mockResolvedValue({ data: [], error: null });

    supabase._mockFrom.mockImplementation((table) => {
      // This is the object that `.from()` call returns.
      // Its methods (`select`, `eq`, `ilike`, `single`) should be the mocks
      // that return `this` (the mockQuery object) or resolve.
      return {
        select: supabase._mockSelect,
        eq: supabase._mockEq,
        ilike: supabase._mockIlike,
        single: supabase._mockSingle,
      };
    });

    // --- Configure the MOCKED `authenticate` middleware's behavior ---
    // For most tests, `authenticate` should allow the request to pass.
    authenticate.mockImplementation((req, res, next) => {
      req.user = { id: 'test-user-id', email: 'test@example.com' };
      next(); // Success: call next to proceed to the route handler
    });

    // The supabase.auth.getUser mock is less directly impactful here
    // because `authenticate` middleware itself is mocked.
    // However, if any other part of your system or future tests depend on it,
    // keeping it mocked is good practice.
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    });
  });

  // --- Test Cases for GET /api/ingredients (getAllIngredients) ---
  describe('GET /api/ingredients', () => {
    it('should return 200 with all ingredients on success', async () => {
      // Mock data should match the expected structure from your Supabase table
      const mockIngredients = [
        {
          id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          name: 'Apple',
          description: 'A common red fruit',
          calories: 95,
          carbs: 25,
          fat: 0.3,
          protein: 0.5,
          weight: 182,
          created_at: '2025-06-28T10:00:00.000Z',
          updated_at: '2025-06-28T10:00:00.000Z',
        },
        {
          id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210',
          name: 'Banana',
          description: 'A yellow curved fruit',
          calories: 105,
          carbs: 27,
          fat: 0.4,
          protein: 1.3,
          weight: 118,
          created_at: '2025-06-28T10:05:00.000Z',
          updated_at: '2025-06-28T10:05:00.000Z',
        },
      ];
      // The final mock for the select() call
      supabase._mockSelect.mockResolvedValueOnce({ data: mockIngredients, error: null });

      const res = await request(app)
        .get('/api/ingredients')
        .set('Authorization', 'Bearer valid-token');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockIngredients);
      expect(supabase._mockFrom).toHaveBeenCalledWith('ingredients');
      expect(supabase._mockSelect).toHaveBeenCalledWith('*');
    });

    it('should return 500 on Supabase error when fetching all ingredients', async () => {
      // Simulate a Supabase error during the select operation
      supabase._mockSelect.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed', code: '500' }
      });

      const res = await request(app)
        .get('/api/ingredients')
        .set('Authorization', 'Bearer valid-token');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Internal Server Error');
      expect(res.body.details).toBe('Database connection failed'); // Matches the mock error message
      expect(supabase._mockFrom).toHaveBeenCalledWith('ingredients');
      expect(supabase._mockSelect).toHaveBeenCalledWith('*');
    });

    it('should return 401 if no token provided', async () => {
      // Temporarily override the mock for this specific test
      authenticate.mockImplementationOnce((req, res, next) => {
        // Mimic the actual middleware's behavior for no token
        return res.status(401).json({ error: 'No token provided' });
      });

      const res = await request(app).get('/api/ingredients');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('No token provided');
      expect(authenticate).toHaveBeenCalledTimes(1); // Check that the middleware was called
      expect(supabase._mockFrom).not.toHaveBeenCalled(); // No DB call if auth fails
    });

    it('should return 401 if token is invalid', async () => {
      // Temporarily override the mock for this specific test
      authenticate.mockImplementationOnce((req, res, next) => {
        // Mimic the actual middleware's behavior for invalid token
        return res.status(401).json({ error: 'Invalid token' });
      });

      const res = await request(app)
        .get('/api/ingredients')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid token');
      expect(authenticate).toHaveBeenCalledTimes(1); // Check that the middleware was called
      expect(supabase._mockFrom).not.toHaveBeenCalled(); // No DB call if auth fails
    });
  });

  // --- Test Cases for GET /api/ingredients/:id (getIngredientsById) ---
  describe('GET /api/ingredients/:id', () => {
    it('should return 200 with a single ingredient by ID on success', async () => {
      // Use a UUID for the ID as typically expected from Supabase
      const mockIngredient = {
        id: '12345678-abcd-efgh-ijkl-1234567890ab',
        name: 'Carrot',
        description: 'A crunchy orange root vegetable',
        calories: 41,
        carbs: 10,
        fat: 0.2,
        protein: 0.9,
        weight: 61,
        created_at: '2025-06-28T10:10:00.000Z',
        updated_at: '2025-06-28T10:10:00.000Z',
      };
      // The single() method is the final resolution in this chain
      supabase._mockSingle.mockResolvedValueOnce({ data: mockIngredient, error: null });

      const res = await request(app)
        .get(`/api/ingredients/${mockIngredient.id}`) // Use the mocked UUID
        .set('Authorization', 'Bearer valid-token');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockIngredient);
      expect(supabase._mockFrom).toHaveBeenCalledWith('ingredients');
      expect(supabase._mockSelect).toHaveBeenCalledWith('*');
      expect(supabase._mockEq).toHaveBeenCalledWith('id', mockIngredient.id);
      expect(supabase._mockSingle).toHaveBeenCalled();
    });

    it('should return 404 if ingredient not found (PGRST116 error)', async () => {
      // Simulate PGRST116 error (no rows found)
      supabase._mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'No rows found' } });

      const res = await request(app)
        .get('/api/ingredients/99999999-dead-beef-cafe-1234567890ab') // Use a valid UUID format for the request
        .set('Authorization', 'Bearer valid-token');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Ingredient not found');
      expect(supabase._mockFrom).toHaveBeenCalledWith('ingredients');
      expect(supabase._mockEq).toHaveBeenCalledWith('id', '99999999-dead-beef-cafe-1234567890ab');
      expect(supabase._mockSingle).toHaveBeenCalled();
    });

    it('should return 404 if ingredient not found (data is null, error is null)', async () => {
      // Simulate case where data is null and error is null (also indicates not found for single item)
      supabase._mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const res = await request(app)
        .get('/api/ingredients/99999999-dead-beef-cafe-1234567890ab')
        .set('Authorization', 'Bearer valid-token');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Ingredient not found');
      expect(supabase._mockFrom).toHaveBeenCalledWith('ingredients');
      expect(supabase._mockEq).toHaveBeenCalledWith('id', '99999999-dead-beef-cafe-1234567890ab');
      expect(supabase._mockSingle).toHaveBeenCalled();
    });

    it('should return 500 on other Supabase errors when fetching by ID', async () => {
      // Simulate a generic Supabase error
      supabase._mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Unexpected DB problem', code: '500' } });

      const res = await request(app)
        .get('/api/ingredients/some-other-uuid-that-fails-12345678')
        .set('Authorization', 'Bearer valid-token');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Internal Server Error');
      expect(res.body.details).toBe('Unexpected DB problem'); // Matches the mock error message
      expect(supabase._mockFrom).toHaveBeenCalledWith('ingredients');
      expect(supabase._mockEq).toHaveBeenCalledWith('id', 'some-other-uuid-that-fails-12345678');
      expect(supabase._mockSingle).toHaveBeenCalled();
    });

    it('should return 401 if no token provided', async () => {
      authenticate.mockImplementationOnce((req, res, next) => {
        return res.status(401).json({ error: 'No token provided' });
      });
      const res = await request(app).get('/api/ingredients/12345678-abcd-efgh-ijkl-1234567890ab');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('No token provided');
    });

    it('should return 401 if token is invalid', async () => {
      authenticate.mockImplementationOnce((req, res, next) => {
        return res.status(401).json({ error: 'Invalid token' });
      });

      const res = await request(app)
        .get('/api/ingredients/12345678-abcd-efgh-ijkl-1234567890ab')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });
  });

  // --- Test Cases for GET /api/ingredients/search?query=<query> (searchIngredients) ---
  describe('GET /api/ingredients/search', () => {
    it('should return 200 with matching ingredients for a query', async () => {
      // Mock search results matching the expected full Supabase schema
      const mockSearchResults = [
        {
          id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
          name: 'Granny Smith Apple',
          description: 'A tart green apple',
          calories: 80,
          carbs: 21,
          fat: 0.2,
          protein: 0.4,
          weight: 150,
          created_at: '2025-06-28T10:15:00.000Z',
          updated_at: '2025-06-28T10:15:00.000Z',
        },
        {
          id: 'fedcba98-7654-3210-fedc-ba9876543210',
          name: 'Red Delicious Apple',
          description: 'A sweet red apple',
          calories: 90,
          carbs: 23,
          fat: 0.3,
          protein: 0.5,
          weight: 160,
          created_at: '2025-06-28T10:20:00.000Z',
          updated_at: '2025-06-28T10:20:00.000Z',
        },
      ];
      // The ilike() method is the final resolution in this chain for search
      supabase._mockIlike.mockResolvedValueOnce({ data: mockSearchResults, error: null });

      const res = await request(app)
        .get('/api/ingredients/search?query=apple')
        .set('Authorization', 'Bearer valid-token');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockSearchResults);
      expect(supabase._mockFrom).toHaveBeenCalledWith('ingredients');
      expect(supabase._mockSelect).toHaveBeenCalledWith('*');
      // Expect the 'ilike' query to have wildcards on both ends
      expect(supabase._mockIlike).toHaveBeenCalledWith('name', '%apple%');
    });

    it('should return 400 if search query is missing', async () => {
      // For this test, authentication should succeed, but the controller
      // itself returns 400 because the query parameter is missing.
      authenticate.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'test-user-id' };
        next();
      });

      const res = await request(app)
        .get('/api/ingredients/search') // No 'query' parameter
        .set('Authorization', 'Bearer valid-token');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Search query is required.');
      expect(supabase._mockFrom).not.toHaveBeenCalled(); // No DB call if validation fails
    });

    it('should return 500 on Supabase error during search', async () => {
      // Simulate a Supabase error during the ilike operation
      supabase._mockIlike.mockResolvedValueOnce({ data: null, error: { message: 'Search query failed', code: '500' } });

      const res = await request(app)
        .get('/api/ingredients/search?query=test')
        .set('Authorization', 'Bearer valid-token');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Internal Server Error');
      expect(res.body.details).toBe('Search query failed'); // Matches the mock error message
      expect(supabase._mockFrom).toHaveBeenCalledWith('ingredients');
      expect(supabase._mockSelect).toHaveBeenCalledWith('*');
      expect(supabase._mockIlike).toHaveBeenCalledWith('name', '%test%'); // Expect the 'ilike' query
    });

    it('should return 401 if no token provided for search', async () => {
      authenticate.mockImplementationOnce((req, res, next) => {
        return res.status(401).json({ error: 'No token provided' });
      });
      const res = await request(app).get('/api/ingredients/search?query=test');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('No token provided');
    });

    it('should return 401 if token is invalid for search', async () => {
      authenticate.mockImplementationOnce((req, res, next) => {
        return res.status(401).json({ error: 'Invalid token' });
      });

      const res = await request(app)
        .get('/api/ingredients/search?query=test')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });
  });
});