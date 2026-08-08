import { describe, it, expect, vi, afterEach } from 'vitest';
import { signup, login, logout } from '../src/controllers/auth.controller.js';
import { mockRequest, mockResponse } from './helpers.js';

describe('Auth Controller', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('signup()', () => {
    it('should successfully sign up a new user via GoTrue API', async () => {
      const mockUserPayload = { user: { id: 'new-user-uuid', email: 'test@example.com' } };
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockUserPayload
      });

      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'Password123',
          fullname: 'Test User'
        }
      });
      const res = mockResponse();

      await signup(req, res);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(201);
      expect(res.jsonData).toEqual(mockUserPayload);
    });

    it('should return 400 if email, password, or fullname are missing', async () => {
      const req = mockRequest({
        body: {
          email: 'test@example.com'
          // missing password and fullname
        }
      });
      const res = mockResponse();

      await signup(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('Email, password, and fullname are required');
    });

    it('should forward GoTrue error responses on signup failure', async () => {
      const mockErrorResponse = { msg: 'User already exists', code: 'email_exists' };
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => mockErrorResponse
      });

      const req = mockRequest({
        body: {
          email: 'existing@example.com',
          password: 'Password123',
          fullname: 'Existing User'
        }
      });
      const res = mockResponse();

      await signup(req, res);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(409);
      expect(res.jsonData).toEqual(mockErrorResponse);
    });
  });

  describe('login()', () => {
    it('should successfully log in and retrieve session tokens', async () => {
      const mockSessionPayload = { access_token: 'mock-jwt-token', token_type: 'bearer' };
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSessionPayload
      });

      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'Password123'
        }
      });
      const res = mockResponse();

      await login(req, res);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData).toEqual(mockSessionPayload);
    });

    it('should return 400 if email or password are missing', async () => {
      const req = mockRequest({
        body: {
          email: 'test@example.com'
          // missing password
        }
      });
      const res = mockResponse();

      await login(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('Email and password are required');
    });
  });

  describe('logout()', () => {
    it('should successfully terminate active session', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 204
      });

      const req = mockRequest({
        headers: {
          authorization: 'Bearer active-user-token'
        }
      });
      const res = mockResponse();

      await logout(req, res);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(204);
    });

    it('should return 400 if no authorization header is provided', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await logout(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('No authorization header provided');
    });
  });
});
