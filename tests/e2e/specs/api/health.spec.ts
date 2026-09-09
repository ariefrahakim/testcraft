/**
 * API health checks — low-level smoke tests that call the NestJS API directly.
 *
 * Requires: API running at API_URL (default http://localhost:4001/api/v1)
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../../fixtures/users';
import { TestApiClient } from '../../utils/api-client';

const API_URL = process.env.API_URL ?? 'http://localhost:4001/api/v1';

test.describe('API — Health & smoke checks', () => {
  test('GET /health should return 200 with status ok', async () => {
    const api = new TestApiClient(API_URL);

    await test.step('Call GET /health endpoint', async () => {
      const health = await api.health();
      expect(health.status).toBe('ok');
      expect(health.database).toBe('up');
    });
  });

  test('GET /health should include required fields', async () => {
    await test.step('Fetch /health and verify all required fields are present', async () => {
      const res = await fetch(`${API_URL}/health`);
      expect(res.status).toBe(200);

      const body = await res.json() as Record<string, unknown>;
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('database');
      expect(body).toHaveProperty('service');
      expect(body).toHaveProperty('timestamp');
    });
  });

  test('POST /auth/login should return JWT tokens for valid credentials', async () => {
    const api = new TestApiClient(API_URL);

    await test.step('Login as student and verify JWT token structure', async () => {
      const accessToken = await api.loginAs(testUsers.student.email, testUsers.student.password);
      expect(typeof accessToken).toBe('string');
      expect(accessToken.length).toBeGreaterThan(20);
      expect(accessToken.split('.').length).toBe(3);
    });
  });

  test('POST /auth/login should return 401 for wrong password', async () => {
    await test.step('Attempt login with wrong password and verify 401 response', async () => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUsers.student.email, password: 'WrongPassword#9' }),
      });
      expect(res.status).toBe(401);
    });
  });

  test('POST /auth/register should create a new student and return tokens', async () => {
    const api = new TestApiClient(API_URL);

    await test.step('Register a new user and verify token response', async () => {
      const email = `api-test-${Date.now()}@testcraft.id`;
      const tokens = await api.createUser({
        name: 'API Test User',
        email,
        password: 'Secure#Pass9',
      });
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens.accessToken.split('.').length).toBe(3);
    });
  });

  test('GET /auth/me should return user profile for authenticated request', async () => {
    const api = new TestApiClient(API_URL);

    await test.step('Login as student', async () => {
      const jwt = await api.loginAs(testUsers.student.email, testUsers.student.password);
      return jwt;
    });

    await test.step('Fetch profile and verify student data', async () => {
      const jwt = await api.loginAs(testUsers.student.email, testUsers.student.password);
      const profile = await api.getProfile(jwt);
      expect(profile.email).toBe(testUsers.student.email);
      expect(profile.role).toBe('STUDENT');
      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('name');
    });
  });

  test('GET /auth/me should return 401 without bearer token', async () => {
    await test.step('Call /auth/me without authorization header and verify 401', async () => {
      const res = await fetch(`${API_URL}/auth/me`);
      expect(res.status).toBe(401);
    });
  });

  test('GET /courses should return a paginated course list', async () => {
    const api = new TestApiClient(API_URL);

    await test.step('Fetch courses with pagination params and verify array response', async () => {
      const result = await api.getCourses('limit=10&page=1');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  test('GET /courses should return published courses only', async () => {
    await test.step('Fetch courses and verify response format', async () => {
      const res = await fetch(`${API_URL}/courses?limit=5&page=1`);
      expect(res.status).toBe(200);

      const body = await res.json() as { data: Array<{ id: string; title: string }> };
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  test('GET /categories should return the category list', async () => {
    await test.step('Fetch categories and verify array response', async () => {
      const res = await fetch(`${API_URL}/categories`);
      expect(res.status).toBe(200);

      const body = await res.json() as unknown[];
      expect(Array.isArray(body)).toBe(true);
    });
  });
});
