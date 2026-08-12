import { describe, it, expect, vi, afterEach } from 'vitest';
import { prisma } from '../src/prisma.js';
import {
  getConnections,
  getConnectionById,
  createConnection,
  updateConnection,
  deleteConnection,
  getPublicInfo
} from '../src/controllers/connection.controller.js';
import { mockRequest, mockResponse, MOCK_USER_ID, MOCK_CONNECTION_ID, MOCK_CONNECTION } from './helpers.js';

describe('Connection Controller', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getConnections()', () => {
    it('should retrieve all connections for the authenticated user and omit credentials', async () => {
      const mockList = [MOCK_CONNECTION];
      const prismaSpy = vi.spyOn(prisma.connections, 'findMany').mockResolvedValue(mockList);

      const req = mockRequest({ user: { sub: MOCK_USER_ID } });
      const res = mockResponse();

      await getConnections(req, res);

      expect(prismaSpy).toHaveBeenCalledWith({
        where: { user_id: MOCK_USER_ID },
        orderBy: { created_at: 'desc' }
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.jsonData)).toBe(true);
      expect(res.jsonData[0].id).toBe(MOCK_CONNECTION_ID);
      expect(res.jsonData[0].name).toBe(MOCK_CONNECTION.name);
      expect(res.jsonData[0].credentials).toBeUndefined(); // Adheres to Security Rule 3
    });

    it('should return 401 if user sub is missing', async () => {
      const req = mockRequest({ user: {} });
      const res = mockResponse();

      await getConnections(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.error).toMatch(/Unauthorized/);
    });
  });

  describe('getConnectionById()', () => {
    it('should retrieve connection by ID and omit credentials', async () => {
      const prismaSpy = vi.spyOn(prisma.connections, 'findFirst').mockResolvedValue(MOCK_CONNECTION);

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { id: MOCK_CONNECTION_ID }
      });
      const res = mockResponse();

      await getConnectionById(req, res);

      expect(prismaSpy).toHaveBeenCalledWith({
        where: { id: MOCK_CONNECTION_ID, user_id: MOCK_USER_ID }
      });
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.id).toBe(MOCK_CONNECTION_ID);
      expect(res.jsonData.name).toBe(MOCK_CONNECTION.name);
      expect(res.jsonData.credentials).toBeUndefined(); // Adheres to Security Rule 3
    });

    it('should return 400 if connection ID format is not a valid UUID', async () => {
      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { id: 'invalid-uuid-format' }
      });
      const res = mockResponse();

      await getConnectionById(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('Invalid connection ID format');
    });

    it('should return 404 if connection does not exist or user does not own it', async () => {
      vi.spyOn(prisma.connections, 'findFirst').mockResolvedValue(null);

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { id: MOCK_CONNECTION_ID }
      });
      const res = mockResponse();

      await getConnectionById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.error).toBe('Connection not found or access denied');
    });
  });

  describe('createConnection()', () => {
    it('should encrypt raw credentials and create connection in database', async () => {
      const prismaSpy = vi.spyOn(prisma.connections, 'create').mockResolvedValue(MOCK_CONNECTION);

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        body: {
          name: 'Staging GCP',
          provider: 'gcp',
          credentials: { project_id: 'my-gcp-stage' }
        }
      });
      const res = mockResponse();

      await createConnection(req, res);

      expect(prismaSpy).toHaveBeenCalledTimes(1);
      // Verify credentials written to Prisma call were indeed encrypted
      const createArgs = prismaSpy.mock.calls[0][0];
      expect(createArgs.data.name).toBe('Staging GCP');
      expect(createArgs.data.provider).toBe('gcp');
      expect(createArgs.data.credentials.encrypted).toBeDefined(); // Has encrypted field
      expect(createArgs.data.credentials.encrypted).not.toEqual({ project_id: 'my-gcp-stage' });

      expect(res.statusCode).toBe(201);
      expect(res.jsonData.id).toBe(MOCK_CONNECTION_ID);
      expect(res.jsonData.credentials).toBeUndefined(); // Adheres to Security Rule 3
    });

    it('should return 400 if required fields are missing', async () => {
      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        body: { name: 'GCP connection' }
      });
      const res = mockResponse();

      await createConnection(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toMatch(/Missing required fields/);
    });

    it('should return 400 if provider is unsupported', async () => {
      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        body: {
          name: 'My Oracle Account',
          provider: 'unsupported-provider',
          credentials: { key: 'val' }
        }
      });
      const res = mockResponse();

      await createConnection(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toMatch(/Unsupported provider/);
    });
  });

  describe('updateConnection()', () => {
    it('should successfully update connection and encrypt new credentials if provided', async () => {
      vi.spyOn(prisma.connections, 'findFirst').mockResolvedValue(MOCK_CONNECTION);
      const updateSpy = vi.spyOn(prisma.connections, 'update').mockResolvedValue({
        ...MOCK_CONNECTION,
        name: 'New Name'
      });

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { id: MOCK_CONNECTION_ID },
        body: {
          name: 'New Name',
          credentials: { key: 'new-credentials' }
        }
      });
      const res = mockResponse();

      await updateConnection(req, res);

      expect(updateSpy).toHaveBeenCalledTimes(1);
      const updateArgs = updateSpy.mock.calls[0][0];
      expect(updateArgs.data.name).toBe('New Name');
      expect(updateArgs.data.credentials.encrypted).toBeDefined();

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.name).toBe('New Name');
      expect(res.jsonData.credentials).toBeUndefined(); // Adheres to Security Rule 3
    });
  });

  describe('deleteConnection()', () => {
    it('should successfully delete connection if ownership matches', async () => {
      vi.spyOn(prisma.connections, 'findFirst').mockResolvedValue(MOCK_CONNECTION);
      const deleteSpy = vi.spyOn(prisma.connections, 'delete').mockResolvedValue(MOCK_CONNECTION);

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { id: MOCK_CONNECTION_ID }
      });
      const res = mockResponse();

      await deleteConnection(req, res);

      expect(deleteSpy).toHaveBeenCalledWith({
        where: { id: MOCK_CONNECTION_ID }
      });
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.message).toBe('Connection deleted successfully');
    });

    it('should return 400 if connection ID format is invalid', async () => {
      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { id: 'invalid-uuid-format' }
      });
      const res = mockResponse();

      await deleteConnection(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toBe('Invalid connection ID format');
    });

    it('should return 404 if connection does not exist or user does not own it', async () => {
      vi.spyOn(prisma.connections, 'findFirst').mockResolvedValue(null);

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { id: MOCK_CONNECTION_ID }
      });
      const res = mockResponse();

      await deleteConnection(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.error).toBe('Connection not found or access denied');
    });

    it('should return 500 when database delete throws an error', async () => {
      vi.spyOn(prisma.connections, 'findFirst').mockResolvedValue(MOCK_CONNECTION);
      vi.spyOn(prisma.connections, 'delete').mockRejectedValue(new Error('DB Delete Failure'));

      const req = mockRequest({
        user: { sub: MOCK_USER_ID },
        params: { id: MOCK_CONNECTION_ID }
      });
      const res = mockResponse();

      await deleteConnection(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.error).toBe('Internal server error while deleting connection');
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
