const request = require('supertest');
const app = require('../../app');

let mockSupabaseClient;
let mockSelect;
let mockEq;
let mockOr;
let mockLimit;
let mockGte;
let mockOrder;
let mockSingle;
let mockInsert;
let mockAuthGetUser;
let mockFrom;

// --- CRITICAL FIX: Move setupChainableMocks to global scope ---
// Helper function to create and assign local mocks for a chain
const setupChainableMocks = (finalResolutionMethod, resolutionValue) => {
  const localSelect = jest.fn().mockReturnThis();
  const localEq = jest.fn().mockReturnThis();
  const localOr = jest.fn().mockReturnThis();
  const localLimit = jest.fn().mockReturnThis();
  const localGte = jest.fn().mockReturnThis();
  const localOrder = jest.fn().mockReturnThis();
  const localSingle = jest.fn();
  const localInsert = jest.fn();

  // Assign to global variables for assertion later
  mockSelect = localSelect;
  mockEq = localEq;
  mockOr = localOr;
  mockLimit = localLimit;
  mockGte = localGte;
  mockOrder = localOrder;
  mockSingle = localSingle;
  mockInsert = localInsert;

  // Apply resolution to the correct mock function
  if (finalResolutionMethod === 'single') {
    localSingle.mockResolvedValueOnce(resolutionValue);
  } else if (finalResolutionMethod === 'limit') {
    localLimit.mockResolvedValueOnce(resolutionValue);
  } else if (finalResolutionMethod === 'order') {
    localOrder.mockResolvedValueOnce(resolutionValue);
  } else if (finalResolutionMethod === 'eq') {
    localEq.mockResolvedValueOnce(resolutionValue);
  } else if (finalResolutionMethod === 'select') {
    localSelect.mockResolvedValueOnce(resolutionValue);
  } else if (finalResolutionMethod === 'insert') {
    localInsert.mockResolvedValueOnce(resolutionValue);
  }

  return {
    select: localSelect,
    eq: localEq,
    or: localOr,
    limit: localLimit,
    gte: localGte,
    order: localOrder,
    single: localSingle,
    insert: localInsert,
  };
};
// --- END CRITICAL FIX ---


jest.mock('@supabase/supabase-js', () => {
  const createFreshChainableMocks = () => {
    const localSelect = jest.fn().mockReturnThis();
    const localEq = jest.fn().mockReturnThis();
    const localOr = jest.fn().mockReturnThis();
    const localLimit = jest.fn().mockReturnThis();
    const localGte = jest.fn().mockReturnThis();
    const localOrder = jest.fn().mockReturnThis();
    const localSingle = jest.fn();
    const localInsert = jest.fn();

    // Default resolutions for chainable methods
    localSelect.mockResolvedValue({ data: [], error: null });
    localEq.mockResolvedValue({ data: [], error: null });
    localOr.mockResolvedValue({ data: [], error: null });
    localLimit.mockResolvedValue({ data: [], error: null });
    localGte.mockResolvedValue({ data: [], error: null });
    localOrder.mockResolvedValue({ data: [], error: null });
    localSingle.mockResolvedValue({ data: null, error: null });
    localInsert.mockResolvedValue({ data: null, error: null });

    // Assign to global variables for assertion later in tests
    mockSelect = localSelect;
    mockEq = localEq;
    mockOr = localOr;
    mockLimit = localLimit;
    mockGte = localGte;
    mockOrder = localOrder;
    mockSingle = localSingle;
    mockInsert = localInsert;

    return {
      select: localSelect,
      eq: localEq,
      or: localOr,
      limit: localLimit,
      gte: localGte,
      order: localOrder,
      single: localSingle,
      insert: localInsert,
    };
  };

  const fromMock = jest.fn(() => createFreshChainableMocks());
  const authGetUserMock = jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });

  return {
    createClient: jest.fn(() => ({
      from: fromMock,
      auth: {
        getUser: authGetUserMock,
      },
      _internalRawMocks: {
        from: fromMock,
        authGetUser: authGetUserMock,
      },
    })),
  };
});

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-for-history'),
}));

