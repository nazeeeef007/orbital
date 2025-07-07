const request = require('supertest');
const express = require('express');
const mealRoutes = require('../../routes/mealRoutes');
const supabase = require('../../models/supabaseClient');

jest.mock('../../models/supabaseClient');

const app = express();
app.use(express.json());

// Mock auth middleware - provide valid UUID user ID
app.use((req, res, next) => {
  req.user = { id: '11111111-1111-1111-1111-111111111111' };
  next();
});

app.use('/api/meals', mealRoutes);

describe('Meal Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/meals should return enriched meals', async () => {
    supabase.from.mockImplementation((table) => {
      const builder = {
        select: jest.fn(() => builder),
        eq: jest.fn(() => builder),
        order: jest.fn(() => builder),
        single: jest.fn(() => builder),
        maybeSingle: jest.fn(() => builder),
      };

      if (table === 'meals') {
        builder.select.mockReturnValue(builder);
        builder.eq.mockReturnValue(builder);
        builder.order.mockReturnValue({
          data: [
            { id: 'meal1', user_id: '11111111-1111-1111-1111-111111111111' }
          ],
          error: null,
        });
      } else if (table === 'meal_likes') {
        // Used 3 times in controller: count likes, check if user liked
        builder.select
          .mockReturnValueOnce({ eq: () => ({ count: 5, error: null }) })  // total likesCount
          .mockReturnValueOnce({ eq: () => ({ count: 2, error: null }) })  // total savesCount (actually for meal_saves)
          .mockReturnValueOnce({ eq: () => ({ eq: () => ({ single: () => ({ data: { id: 'like1' }, error: null }) }) }) }); // userLike check
      } else if (table === 'meal_saves') {
        builder.select
          .mockReturnValueOnce({ eq: () => ({ count: 2, error: null }) })  // savesCount
          .mockReturnValueOnce({ eq: () => ({ eq: () => ({ single: () => ({ data: { id: 'save1' }, error: null }) }) }) }); // userSave check
      } else if (table === 'meal_comments') {
        builder.select.mockReturnValue({
          eq: () => ({
            order: () => ({
              data: [
                { content: 'Great meal!', created_at: '2024-01-01', user_id: 'user2' }
              ],
              error: null,
            }),
          }),
        });
      }

      return builder;
    });

    const res = await request(app).get('/api/meals');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const meal = res.body[0];
    expect(meal).toHaveProperty('likesCount');
    expect(meal).toHaveProperty('savesCount');
    expect(meal).toHaveProperty('comments');
    expect(meal).toHaveProperty('isLikedByCurrentUser');
    expect(meal).toHaveProperty('isSavedByCurrentUser');
  });

  it('GET /api/meals should return 500 on Supabase error', async () => {
    supabase.from.mockImplementation((table) => {
      const builder = {
        select: jest.fn(() => builder),
        eq: jest.fn(() => builder),
        order: jest.fn(() => ({
          data: null,
          error: { message: 'Supabase error' },
        })),
      };
      return builder;
    });

    const res = await request(app).get('/api/meals');
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Supabase error');
  });
});
