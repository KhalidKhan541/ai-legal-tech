import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/clients/route';
import { GET as GET_BY_ID, PUT as PUT_BY_ID, DELETE as DELETE_BY_ID } from '@/app/api/clients/[id]/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: {
        id: 'u1',
        name: 'Test User',
        email: 'test@law.com',
        role: 'PARTNER',
        organizationId: 'org-1',
      },
    })
  ),
}));

describe('Clients API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/clients', () => {
    it('should return all clients for the organization', async () => {
      const mockClients = [
        {
          id: 'c1',
          name: 'Acme Corporation',
          email: 'legal@acme.com',
          type: 'CORPORATION',
          organizationId: 'org-1',
          _count: { matters: 3, invoices: 5 },
        },
        {
          id: 'c2',
          name: 'John Smith',
          email: 'john@smith.com',
          type: 'INDIVIDUAL',
          organizationId: 'org-1',
          _count: { matters: 1, invoices: 2 },
        },
      ];

      (prisma.client.findMany as jest.Mock).mockResolvedValue(mockClients);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/clients',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
    });

    it('should filter clients by type', async () => {
      (prisma.client.findMany as jest.Mock).mockResolvedValue([]);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/clients?type=CORPORATION',
      });

      const response = await GET(req as any);

      expect(response.status).toBe(200);
      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'CORPORATION' }),
        })
      );
    });

    it('should search clients by name', async () => {
      (prisma.client.findMany as jest.Mock).mockResolvedValue([]);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/clients?search=Acme',
      });

      const response = await GET(req as any);

      expect(response.status).toBe(200);
    });

    it('should return 401 when not authenticated', async () => {
      const { getServerSession } = require('@/lib/auth');
      getServerSession.mockResolvedValueOnce(null);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/clients',
      });

      const response = await GET(req as any);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/clients', () => {
    it('should create a new client', async () => {
      const clientData = {
        name: 'Tech Startup Inc',
        email: 'legal@techstartup.com',
        phone: '+1-555-0100',
        type: 'CORPORATION',
        taxId: '98-7654321',
        industry: 'Technology',
        address: {
          street: '123 Tech Blvd',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
          country: 'US',
        },
      };

      const createdClient = {
        id: 'new-c1',
        ...clientData,
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.client.create as jest.Mock).mockResolvedValue(createdClient);

      const { req } = createMocks({
        method: 'POST',
        url: '/api/clients',
        body: clientData,
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('new-c1');
      expect(data.name).toBe('Tech Startup Inc');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        type: 'CORPORATION',
      };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/clients',
        body: invalidData,
      });

      const response = await POST(req as any);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email', async () => {
      const invalidData = {
        name: 'Test',
        email: 'not-an-email',
        type: 'INDIVIDUAL',
      };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/clients',
        body: invalidData,
      });

      const response = await POST(req as any);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/clients/[id]', () => {
    it('should return a client by id', async () => {
      const mockClient = {
        id: 'c1',
        name: 'Acme Corporation',
        email: 'legal@acme.com',
        type: 'CORPORATION',
        matters: [],
        invoices: [],
        contacts: [],
      };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(mockClient);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/clients/c1',
      });

      const response = await GET_BY_ID(req as any, {
        params: { id: 'c1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Acme Corporation');
    });

    it('should return 404 when client not found', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/clients/nonexistent',
      });

      const response = await GET_BY_ID(req as any, {
        params: { id: 'nonexistent' },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/clients/[id]', () => {
    it('should update a client', async () => {
      const updatedClient = {
        id: 'c1',
        name: 'Acme Corp Updated',
        email: 'new@acme.com',
      };

      (prisma.client.update as jest.Mock).mockResolvedValue(updatedClient);

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/clients/c1',
        body: { name: 'Acme Corp Updated', email: 'new@acme.com' },
      });

      const response = await PUT_BY_ID(req as any, {
        params: { id: 'c1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Acme Corp Updated');
    });
  });

  describe('DELETE /api/clients/[id]', () => {
    it('should delete a client', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        matters: [],
      });
      (prisma.client.update as jest.Mock).mockResolvedValue({
        id: 'c1',
        deletedAt: new Date(),
      });

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/clients/c1',
      });

      const response = await DELETE_BY_ID(req as any, {
        params: { id: 'c1' },
      });

      expect(response.status).toBe(200);
    });

    it('should return 400 when client has active matters', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        matters: [{ id: 'm1', status: 'ACTIVE' }],
      });

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/clients/c1',
      });

      const response = await DELETE_BY_ID(req as any, {
        params: { id: 'c1' },
      });

      expect(response.status).toBe(400);
    });
  });
});
