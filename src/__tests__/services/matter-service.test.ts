import { MatterService } from '@/lib/services/matter-service';
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

describe('MatterService', () => {
  let service: MatterService;

  beforeEach(() => {
    service = new MatterService();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all matters for an organization', async () => {
      const mockMatters = [
        {
          id: '1',
          title: 'Smith v. Jones',
          status: 'ACTIVE',
          type: 'LITIGATION',
          organizationId: 'org-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
          client: { id: 'c1', name: 'John Smith' },
          assignedTo: [{ id: 'u1', name: 'Jane Doe' }],
        },
        {
          id: '2',
          title: 'Contract Review - Acme Corp',
          status: 'PENDING',
          type: 'TRANSACTIONAL',
          organizationId: 'org-1',
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-10'),
          client: { id: 'c2', name: 'Acme Corp' },
          assignedTo: [{ id: 'u2', name: 'Bob Wilson' }],
        },
      ];

      (prisma.matter.findMany as jest.Mock).mockResolvedValue(mockMatters);

      const result = await service.getAll('org-1');

      expect(prisma.matter.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: {
          client: true,
          assignedTo: true,
          _count: { select: { documents: true, timeEntries: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Smith v. Jones');
    });

    it('should filter matters by status', async () => {
      const mockMatters = [
        { id: '1', title: 'Active Matter', status: 'ACTIVE' },
      ];

      (prisma.matter.findMany as jest.Mock).mockResolvedValue(mockMatters);

      const result = await service.getAll('org-1', { status: 'ACTIVE' });

      expect(prisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      );
      expect(result).toHaveLength(1);
    });

    it('should filter matters by type', async () => {
      const mockMatters = [
        { id: '1', title: 'Litigation Matter', type: 'LITIGATION' },
      ];

      (prisma.matter.findMany as jest.Mock).mockResolvedValue(mockMatters);

      await service.getAll('org-1', { type: 'LITIGATION' });

      expect(prisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'LITIGATION',
          }),
        })
      );
    });

    it('should search matters by title', async () => {
      (prisma.matter.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('org-1', { search: 'Smith' });

      expect(prisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: expect.objectContaining({
              contains: 'Smith',
              mode: 'insensitive',
            }),
          }),
        })
      );
    });

    it('should return empty array when no matters exist', async () => {
      (prisma.matter.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getAll('org-1');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return a matter by id with all relations', async () => {
      const mockMatter = {
        id: '1',
        title: 'Smith v. Jones',
        status: 'ACTIVE',
        type: 'LITIGATION',
        organizationId: 'org-1',
        client: { id: 'c1', name: 'John Smith' },
        assignedTo: [{ id: 'u1', name: 'Jane Doe' }],
        documents: [],
        timeEntries: [],
        tasks: [],
        invoices: [],
      };

      (prisma.matter.findUnique as jest.Mock).mockResolvedValue(mockMatter);

      const result = await service.getById('1');

      expect(prisma.matter.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          client: true,
          assignedTo: true,
          documents: true,
          timeEntries: true,
          tasks: true,
          invoices: true,
        },
      });
      expect(result).toEqual(mockMatter);
    });

    it('should throw error when matter not found', async () => {
      (prisma.matter.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(
        'Matter not found'
      );
    });
  });

  describe('create', () => {
    it('should create a new matter with valid data', async () => {
      const matterData = {
        title: 'New Litigation Case',
        description: 'Contract dispute with vendor',
        status: 'ACTIVE',
        type: 'LITIGATION',
        clientId: 'c1',
        organizationId: 'org-1',
        practiceArea: 'Commercial Litigation',
        jurisdiction: 'New York',
        courtName: 'Supreme Court of New York',
        filingDate: new Date('2024-03-01'),
        statuteOfLimitations: new Date('2027-03-01'),
        billingType: 'HOURLY',
        hourlyRate: 350,
        estimatedHours: 100,
      };

      const createdMatter = {
        id: 'new-1',
        ...matterData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.matter.create as jest.Mock).mockResolvedValue(createdMatter);

      const result = await service.create(matterData);

      expect(prisma.matter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Litigation Case',
          status: 'ACTIVE',
          type: 'LITIGATION',
        }),
      });
      expect(result.id).toBe('new-1');
    });

    it('should throw error when title is missing', async () => {
      const matterData = {
        status: 'ACTIVE',
        type: 'LITIGATION',
        clientId: 'c1',
        organizationId: 'org-1',
      };

      await expect(service.create(matterData as any)).rejects.toThrow();
    });

    it('should throw error when organizationId is missing', async () => {
      const matterData = {
        title: 'Test Matter',
        status: 'ACTIVE',
        type: 'LITIGATION',
        clientId: 'c1',
      };

      await expect(service.create(matterData as any)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update an existing matter', async () => {
      const updateData = {
        title: 'Updated Matter Title',
        status: 'CLOSED',
      };

      const updatedMatter = {
        id: '1',
        ...updateData,
        updatedAt: new Date(),
      };

      (prisma.matter.update as jest.Mock).mockResolvedValue(updatedMatter);

      const result = await service.update('1', updateData);

      expect(prisma.matter.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining(updateData),
      });
      expect(result.title).toBe('Updated Matter Title');
    });

    it('should throw error when updating non-existent matter', async () => {
      (prisma.matter.update as jest.Mock).mockRejectedValue(
        new Error('Record to update not found')
      );

      await expect(
        service.update('nonexistent', { title: 'Test' })
      ).rejects.toThrow('Record to update not found');
    });
  });

  describe('delete', () => {
    it('should delete a matter', async () => {
      (prisma.matter.delete as jest.Mock).mockResolvedValue({ id: '1' });

      await service.delete('1');

      expect(prisma.matter.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw error when deleting non-existent matter', async () => {
      (prisma.matter.delete as jest.Mock).mockRejectedValue(
        new Error('Record to delete not found')
      );

      await expect(service.delete('nonexistent')).rejects.toThrow();
    });
  });

  describe('getMatterStats', () => {
    it('should return matter statistics for an organization', async () => {
      (prisma.matter.count as jest.Mock)
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);

      const stats = await service.getMatterStats('org-1');

      expect(stats).toEqual({
        total: 25,
        active: 10,
        pending: 8,
        closed: 5,
        archived: 2,
      });
      expect(prisma.matter.count).toHaveBeenCalledTimes(5);
    });
  });

  describe('search', () => {
    it('should search matters by multiple criteria', async () => {
      (prisma.matter.findMany as jest.Mock).mockResolvedValue([
        { id: '1', title: 'Smith v. Jones' },
      ]);

      const results = await service.search('org-1', 'Smith');

      expect(prisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.any(Object) }),
            ]),
          }),
        })
      );
      expect(results).toHaveLength(1);
    });
  });
});
