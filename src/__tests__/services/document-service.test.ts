import { DocumentService } from '@/lib/services/document-service';
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
    documentVersion: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('node:fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('DocumentService', () => {
  let service: DocumentService;

  beforeEach(() => {
    service = new DocumentService();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all documents for a matter', async () => {
      const mockDocuments = [
        {
          id: 'd1',
          name: 'Contract Draft v1.pdf',
          type: 'CONTRACT',
          mimeType: 'application/pdf',
          size: 245760,
          matterId: 'm1',
          uploadedBy: 'u1',
          createdAt: new Date('2024-01-15'),
          tags: ['contract', 'draft'],
          versions: [
            { id: 'v1', version: 1, uploadedAt: new Date('2024-01-15') },
          ],
        },
        {
          id: 'd2',
          name: 'Client Correspondence.docx',
          type: 'CORRESPONDENCE',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 102400,
          matterId: 'm1',
          uploadedBy: 'u2',
          createdAt: new Date('2024-01-20'),
          tags: ['correspondence'],
          versions: [
            { id: 'v2', version: 1, uploadedAt: new Date('2024-01-20') },
          ],
        },
      ];

      (prisma.document.findMany as jest.Mock).mockResolvedValue(mockDocuments);

      const result = await service.getAll('m1');

      expect(prisma.document.findMany).toHaveBeenCalledWith({
        where: { matterId: 'm1' },
        include: {
          versions: { orderBy: { version: 'desc' }, take: 1 },
          uploadedByUser: { select: { id: true, name: true, email: true } },
          tags: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter documents by type', async () => {
      (prisma.document.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('m1', { type: 'CONTRACT' });

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'CONTRACT' }),
        })
      );
    });

    it('should search documents by name', async () => {
      (prisma.document.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('m1', { search: 'Contract' });

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.objectContaining({
              contains: 'Contract',
              mode: 'insensitive',
            }),
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');

      (prisma.document.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('m1', { dateFrom: start, dateTo: end });

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: start,
              lte: end,
            }),
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return a document by id with version history', async () => {
      const mockDocument = {
        id: 'd1',
        name: 'Contract Draft.pdf',
        type: 'CONTRACT',
        mimeType: 'application/pdf',
        size: 245760,
        matterId: 'm1',
        uploadedBy: 'u1',
        storagePath: '/uploads/org-1/m1/d1/contract.pdf',
        content: null,
        versions: [
          { id: 'v2', version: 2, uploadedAt: new Date('2024-01-20'), notes: 'Revised terms' },
          { id: 'v1', version: 1, uploadedAt: new Date('2024-01-15'), notes: 'Initial draft' },
        ],
        tags: [{ id: 't1', name: 'contract' }],
        uploadedByUser: { id: 'u1', name: 'Jane Doe' },
        matter: { id: 'm1', title: 'Smith v. Jones' },
      };

      (prisma.document.findUnique as jest.Mock).mockResolvedValue(mockDocument);

      const result = await service.getById('d1');

      expect(prisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: 'd1' },
        include: {
          versions: { orderBy: { version: 'desc' } },
          tags: true,
          uploadedByUser: { select: { id: true, name: true, email: true } },
          matter: { select: { id: true, title: true } },
        },
      });
      expect(result.versions).toHaveLength(2);
    });

    it('should throw error when document not found', async () => {
      (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(
        'Document not found'
      );
    });
  });

  describe('upload', () => {
    it('should upload a document with valid file', async () => {
      const file = {
        name: 'contract.pdf',
        type: 'application/pdf',
        size: 102400,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(102400)),
      };

      const uploadData = {
        matterId: 'm1',
        organizationId: 'org-1',
        uploadedBy: 'u1',
        type: 'CONTRACT',
        tags: ['contract', 'important'],
        description: 'Main contract for the case',
      };

      const createdDoc = {
        id: 'new-d1',
        name: 'contract.pdf',
        type: 'CONTRACT',
        size: 102400,
        mimeType: 'application/pdf',
        matterId: 'm1',
        uploadedBy: 'u1',
        storagePath: '/uploads/org-1/m1/new-d1/contract.pdf',
        tags: [{ id: 't1', name: 'contract' }],
      };

      (prisma.document.create as jest.Mock).mockResolvedValue(createdDoc);

      const result = await service.upload(file as any, uploadData);

      expect(prisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'contract.pdf',
            type: 'CONTRACT',
            matterId: 'm1',
          }),
        })
      );
      expect(result.id).toBe('new-d1');
    });

    it('should reject files larger than max size', async () => {
      const file = {
        name: 'huge-file.pdf',
        type: 'application/pdf',
        size: 100 * 1024 * 1024,
        arrayBuffer: jest.fn(),
      };

      const uploadData = {
        matterId: 'm1',
        organizationId: 'org-1',
        uploadedBy: 'u1',
        type: 'CONTRACT',
      };

      await expect(service.upload(file as any, uploadData)).rejects.toThrow(
        'File size exceeds maximum'
      );
    });

    it('should reject disallowed file types', async () => {
      const file = {
        name: 'malware.exe',
        type: 'application/x-executable',
        size: 1024,
        arrayBuffer: jest.fn(),
      };

      const uploadData = {
        matterId: 'm1',
        organizationId: 'org-1',
        uploadedBy: 'u1',
        type: 'OTHER',
      };

      await expect(service.upload(file as any, uploadData)).rejects.toThrow(
        'File type not allowed'
      );
    });
  });

  describe('createVersion', () => {
    it('should create a new version of a document', async () => {
      const existingDoc = {
        id: 'd1',
        versions: [{ version: 2 }],
        matterId: 'm1',
      };

      (prisma.document.findUnique as jest.Mock).mockResolvedValue(existingDoc);
      (prisma.documentVersion.create as jest.Mock).mockResolvedValue({
        id: 'v3',
        documentId: 'd1',
        version: 3,
        uploadedBy: 'u1',
      });

      const file = {
        name: 'contract-v3.pdf',
        size: 102400,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(102400)),
      };

      const result = await service.createVersion('d1', file as any, 'u1', 'Updated terms');

      expect(prisma.documentVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentId: 'd1',
            version: 3,
            uploadedBy: 'u1',
          }),
        })
      );
      expect(result.version).toBe(3);
    });

    it('should throw error when creating version for non-existent document', async () => {
      (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);

      const file = { name: 'test.pdf', size: 1024, arrayBuffer: jest.fn() };

      await expect(
        service.createVersion('nonexistent', file as any, 'u1', 'Note')
      ).rejects.toThrow('Document not found');
    });
  });

  describe('delete', () => {
    it('should delete a document and its versions', async () => {
      (prisma.document.findUnique as jest.Mock).mockResolvedValue({
        id: 'd1',
        storagePath: '/uploads/org-1/m1/d1/file.pdf',
      });
      (prisma.document.delete as jest.Mock).mockResolvedValue({ id: 'd1' });

      await service.delete('d1');

      expect(prisma.document.delete).toHaveBeenCalledWith({
        where: { id: 'd1' },
      });
    });

    it('should throw error when deleting non-existent document', async () => {
      (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        'Document not found'
      );
    });
  });

  describe('getDocumentStats', () => {
    it('should return document statistics for a matter', async () => {
      (prisma.document.count as jest.Mock)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(3);

      const stats = await service.getDocumentStats('m1');

      expect(stats).toEqual({
        total: 20,
        contracts: 5,
        correspondence: 8,
        filings: 4,
        other: 3,
      });
    });
  });
});
