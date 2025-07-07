const request = require('supertest');
const express = require('express');
const expressApp = express();
expressApp.use(express.json());

// Attach mock user for authentication
expressApp.use((req, res, next) => {
  req.user = { id: 'user1' };
  next();
});

// Supabase mock setup
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

// Import after mocking
const macroController = require('../../controllers/macroController');
expressApp.get('/api/macros/history', macroController.getMacroHistory);

describe('GET /api/macros/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 7-day macro history with sanitized null values', async () => {
    mockOrder.mockReturnValue({
      data: [
        { date: '2023-07-01', calories: 2000, protein: 100, carbs: 250, fat: 70 },
        { date: '2023-07-02', calories: null, protein: null, carbs: null, fat: null }
      ],
      error: null
    });

    const res = await request(expressApp).get('/api/macros/history');

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
    mockOrder.mockReturnValue({
      data: null,
      error: { message: 'DB Failure' }
    });

    const res = await request(expressApp).get('/api/macros/history');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Failed to fetch macro history');
  });
});