let mockAuthenticate;
jest.mock('../../middleware/authMiddleware', () => {
  const authenticateMock = jest.fn((req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  });
  return {
    authenticate: authenticateMock,
  };
});


beforeEach(() => {
  jest.clearAllMocks();

  const supabaseModule = require('@supabase/supabase-js');
  mockSupabaseClient = supabaseModule.createClient();

  mockFrom = mockSupabaseClient._internalRawMocks.from;
  mockAuthGetUser = mockSupabaseClient._internalRawMocks.authGetUser;

  const authMiddleware = require('../../middleware/authMiddleware');
  mockAuthenticate = authMiddleware.authenticate;
  mockAuthenticate.mockClear();
  mockAuthenticate.mockImplementation((req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  });
});

describe('Search Routes Integration', () => {
  describe('GET /api/search', () => {
    it('should return 400 if "q" query parameter is missing', async () => {
      const res = await request(app).get('/api/search?type=users');
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid query parameter "q".');
    });

    it('should return 400 if "type" query parameter is invalid', async () => {
      const res = await request(app).get('/api/search?q=test&type=invalid');
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Type must be "users" or "meals".');
    });

    // --- User Search ---
    it('should search for users and return results', async () => {
      const mockUsers = [
        { id: 'user1', username: 'testuser1', display_name: 'Test User One', avatar_url: null },
      ];

      mockFrom.mockImplementationOnce(() => {
        const localSelect = jest.fn().mockReturnThis();
        const localEq = jest.fn().mockReturnThis();
        const localOr = jest.fn().mockReturnThis();
        const localLimit = jest.fn();
        localLimit.mockResolvedValueOnce({ data: mockUsers, error: null, status: 200 });

        mockSelect = localSelect;
        mockEq = localEq;
        mockOr = localOr;
        mockLimit = localLimit;

        return {
          select: localSelect,
          eq: localEq,
          or: localOr,
          limit: localLimit,
        };
      });

      const res = await request(app).get('/api/search?q=test&type=users');
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toEqual(mockUsers);

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('id, username, display_name, avatar_url');
      expect(mockOr).toHaveBeenCalledWith('username.ilike.%test%,display_name.ilike.%test%');
      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('should handle errors during user search', async () => {
      mockFrom.mockImplementationOnce(() => {
        const localSelect = jest.fn().mockReturnThis();
        const localEq = jest.fn().mockReturnThis();
        const localOr = jest.fn().mockReturnThis();
        const localLimit = jest.fn();
        localLimit.mockResolvedValueOnce({ data: null, error: { message: 'DB Error' }, status: 500 });

        mockSelect = localSelect;
        mockEq = localEq;
        mockOr = localOr;
        mockLimit = localLimit;

        return {
          select: localSelect,
          eq: localEq,
          or: localOr,
          limit: localLimit,
        };
      });

      const res = await request(app).get('/api/search?q=error&type=users');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Unable to search users.');
    });

    // --- Meal Search ---
    it('should search for meals, save history, and return scored results', async () => {
      const mockMeals = [
        {
          id: 'meal1', user_id: 'user1', recipe_text: 'Spicy Chicken Curry', cuisine: 'Indian', meal_time: 'Dinner', diet_type: 'Non-veg', spice_level: 'Hot', prep_time_mins: 60, location: 'Kitchen', price: 10,
          meal_likes: [{ count: 5 }], meal_saves: [{ count: 2 }], meal_comments: [{ count: 1 }]
        },
        {
          id: 'meal2', user_id: 'user2', recipe_text: 'Veggie Salad', cuisine: 'Mediterranean', meal_time: 'Lunch', diet_type: 'Vegetarian', spice_level: 'Mild', prep_time_mins: 15, location: 'Cafe', price: 8,
          meal_likes: [{ count: 1 }], meal_saves: [{ count: 5 }], meal_comments: [{ count: 0 }]
        },
      ];

      // First call to `from`: for 'search_history'
      mockFrom.mockImplementationOnce(() => {
        const localInsert = jest.fn();
        localInsert.mockResolvedValueOnce({ data: null, error: null });
        mockInsert = localInsert;
        return { insert: localInsert };
      });

      // Second call to `from`: for 'meals'
      mockFrom.mockImplementationOnce(() => {
        const localSelect = jest.fn().mockReturnThis();
        const localOr = jest.fn().mockReturnThis();
        const localLimit = jest.fn();
        localLimit.mockResolvedValueOnce({ data: mockMeals, error: null, status: 200 });

        mockSelect = localSelect;
        mockOr = localOr;
        mockLimit = localLimit;

        return {
          select: localSelect,
          or: localOr,
          limit: localLimit,
        };
      });

      const res = await request(app).get('/api/search?q=chicken&type=meals');
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.results.length).toBe(2);

      expect(res.body.results[0].id).toBe('meal1');
      expect(res.body.results[0].score).toBeGreaterThan(res.body.results[1].score);

      expect(mockFrom).toHaveBeenCalledWith('search_history');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          query: 'chicken',
          search_type: 'meals',
          id: 'mock-uuid-for-history',
        })
      );
      expect(mockFrom).toHaveBeenCalledWith('meals');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('meal_likes:meal_likes(count)'));
      expect(mockOr).toHaveBeenCalledWith(expect.stringContaining('recipe_text.ilike.%chicken%'));
      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('should handle errors during meal search', async () => {
      mockFrom.mockImplementationOnce(() => {
        const localInsert = jest.fn();
        localInsert.mockResolvedValueOnce({ data: null, error: null });
        mockInsert = localInsert;
        return { insert: localInsert };
      });
      mockFrom.mockImplementationOnce(() => {
        const localSelect = jest.fn().mockReturnThis();
        const localOr = jest.fn().mockReturnThis();
        const localLimit = jest.fn();
        localLimit.mockResolvedValueOnce({ data: null, error: { message: 'Meal DB Error' }, status: 500 });
        mockSelect = localSelect;
        mockOr = localOr;
        mockLimit = localLimit;
        return { select: localSelect, or: localOr, limit: localLimit };
      });

      const res = await request(app).get('/api/search?q=error&type=meals');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Unable to search meals.');
    });
  });

  // --- GET /api/search/recommendation ---
  describe('GET /api/search/recommendation', () => {
    it('should return 401 if user is not authenticated (controller check)', async () => {
      mockAuthenticate.mockImplementationOnce((req, res, next) => {
        req.user = null;
        next();
      });
      const res = await request(app).get('/api/search/recommendation');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should generate and return meal recommendations', async () => {
      const mockProfile = {
        username: 'testuser',
        avatar_url: null,
        calories_goal: 2000, protein_goal: 100, carbs_goal: 250, fat_goal: 70,
        daily_calories: 500, daily_protein: 20, daily_carbs: 50, daily_fat: 10,
        daily_updated_at: new Date('2025-07-06T10:00:00Z').toISOString().split('T')[0],
      };

      const mockMacroHistory = [
        { date: '2025-07-06', calories: 1900, protein: 95, carbs: 240, fat: 65 },
        { date: '2025-07-05', calories: 1000, protein: 50, carbs: 100, fat: 30 },
      ];

      const mockUserMeals = [
        { cuisine: 'Italian', meal_time: 'Dinner', diet_type: 'Veg', spice_level: 'Mild', prep_time_mins: 30, location: 'Home' },
      ];

      const mockSearchHistory = [
        { filters: { cuisine: 'Italian' }, search_type: 'meals' },
      ];

      const mockFollowingList = [{ following_id: 'followed-user-id-1' }];

      const mockAllMeals = [
        {
          id: 'mealA', user_id: 'followed-user-id-1', recipe_text: 'Pasta Arrabiata', meal_image_url: null,
          calories: 800, protein: 30, carbs: 120, fat: 30, created_at: '2025-07-01T12:00:00Z',
          cuisine: 'Italian', meal_time: 'Dinner', diet_type: 'Veg', spice_level: 'Mild',
          prep_time_mins: 40, location: 'Home', price: 15,
          meal_likes: [{ count: 10 }], meal_comments: [{ count: 5 }], meal_saves: [{ count: 8 }],
          profiles: { username: 'followeduser', avatar_url: null }
        },
        {
          id: 'mealB', user_id: 'random-user-id', recipe_text: 'Chicken Biryani', meal_image_url: null,
          calories: 1200, protein: 60, carbs: 150, fat: 50, created_at: '2025-07-05T10:00:00Z',
          cuisine: 'Indian', meal_time: 'Lunch', diet_type: 'Non-veg', spice_level: 'Hot',
          prep_time_mins: 75, location: 'Restaurant', price: 20,
          meal_likes: [{ count: 2 }], meal_comments: [{ count: 1 }], meal_saves: [{ count: 0 }],
          profiles: { username: 'randomuser', avatar_url: null }
        },
        {
          id: 'mealC', user_id: 'test-user-id', recipe_text: 'Simple Salad', meal_image_url: null,
          calories: 300, protein: 10, carbs: 40, fat: 10, created_at: '2025-07-06T08:00:00Z',
          cuisine: 'Salad', meal_time: 'Lunch', diet_type: 'Veg', spice_level: 'None',
          prep_time_mins: 10, location: 'Office', price: 5,
          meal_likes: [{ count: 0 }], meal_comments: [{ count: 0 }], meal_saves: [{ count: 0 }],
          profiles: { username: 'testuser', avatar_url: null }
        }
      ];

      // 1. profiles.select().eq().single()
      mockFrom.mockImplementationOnce(() => setupChainableMocks('single', { data: mockProfile, error: null }));

      // 2. daily_macro_history.select().eq().gte().order()
      mockFrom.mockImplementationOnce(() => setupChainableMocks('order', { data: mockMacroHistory, error: null }));

      // 3. meals (user's meals).select().eq().order().limit()
      mockFrom.mockImplementationOnce(() => setupChainableMocks('limit', { data: mockUserMeals, error: null }));

      // 4. search_history.select().eq().order().limit()
      mockFrom.mockImplementationOnce(() => setupChainableMocks('limit', { data: mockSearchHistory, error: null }));

      // 5. followers.select().eq()
      mockFrom.mockImplementationOnce(() => setupChainableMocks('eq', { data: mockFollowingList, error: null }));

      // 6. meals (all meals).select()
      mockFrom.mockImplementationOnce(() => setupChainableMocks('select', { data: mockAllMeals, error: null }));


      const res = await request(app).get('/api/search/recommendation');

      expect(res.statusCode).toBe(200);
      expect(res.body.recommendations).toBeInstanceOf(Array);
      expect(res.body.recommendations.length).toBe(3);

      expect(res.body.recommendations[0]).toHaveProperty('score');
      expect(res.body.recommendations[0]).toHaveProperty('author');
      expect(res.body.recommendations[0]).toHaveProperty('isLiked');
      expect(res.body.recommendations[0]).toHaveProperty('isSaved');

      const fromCalls = mockFrom.mock.calls.map(call => call[0]);
      expect(fromCalls).toEqual([
        'profiles',
        'daily_macro_history',
        'meals',
        'search_history',
        'followers',
        'meals',
      ]);
    });

    it('should handle errors during profile fetch for recommendation', async () => {
      mockFrom.mockImplementationOnce(() => setupChainableMocks('single', { data: null, error: { message: 'Profile Error' } }));

      const res = await request(app).get('/api/search/recommendation');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Server error generating recommendations');
    });
  });
});