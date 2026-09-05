import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/documents/route';
import { GET as GET_BY_ID, DELETE as DELETE_BY_ID } from '@/app/api/documents/[id]/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
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

jest.mock('node:fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('Documents API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/documents', () => {
    it('should return all documents for a matter', async () => {
      const mockDocuments = [
        {
          id: 'd1',
          name: 'Contract Draft.pdf',
          type: 'CONTRACT',
          mimeType: 'application/pdf',
          size: 245760,
          matterId: 'm1',
          uploadedByUser: { id: 'u1', name: 'Jane Doe' },
          tags: [{ id: 't1', name: 'contract' }],
          versions: [{ version: 2 }],
        },
      ];

      (prisma.document.findMany as jest.Mock).mockResolvedValue(mockDocuments);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/documents?matterId=m1',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
    });

    it('should filter documents by type', async () => {
      (prisma.document.findMany as jest.Mock).mockResolvedValue([]);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/documents?matterId=m1&type=CONTRACT',
      });

      const response = await GET(req as any);

      expect(response.status).toBe(200);
      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'CONTRACT' }),
        })
      );
    });

    it('should search documents by name', async () => {
      (prisma.document.findMany as jest.Mock).mockResolvedValue([]);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/documents?matterId=m1&search=Contract',
      });

      const response = await GET(req as any);

      expect(response.status).toBe(200);
    });

    it('should return 400 when matterId is missing', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/documents',
      });

      const response = await GET(req as any);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/documents', () => {
    it('should upload a document', async () => {
      const mockFile = new File(['test content'], 'contract.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('matterId', 'm1');
      formData.append('type', 'CONTRACT');
      formData.append('description', 'Main contract');

      const createdDoc = {
        id: 'new-d1',
        name: 'contract.pdf',
        type: 'CONTRACT',
        size: 12,
        mimeType: 'application/pdf',
        matterId: 'm1',
        uploadedBy: 'u1',
      };

      (prisma.document.create as jest.Mock).mockResolvedValue(createdDoc);

      const { req } = createMocks({
        method: 'POST',
        url: '/api/documents',
      });
      req.formData = jest.fn().mockResolvedValue(formData);

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('contract.pdf');
    });

    it('should return 400 when no file provided', async () => {
      const formData = new FormData();
      formData.append('matterId', 'm1');

      const { req } = createMocks({
        method: 'POST',
        url: '/api/documents',
      });
      req.formData = jest.fn().mockResolvedValue(formData);

      const response = await POST(req as any);

      expect(response.status).toBe(400);
    });

    it('should reject files exceeding size limit', async () => {
      const largeContent = 'x'.repeat(100 * 1024 * 1024);
      const mockFile = new File([largeContent], 'large.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('matterId', 'm1');
      formData.append('type', 'CONTRACT');

      const { req } = createMocks({
        method: 'POST',
        url: '/api/documents',
      });
      req.formData = jest.fn().mockResolvedValue(formData);

      const response = await POST(req as any);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/documents/[id]', () => {
    it('should return a document by id', async () => {
      const mockDocument = {
        id: 'd1',
        name: 'Contract Draft.pdf',
        type: 'CONTRACT',
        matterId: 'm1',
        versions: [],
        tags: [],
        uploadedByUser: { id: 'u1', name: 'Jane Doe' },
        matter: { id: 'm1', title: 'Smith v. Jones' },
      };

      (prisma.document.findUnique as jest.Mock).mockResolvedValue(mockDocument);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/documents/d1',
      });

      const response = await GET_BY_ID(req as any, {
        params: { id: 'd1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Contract Draft.pdf');
    });

    it('should return 404 when document not found', async () => {
      (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/documents/nonexistent',
      });

      const response = await GET_BY_ID(req as any, {
        params: { id: 'nonexistent' },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/documents/[id]', () => {
    it('should delete a document', async () => {
      (prisma.document.findUnique as jest.Mock).mockResolvedValue({
        id: 'd1',
        storagePath: '/uploads/org-1/m1/d1/file.pdf',
      });
      (prisma.document.delete as jest.Mock).mockResolvedValue({ id: 'd1' });

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/documents/d1',
      });

      const response = await DELETE_BY_ID(req as any, {
        params: { id: 'd1' },
      });

      expect(response.status).toBe(200);
    });

    it('should return 404 when deleting non-existent document', async () => {
      (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/documents/nonexistent',
      });

      const response = await DELETE_BY_ID(req as any, {
        params: { id: 'nonexistent' },
      });

      expect(response.status).toBe(404);
    });
  });
});
