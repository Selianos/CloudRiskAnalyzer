import { describe, it, expect, vi, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authCheck } from '../src/middleware/auth.middleware.js';
import { mockRequest, mockResponse } from './helpers.js';

describe('authCheck Middleware', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 if Authorization header is missing', () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = vi.fn();

    authCheck(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error).toBe('Unauthorized: Missing or invalid token format');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token does not start with Bearer prefix', () => {
    const req = mockRequest({ headers: { authorization: 'Basic credentials123' } });
    const res = mockResponse();
    const next = vi.fn();

    authCheck(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error).toBe('Unauthorized: Missing or invalid token format');
    expect(next).not.toHaveBeenCalled();
  });

  it('should decode user and call next() if JWT token is valid', () => {
    const mockPayload = { sub: 'user-123', email: 'test@example.com' };
    const jwtSpy = vi.spyOn(jwt, 'verify').mockReturnValue(mockPayload);

    const req = mockRequest({ headers: { authorization: 'Bearer valid_token' } });
    const res = mockResponse();
    const next = vi.fn();

    authCheck(req, res, next);

    expect(jwtSpy).toHaveBeenCalledWith('valid_token', expect.any(String));
    expect(req.user).toEqual(mockPayload);
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if JWT verification throws an error (e.g. expired or invalid signature)', () => {
    vi.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('jwt expired');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {}); // Mute console error logging

    const req = mockRequest({ headers: { authorization: 'Bearer expired_token' } });
    const res = mockResponse();
    const next = vi.fn();

    authCheck(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error).toBe('Unauthorized: Invalid or expired token');
    expect(next).not.toHaveBeenCalled();
  });
});
