import { TimeEntryService } from '@/lib/services/time-entry-service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    timeEntry: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

describe('TimeEntryService', () => {
  let service: TimeEntryService;

  beforeEach(() => {
    service = new TimeEntryService();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all time entries for a matter', async () => {
      const mockEntries = [
        {
          id: 'te1',
          description: 'Contract review and analysis',
          hours: 3.5,
          rate: 350,
          amount: 1225,
          date: new Date('2024-03-15'),
          status: 'APPROVED',
          billable: true,
          matterId: 'm1',
          userId: 'u1',
          user: { id: 'u1', name: 'Jane Doe' },
          category: 'LEGAL_RESEARCH',
          createdAt: new Date('2024-03-15'),
        },
        {
          id: 'te2',
          description: 'Client meeting - case strategy',
          hours: 1.5,
          rate: 350,
          amount: 525,
          date: new Date('2024-03-16'),
          status: 'PENDING',
          billable: true,
          matterId: 'm1',
          userId: 'u1',
          user: { id: 'u1', name: 'Jane Doe' },
          category: 'MEETING',
          createdAt: new Date('2024-03-16'),
        },
      ];

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const result = await service.getAll('m1');

      expect(prisma.timeEntry.findMany).toHaveBeenCalledWith({
        where: { matterId: 'm1' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
        orderBy: { date: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by user', async () => {
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('m1', { userId: 'u1' });

      expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'u1' }),
        })
      );
    });

    it('should filter by date range', async () => {
      const start = new Date('2024-03-01');
      const end = new Date('2024-03-31');

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('m1', { dateFrom: start, dateTo: end });

      expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({ gte: start, lte: end }),
          }),
        })
      );
    });

    it('should filter billable entries only', async () => {
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('m1', { billable: true });

      expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ billable: true }),
        })
      );
    });

    it('should filter by status', async () => {
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('m1', { status: 'APPROVED' });

      expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'APPROVED' }),
        })
      );
    });
  });

  describe('create', () => {
    it('should create a new time entry', async () => {
      const entryData = {
        description: 'Drafted motion for summary judgment',
        hours: 4.5,
        rate: 350,
        date: new Date('2024-03-20'),
        matterId: 'm1',
        userId: 'u1',
        billable: true,
        category: 'DRAFTING',
        activityType: 'LEGAL_WORK',
      };

      const createdEntry = {
        id: 'new-te1',
        ...entryData,
        amount: 1575,
        status: 'PENDING',
        createdAt: new Date(),
      };

      (prisma.timeEntry.create as jest.Mock).mockResolvedValue(createdEntry);

      const result = await service.create(entryData);

      expect(prisma.timeEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Drafted motion for summary judgment',
          hours: 4.5,
          rate: 350,
          billable: true,
          status: 'PENDING',
        }),
      });
      expect(result.amount).toBe(1575);
    });

    it('should calculate amount automatically', async () => {
      const entryData = {
        description: 'Research',
        hours: 2,
        rate: 300,
        date: new Date(),
        matterId: 'm1',
        userId: 'u1',
        billable: true,
      };

      (prisma.timeEntry.create as jest.Mock).mockResolvedValue({
        id: 'te1',
        ...entryData,
        amount: 600,
      });

      const result = await service.create(entryData);

      expect(result.amount).toBe(600);
    });

    it('should validate hours are positive', async () => {
      const entryData = {
        description: 'Negative hours',
        hours: -2,
        rate: 350,
        date: new Date(),
        matterId: 'm1',
        userId: 'u1',
        billable: true,
      };

      await expect(service.create(entryData)).rejects.toThrow(
        'Hours must be positive'
      );
    });

    it('should validate hours do not exceed 24', async () => {
      const entryData = {
        description: 'Too many hours',
        hours: 25,
        rate: 350,
        date: new Date(),
        matterId: 'm1',
        userId: 'u1',
        billable: true,
      };

      await expect(service.create(entryData)).rejects.toThrow(
        'Hours cannot exceed 24'
      );
    });

    it('should validate rate is positive', async () => {
      const entryData = {
        description: 'Zero rate',
        hours: 2,
        rate: 0,
        date: new Date(),
        matterId: 'm1',
        userId: 'u1',
        billable: true,
      };

      await expect(service.create(entryData)).rejects.toThrow(
        'Rate must be positive'
      );
    });

    it('should throw error when description is missing', async () => {
      const entryData = {
        hours: 2,
        rate: 350,
        date: new Date(),
        matterId: 'm1',
        userId: 'u1',
        billable: true,
      };

      await expect(service.create(entryData as any)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a time entry', async () => {
      const updatedEntry = {
        id: 'te1',
        description: 'Updated description',
        hours: 5,
        amount: 1750,
      };

      (prisma.timeEntry.update as jest.Mock).mockResolvedValue(updatedEntry);

      const result = await service.update('te1', {
        description: 'Updated description',
        hours: 5,
      });

      expect(result.description).toBe('Updated description');
      expect(result.hours).toBe(5);
    });

    it('should recalculate amount when hours change', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue({
        id: 'te1',
        rate: 350,
      });
      (prisma.timeEntry.update as jest.Mock).mockResolvedValue({
        id: 'te1',
        hours: 6,
        amount: 2100,
      });

      const result = await service.update('te1', { hours: 6 });

      expect(result.amount).toBe(2100);
    });

    it('should not allow editing approved entries', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue({
        id: 'te1',
        status: 'APPROVED',
      });

      await expect(
        service.update('te1', { hours: 5 })
      ).rejects.toThrow('Cannot edit approved time entries');
    });
  });

  describe('delete', () => {
    it('should delete a pending time entry', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue({
        id: 'te1',
        status: 'PENDING',
      });
      (prisma.timeEntry.delete as jest.Mock).mockResolvedValue({ id: 'te1' });

      await service.delete('te1');

      expect(prisma.timeEntry.delete).toHaveBeenCalledWith({
        where: { id: 'te1' },
      });
    });

    it('should not allow deleting approved entries', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue({
        id: 'te1',
        status: 'APPROVED',
      });

      await expect(service.delete('te1')).rejects.toThrow(
        'Cannot delete approved time entries'
      );
    });
  });

  describe('getTotalHours', () => {
    it('should return total billable hours for a matter', async () => {
      (prisma.timeEntry.aggregate as jest.Mock).mockResolvedValue({
        _sum: { hours: 45.5, amount: 15925 },
        _count: { id: 12 },
      });

      const result = await service.getTotalHours('m1');

      expect(result).toEqual({
        totalHours: 45.5,
        totalAmount: 15925,
        entryCount: 12,
      });
    });

    it('should filter by date range', async () => {
      const start = new Date('2024-03-01');
      const end = new Date('2024-03-31');

      (prisma.timeEntry.aggregate as jest.Mock).mockResolvedValue({
        _sum: { hours: 20, amount: 7000 },
        _count: { id: 5 },
      });

      await service.getTotalHours('m1', { dateFrom: start, dateTo: end });

      expect(prisma.timeEntry.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({ gte: start, lte: end }),
          }),
        })
      );
    });
  });

  describe('getTimeEntriesByUser', () => {
    it('should return time entries grouped by user', async () => {
      const mockEntries = [
        {
          id: 'te1',
          userId: 'u1',
          user: { name: 'Jane Doe' },
          hours: 3.5,
          amount: 1225,
        },
        {
          id: 'te2',
          userId: 'u1',
          user: { name: 'Jane Doe' },
          hours: 2,
          amount: 700,
        },
        {
          id: 'te3',
          userId: 'u2',
          user: { name: 'Bob Wilson' },
          hours: 4,
          amount: 1400,
        },
      ];

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const result = await service.getTimeEntriesByUser('m1');

      expect(result).toHaveLength(2);
      expect(result[0].totalHours).toBe(5.5);
      expect(result[1].totalHours).toBe(4);
    });
  });

  describe('getUnbilledEntries', () => {
    it('should return unbilled billable entries', async () => {
      const unbilled = [
        { id: 'te1', hours: 3, billable: true, invoiceId: null },
        { id: 'te2', hours: 2, billable: true, invoiceId: null },
      ];

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(unbilled);

      const result = await service.getUnbilledEntries('m1');

      expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            billable: true,
            invoiceId: null,
          }),
        })
      );
      expect(result).toHaveLength(2);
    });
  });
});
