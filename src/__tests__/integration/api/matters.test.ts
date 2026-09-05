import { createMocks } from 'node-mocks-http';
import { GET, POST, PUT, DELETE } from '@/app/api/matters/route';
import { GET as GET_BY_ID, PUT as PUT_BY_ID, DELETE as DELETE_BY_ID } from '@/app/api/matters/[id]/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    matter: {
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

describe('Matters API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/matters', () => {
    it('should return all matters for the organization', async () => {
      const mockMatters = [
        {
          id: 'm1',
          title: 'Smith v. Jones',
          status: 'ACTIVE',
          type: 'LITIGATION',
          organizationId: 'org-1',
          client: { id: 'c1', name: 'John Smith' },
          assignedTo: [{ id: 'u1', name: 'Jane Doe' }],
        },
      ];

      (prisma.matter.findMany as jest.Mock).mockResolvedValue(mockMatters);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/matters',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('Smith v. Jones');
    });

    it('should filter matters by status', async () => {
      (prisma.matter.findMany as jest.Mock).mockResolvedValue([]);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/matters?status=ACTIVE',
      });

      const response = await GET(req as any);

      expect(response.status).toBe(200);
      expect(prisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        })
      );
    });

    it('should search matters by title', async () => {
      (prisma.matter.findMany as jest.Mock).mockResolvedValue([]);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/matters?search=Smith',
      });

      const response = await GET(req as any);

      expect(response.status).toBe(200);
      expect(prisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: expect.objectContaining({
              contains: 'Smith',
            }),
          }),
        })
      );
    });

    it('should return 401 when not authenticated', async () => {
      const { getServerSession } = require('@/lib/auth');
      getServerSession.mockResolvedValueOnce(null);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/matters',
      });

      const response = await GET(req as any);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/matters', () => {
    it('should create a new matter', async () => {
      const matterData = {
        title: 'New Litigation Case',
        description: 'Contract dispute',
        status: 'ACTIVE',
        type: 'LITIGATION',
        clientId: 'c1',
        practiceArea: 'Commercial Litigation',
        jurisdiction: 'New York',
        billingType: 'HOURLY',
        hourlyRate: 350,
      };

      const createdMatter = {
        id: 'new-m1',
        ...matterData,
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.matter.create as jest.Mock).mockResolvedValue(createdMatter);

      const { req } = createMocks({
        method: 'POST',
        url: '/api/matters',
        body: matterData,
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('new-m1');
      expect(data.title).toBe('New Litigation Case');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        status: 'ACTIVE',
        type: 'LITIGATION',
      };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/matters',
        body: invalidData,
      });

      const response = await POST(req as any);

      expect(response.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const { getServerSession } = require('@/lib/auth');
      getServerSession.mockResolvedValueOnce(null);

      const { req } = createMocks({
        method: 'POST',
        url: '/api/matters',
        body: { title: 'Test' },
      });

      const response = await POST(req as any);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/matters/[id]', () => {
    it('should return a matter by id', async () => {
      const mockMatter = {
        id: 'm1',
        title: 'Smith v. Jones',
        status: 'ACTIVE',
        client: { id: 'c1', name: 'John Smith' },
        assignedTo: [{ id: 'u1', name: 'Jane Doe' }],
        documents: [],
        timeEntries: [],
        tasks: [],
      };

      (prisma.matter.findUnique as jest.Mock).mockResolvedValue(mockMatter);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/matters/m1',
      });

      const response = await GET_BY_ID(req as any, {
        params: { id: 'm1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Smith v. Jones');
    });

    it('should return 404 when matter not found', async () => {
      (prisma.matter.findUnique as jest.Mock).mockResolvedValue(null);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/matters/nonexistent',
      });

      const response = await GET_BY_ID(req as any, {
        params: { id: 'nonexistent' },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/matters/[id]', () => {
    it('should update a matter', async () => {
      const updatedMatter = {
        id: 'm1',
        title: 'Updated Matter',
        status: 'CLOSED',
      };

      (prisma.matter.update as jest.Mock).mockResolvedValue(updatedMatter);

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/matters/m1',
        body: { title: 'Updated Matter', status: 'CLOSED' },
      });

      const response = await PUT_BY_ID(req as any, {
        params: { id: 'm1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Matter');
    });

    it('should return 404 when updating non-existent matter', async () => {
      (prisma.matter.update as jest.Mock).mockRejectedValue(
        new Error('Record to update not found')
      );

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/matters/nonexistent',
        body: { title: 'Test' },
      });

      const response = await PUT_BY_ID(req as any, {
        params: { id: 'nonexistent' },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/matters/[id]', () => {
    it('should delete a matter', async () => {
      (prisma.matter.delete as jest.Mock).mockResolvedValue({ id: 'm1' });

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/matters/m1',
      });

      const response = await DELETE_BY_ID(req as any, {
        params: { id: 'm1' },
      });

      expect(response.status).toBe(200);
    });

    it('should return 404 when deleting non-existent matter', async () => {
      (prisma.matter.delete as jest.Mock).mockRejectedValue(
        new Error('Record to delete not found')
      );

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/matters/nonexistent',
      });

      const response = await DELETE_BY_ID(req as any, {
        params: { id: 'nonexistent' },
      });

      expect(response.status).toBe(404);
    });
  });
});
