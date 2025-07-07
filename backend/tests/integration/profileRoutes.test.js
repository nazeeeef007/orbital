// tests/integration/profileRoutes.test.js
const request = require('supertest');
const app = require('../../app');

jest.mock('@supabase/supabase-js', () => {
  // Mock storage methods
  const mockUpload = jest.fn().mockResolvedValue({ error: null });
  const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'http://example.com/avatar.png' } });

  const mockStorage = {
    from: jest.fn(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    })),
  };

  // Mock for .from('profiles')
  const mockFromProfiles = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    // We'll define single's behavior dynamically per test or more smartly
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
  };

  const mockClient = {
    storage: mockStorage,
    from: jest.fn((table) => {
      if (table === 'profiles') return mockFromProfiles;
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };

  return {
    createClient: () => mockClient,
  };
});

// Access the mocked supabase client and its methods
let mockSupabase; // Declare it here to be accessible in beforeEach

beforeEach(() => {
  mockSupabase = require('@supabase/supabase-js').createClient();

  // Reset all mocks on the profiles table before each test
  mockSupabase.from('profiles').select.mockClear();
  mockSupabase.from('profiles').eq.mockClear();
  mockSupabase.from('profiles').neq.mockClear();
  mockSupabase.from('profiles').single.mockClear(); // Clear this specifically
  mockSupabase.from('profiles').update.mockClear();
  mockSupabase.from('profiles').insert.mockClear();
  mockSupabase.storage.from().upload.mockClear();
  mockSupabase.storage.from().getPublicUrl.mockClear();

  // Default mock implementation for single() if not overridden by specific tests
  // This helps catch unexpected calls or provides a sensible default
  mockSupabase.from('profiles').single.mockResolvedValue({ data: null, error: null });
});

// Mock auth middleware
jest.mock('../../middleware/authMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  },
}));

describe('Profile Routes Integration', () => {
  it('GET /api/profile/me should return user profile', async () => {
    // Specifically mock the single call that gets the profile for /me
    mockSupabase.from('profiles').single.mockResolvedValueOnce({
      data: {
        username: 'testuser',
        display_name: 'Test User',
        bio: '',
        location: '',
        website: '',
        avatar_url: '',
        daily_calories: null,
        daily_protein: null,
        daily_carbs: null,
        daily_fat: null,
        calories_goal: null,
        protein_goal: null,
        carbs_goal: null,
        fat_goal: null,
      },
      error: null,
    });

    const res = await request(app).get('/api/profile/me');
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('testuser');
  });

  it('PUT /api/profile/profile should update user profile', async () => {
    // Mock the initial profile existence check (for the `select('id').eq('id', userId).single()` call)
    mockSupabase.from('profiles').single.mockResolvedValueOnce({ data: { id: 'test-user-id' }, error: null });

    // Mock the username uniqueness check (for the `select('id').eq('username', username).neq('id', userId).single()` call)
    mockSupabase.from('profiles').single.mockResolvedValueOnce({ data: null, error: null }); // Username is unique

    // Mock the update operation (for `update(updates).eq('id', userId).single()`)
    mockSupabase.from('profiles').update.mockReturnThis(); // Mock update to return `this` to allow chaining
    mockSupabase.from('profiles').eq.mockReturnThis(); // Mock eq to return `this`
    mockSupabase.from('profiles').single.mockResolvedValueOnce({
      data: { username: 'new_username' }, // The updated profile data
      error: null,
    });

    const res = await request(app)
      .put('/api/profile/profile')
      .field('username', 'new_username')
      .attach('avatar', Buffer.from('fake image'), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Profile updated');
    expect(res.body.profile).toBeDefined();
    expect(res.body.profile.username).toBe('new_username');

    // Optionally, assert that `update` was called with the correct payload
    expect(mockSupabase.from('profiles').update).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'new_username',
        avatar_url: 'http://example.com/avatar.png', // From mockGetPublicUrl
        // Expect numeric fields to be null if not provided
        daily_calories: null,
        daily_protein: null,
        daily_carbs: null,
        daily_fat: null,
        calories_goal: null,
        protein_goal: null,
        carbs_goal: null,
        fat_goal: null,
      })
    );
  });
});