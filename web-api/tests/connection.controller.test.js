import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getConnections,
  getConnectionById,
  createConnection,
  updateConnection,
  deleteConnection,
  getPublicInfo
} from '../src/controllers/connection.controller.js';
import { mockRequest, mockResponse } from './helpers.js';

describe('Connection Controller', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CRUD Lifecycle Flow', () => {
    it('should successfully carry out connection creation, retrieval, updates, and deletion', async () => {
      const mockUserId = 'user-lifecycle-uuid';

      // 1. Create connection
      const createReq = mockRequest({
        user: { sub: mockUserId },
        body: {
          name: 'Staging GCP',
          provider: 'gcp',
          credentials: { project_id: 'my-gcp-stage' }
        }
      });
      const createRes = mockResponse();
      await createConnection(createReq, createRes);

      expect(createRes.statusCode).toBe(201);
      expect(createRes.jsonData.name).toBe('Staging GCP');
      expect(createRes.jsonData.provider).toBe('gcp');
      const connectionId = createRes.jsonData.id;
      expect(connectionId).toBeDefined();

      // 2. Get connection list
      const listReq = mockRequest({ user: { sub: mockUserId } });
      const listRes = mockResponse();
      await getConnections(listReq, listRes);

      expect(listRes.statusCode).toBe(200);
      expect(Array.isArray(listRes.jsonData)).toBe(true);
      const found = listRes.jsonData.find(c => c.id === connectionId);
      expect(found).toBeDefined();
      expect(found.name).toBe('Staging GCP');
      expect(found.credentials).toBeUndefined(); // Adhere to public-api-design.md Security Rule 3

      // 3. Get connection by ID
      const getReq = mockRequest({
        user: { sub: mockUserId },
        params: { id: connectionId }
      });
      const getRes = mockResponse();
      await getConnectionById(getReq, getRes);

      expect(getRes.statusCode).toBe(200);
      expect(getRes.jsonData.id).toBe(connectionId);
      expect(getRes.jsonData.credentials).toBeUndefined(); // Adhere to public-api-design.md Security Rule 3

      // 4. Update connection
      const updateReq = mockRequest({
        user: { sub: mockUserId },
        params: { id: connectionId },
        body: {
          name: 'Production GCP Account',
          credentials: { project_id: 'my-gcp-prod' }
        }
      });
      const updateRes = mockResponse();
      await updateConnection(updateReq, updateRes);

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.jsonData.name).toBe('Production GCP Account');
      expect(updateRes.jsonData.credentials.project_id).toBe('my-gcp-prod');

      // 5. Delete connection
      const deleteReq = mockRequest({
        user: { sub: mockUserId },
        params: { id: connectionId }
      });
      const deleteRes = mockResponse();
      await deleteConnection(deleteReq, deleteRes);

      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.jsonData.message).toBe('Connection deleted successfully');

      // 6. Verify deleted connection returns 404
      const verifyReq = mockRequest({
        user: { sub: mockUserId },
        params: { id: connectionId }
      });
      const verifyRes = mockResponse();
      await getConnectionById(verifyReq, verifyRes);

      expect(verifyRes.statusCode).toBe(404);
      expect(verifyRes.jsonData.error).toBe('Connection not found or access denied');
    });
  });

  describe('createConnection() Validation', () => {
    it('should return 400 if required fields are missing', async () => {
      const req = mockRequest({
        user: { sub: 'user-uuid' },
        body: { name: 'GCP connection' } // missing provider & credentials
      });
      const res = mockResponse();

      await createConnection(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toMatch(/Missing required fields/);
    });
  });

  describe('getConnectionById() Validation', () => {
    it('should return 404 if connection does not exist or user does not own it', async () => {
      const req = mockRequest({
        user: { sub: 'another-user-uuid' },
        params: { id: 'non-existent-or-unauthorized-connection-id' }
      });
      const res = mockResponse();

      await getConnectionById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.error).toMatch(/Connection not found or access denied/);
    });
  });

  describe('getPublicInfo()', () => {
    it('should retrieve list of supported cloud providers', () => {
      const req = mockRequest();
      const res = mockResponse();

      getPublicInfo(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.supported_providers).toEqual(['aws', 'gcp', 'oci']);
      expect(res.jsonData.version).toBeDefined();
    });
  });
});
