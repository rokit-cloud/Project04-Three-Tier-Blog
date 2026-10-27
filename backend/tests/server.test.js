const request = require('supertest');

jest.mock('../src/config/db', () => ({
  checkDbConnection: jest.fn(),
  pool: {
    query: jest.fn(),
  },
}));

const { checkDbConnection, pool } = require('../src/config/db');
const app = require('../src/server');

describe('Blog API health and fallback routes', () => {
  test('GET /healthz returns status ok', async () => {
    const response = await request(app).get('/healthz');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('GET /readyz returns ready when database connection works', async () => {
    checkDbConnection.mockResolvedValue(true);

    const response = await request(app).get('/readyz');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ready' });
  });

  test('GET /readyz returns 503 when database connection fails', async () => {
    checkDbConnection.mockRejectedValue(new Error('Database unavailable'));

    const response = await request(app).get('/readyz');

    expect(response.statusCode).toBe(503);
    expect(response.body.status).toBe('not-ready');
  });

  test('GET an unknown route returns 404', async () => {
    const response = await request(app).get('/route-that-does-not-exist');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: 'Route not found' });
  });

  test('GET /api/posts returns posts from the database', async () => {
    pool.query
      .mockResolvedValueOnce([[
        {
          id: 1,
          title: 'Test blog post',
          slug: 'test-blog-post',
          author_name: 'Test Author',
        },
      ]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    const response = await request(app).get('/api/posts');

    expect(response.statusCode).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe('Test blog post');
  });
});
