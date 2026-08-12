import { describe, it, expect, vi, afterEach } from 'vitest';
vi.mock('redis', () => {
  return {
    createClient: () => ({
      on: vi.fn(),
      connect: vi.fn().mockResolvedValue(true),
      rPush: vi.fn().mockResolvedValue(1)
    })
  };
});
import { prisma } from '../src/prisma.js';
import {
  getScans,
  createScan,
  getScanById,
  getScanResults
} from '../src/controllers/scan.controller.js';
import {
  MOCK_USER_ID,
  MOCK_CONNECTION_ID,
  MOCK_SCAN_ID,
  MOCK_SCAN_JOB,
  MOCK_CONNECTION,
  MOCK_FINDING,
  mockRequest,
  mockResponse
} from './helpers.js';

describe('Scan Controller', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getScans()', () => {
    it('should successfully retrieve all scan history for the user', async () => {
      const mockScans = [MOCK_SCAN_JOB];
      const prismaSpy = vi.spyOn(prisma.scan_jobs, 'findMany').mockResolvedValue(mockScans);

      const req = mockRequest({ user: { sub: MOCK_USER_ID } });
      const res = mockResponse();

      await getScans(req, res);

      expect(prismaSpy).toHaveBeenCalledTimes(1);
      expect(prismaSpy).toHaveBeenCalledWith({
        where: { user_id: MOCK_USER_ID },
        orderBy: { created_at: 'desc' }
      });
      expect(res.statusCode).toBe(200);
      expect(res.jsonData).toEqual(mockScans);
    });

    it('should return 401 if user ID (sub) is missing or malformed', async () => {
      const req = mockRequest({ user: { sub: 'invalid-user-uuid' } });
      const res = mockResponse();

      await getScans(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.error).toBe('Unauthorized: Invalid user identifier');
    });

    it('should return 500 when database findMany throws an error', async () => {
      vi.spyOn(prisma.scan_jobs, 'findMany').mockRejectedValue(new Error('DB failure'));

      const req = mockRequest({ user: { sub: MOCK_USER_ID } });
      const res = mockResponse();

      await getScans(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.error).toBe('Internal server error while retrieving scans');
    });
  });

  describe('createScan()', () => {
    it('should successfully trigger a manual scan by creating a PENDING scan job', async () => {
      const connSpy = vi.spyOn(prisma.connections, 'findFirst').mockResolvedValue(MOCK_CONNECTION);
      const scanSpy = vi.spyOn(prisma.scan_jobs, 'create').mockResolvedValue({
        ...MOCK_SCAN_JOB,
        status: 'PENDING'
      });

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        body: { connection_id: MOCK_CONNECTION_ID }
      });
      const res = mockResponse();

      await createScan(req, res);

      expect(connSpy).toHaveBeenCalledWith({
        where: { id: MOCK_CONNECTION_ID, user_id: MOCK_USER_ID }
      });
      expect(scanSpy).toHaveBeenCalledWith({
        data: {
          connection_id: MOCK_CONNECTION_ID,
          user_id: MOCK_USER_ID,
          status: 'PENDING'
        }
      });
      expect(res.statusCode).toBe(201);
      expect(res.jsonData.status).toBe('PENDING');
    });

    it('should return 400 if connection_id is missing from request body', async () => {
      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        body: {}
      });
      const res = mockResponse();

      await createScan(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('Missing required field: connection_id');
    });

    it('should return 400 if connection_id format is invalid', async () => {
      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        body: { connection_id: 'invalid-connection-id-format' }
      });
      const res = mockResponse();

      await createScan(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('Invalid connection_id format');
    });

    it('should return 404 if connection does not exist or does not belong to the user', async () => {
      vi.spyOn(prisma.connections, 'findFirst').mockResolvedValue(null);

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        body: { connection_id: MOCK_CONNECTION_ID }
      });
      const res = mockResponse();

      await createScan(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.error).toBe('Connection not found or access denied');
    });
  });

  describe('getScanById()', () => {
    it('should successfully retrieve a specific scan job status by ID', async () => {
      const scanSpy = vi.spyOn(prisma.scan_jobs, 'findFirst').mockResolvedValue(MOCK_SCAN_JOB);

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { scan_id: MOCK_SCAN_ID }
      });
      const res = mockResponse();

      await getScanById(req, res);

      expect(scanSpy).toHaveBeenCalledWith({
        where: { id: MOCK_SCAN_ID, user_id: MOCK_USER_ID }
      });
      expect(res.statusCode).toBe(200);
      expect(res.jsonData).toEqual(MOCK_SCAN_JOB);
    });

    it('should return 400 if scan_id parameter is malformed', async () => {
      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { scan_id: 'bad-scan-uuid' }
      });
      const res = mockResponse();

      await getScanById(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('Invalid scan_id format');
    });

    it('should return 404 if scan job does not exist or user does not own it', async () => {
      vi.spyOn(prisma.scan_jobs, 'findFirst').mockResolvedValue(null);

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { scan_id: MOCK_SCAN_ID }
      });
      const res = mockResponse();

      await getScanById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.error).toBe('Scan job not found or access denied');
    });
  });

  describe('getScanResults()', () => {
    it('should successfully retrieve detailed findings and rules for a completed scan', async () => {
      const mockFindings = [MOCK_FINDING];
      const scanSpy = vi.spyOn(prisma.scan_jobs, 'findFirst').mockResolvedValue(MOCK_SCAN_JOB);
      const findingsSpy = vi.spyOn(prisma.findings, 'findMany').mockResolvedValue(mockFindings);

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { scan_id: MOCK_SCAN_ID }
      });
      const res = mockResponse();

      await getScanResults(req, res);

      expect(scanSpy).toHaveBeenCalledWith({
        where: { id: MOCK_SCAN_ID, user_id: MOCK_USER_ID }
      });
      expect(findingsSpy).toHaveBeenCalledWith({
        where: { scan_job_id: MOCK_SCAN_ID },
        include: { resources: true, rules: true }
      });
      expect(res.statusCode).toBe(200);
      expect(res.jsonData).toEqual(mockFindings);
    });

    it('should return 404 if the scan job results requested are not found or unauthorized', async () => {
      vi.spyOn(prisma.scan_jobs, 'findFirst').mockResolvedValue(null);

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { scan_id: MOCK_SCAN_ID }
      });
      const res = mockResponse();

      await getScanResults(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.error).toBe('Scan job not found or access denied');
    });
  });
});
