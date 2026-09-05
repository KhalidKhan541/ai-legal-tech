import { DeadlineTracker } from '@/lib/deadline-tracker';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    deadline: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    matter: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/notifications', () => ({
  sendNotification: jest.fn(),
  sendEmail: jest.fn(),
}));

describe('DeadlineTracker', () => {
  let tracker: DeadlineTracker;

  beforeEach(() => {
    tracker = new DeadlineTracker();
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getUpcomingDeadlines', () => {
    it('should return deadlines within the specified days', async () => {
      const mockDeadlines = [
        {
          id: 'dl1',
          title: 'File motion for summary judgment',
          date: new Date('2024-03-20'),
          type: 'COURT_FILING',
          priority: 'HIGH',
          matterId: 'm1',
          matter: { id: 'm1', title: 'Smith v. Jones' },
          completed: false,
          reminded: false,
        },
        {
          id: 'dl2',
          title: 'Respond to discovery requests',
          date: new Date('2024-03-25'),
          type: 'DISCOVERY',
          priority: 'URGENT',
          matterId: 'm1',
          matter: { id: 'm1', title: 'Smith v. Jones' },
          completed: false,
          reminded: false,
        },
      ];

      (prisma.deadline.findMany as jest.Mock).mockResolvedValue(mockDeadlines);

      const result = await tracker.getUpcomingDeadlines('org-1', 30);

      expect(prisma.deadline.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
            completed: false,
          }),
        })
      );
      expect(result).toHaveLength(2);
    });

    it('should filter by matter', async () => {
      (prisma.deadline.findMany as jest.Mock).mockResolvedValue([]);

      await tracker.getUpcomingDeadlines('org-1', 30, { matterId: 'm1' });

      expect(prisma.deadline.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            matterId: 'm1',
          }),
        })
      );
    });

    it('should filter by type', async () => {
      (prisma.deadline.findMany as jest.Mock).mockResolvedValue([]);

      await tracker.getUpcomingDeadlines('org-1', 30, {
        type: 'COURT_FILING',
      });

      expect(prisma.deadline.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'COURT_FILING',
          }),
        })
      );
    });

    it('should sort by date ascending', async () => {
      (prisma.deadline.findMany as jest.Mock).mockResolvedValue([]);

      await tracker.getUpcomingDeadlines('org-1', 30);

      expect(prisma.deadline.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { date: 'asc' },
        })
      );
    });
  });

  describe('getOverdueDeadlines', () => {
    it('should return overdue deadlines', async () => {
      const overdueDeadlines = [
        {
          id: 'dl1',
          title: 'Late filing',
          date: new Date('2024-03-10'),
          type: 'COURT_FILING',
          priority: 'URGENT',
          matterId: 'm1',
          matter: { id: 'm1', title: 'Smith v. Jones' },
          completed: false,
        },
      ];

      (prisma.deadline.findMany as jest.Mock).mockResolvedValue(
        overdueDeadlines
      );

      const result = await tracker.getOverdueDeadlines('org-1');

      expect(prisma.deadline.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({ lt: expect.any(Date) }),
            completed: false,
          }),
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create a new deadline', async () => {
      const deadlineData = {
        title: 'File opposition brief',
        description: 'Opposition to motion for summary judgment',
        date: new Date('2024-04-01'),
        type: 'COURT_FILING',
        priority: 'HIGH',
        matterId: 'm1',
        organizationId: 'org-1',
        createdBy: 'u1',
        reminderDays: [7, 3, 1],
      };

      const createdDeadline = {
        id: 'new-dl1',
        ...deadlineData,
        completed: false,
        reminded: false,
      };

      (prisma.deadline.create as jest.Mock).mockResolvedValue(createdDeadline);

      const result = await tracker.create(deadlineData);

      expect(prisma.deadline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'File opposition brief',
          type: 'COURT_FILING',
          priority: 'HIGH',
        }),
      });
      expect(result.id).toBe('new-dl1');
    });

    it('should validate deadline date is in the future', async () => {
      const deadlineData = {
        title: 'Past deadline',
        date: new Date('2024-01-01'),
        type: 'COURT_FILING',
        matterId: 'm1',
        organizationId: 'org-1',
        createdBy: 'u1',
      };

      await expect(tracker.create(deadlineData)).rejects.toThrow(
        'Deadline date must be in the future'
      );
    });

    it('should validate required fields', async () => {
      const deadlineData = {
        date: new Date('2024-04-01'),
        matterId: 'm1',
        organizationId: 'org-1',
        createdBy: 'u1',
      };

      await expect(tracker.create(deadlineData as any)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a deadline', async () => {
      const updatedDeadline = {
        id: 'dl1',
        title: 'Updated title',
        date: new Date('2024-04-05'),
      };

      (prisma.deadline.update as jest.Mock).mockResolvedValue(updatedDeadline);

      const result = await tracker.update('dl1', {
        title: 'Updated title',
        date: new Date('2024-04-05'),
      });

      expect(result.title).toBe('Updated title');
    });

    it('should mark deadline as completed', async () => {
      (prisma.deadline.findUnique as jest.Mock).mockResolvedValue({
        id: 'dl1',
        completed: false,
      });
      (prisma.deadline.update as jest.Mock).mockResolvedValue({
        id: 'dl1',
        completed: true,
        completedAt: new Date(),
      });

      const result = await tracker.markCompleted('dl1');

      expect(result.completed).toBe(true);
      expect(result.completedAt).toBeDefined();
    });

    it('should not allow completing an already completed deadline', async () => {
      (prisma.deadline.findUnique as jest.Mock).mockResolvedValue({
        id: 'dl1',
        completed: true,
      });

      await expect(tracker.markCompleted('dl1')).rejects.toThrow(
        'Deadline already completed'
      );
    });
  });

  describe('delete', () => {
    it('should delete a deadline', async () => {
      (prisma.deadline.delete as jest.Mock).mockResolvedValue({ id: 'dl1' });

      await tracker.delete('dl1');

      expect(prisma.deadline.delete).toHaveBeenCalledWith({
        where: { id: 'dl1' },
      });
    });
  });

  describe('checkReminders', () => {
    it('should send reminders for deadlines approaching', async () => {
      const deadlinesNeedingReminders = [
        {
          id: 'dl1',
          title: 'Filing due in 3 days',
          date: new Date('2024-03-18'),
          type: 'COURT_FILING',
          matterId: 'm1',
          matter: { id: 'm1', title: 'Smith v. Jones', organizationId: 'org-1' },
          reminded: false,
          reminderDays: [7, 3, 1],
        },
      ];

      (prisma.deadline.findMany as jest.Mock).mockResolvedValue(
        deadlinesNeedingReminders
      );
      (prisma.deadline.update as jest.Mock).mockResolvedValue({});

      const { sendNotification } = require('@/lib/notifications');

      await tracker.checkReminders();

      expect(sendNotification).toHaveBeenCalled();
      expect(prisma.deadline.update).toHaveBeenCalledWith({
        where: { id: 'dl1' },
        data: { reminded: true },
      });
    });

    it('should not send reminders for completed deadlines', async () => {
      (prisma.deadline.findMany as jest.Mock).mockResolvedValue([]);

      const { sendNotification } = require('@/lib/notifications');

      await tracker.checkReminders();

      expect(sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('getDeadlineStats', () => {
    it('should return deadline statistics', async () => {
      (prisma.deadline.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { id: 'dl1', date: new Date('2024-03-20') },
          { id: 'dl2', date: new Date('2024-03-25') },
        ])
        .mockResolvedValueOnce([{ id: 'dl3', date: new Date('2024-03-10') }])
        .mockResolvedValueOnce([{ id: 'dl4' }, { id: 'dl5' }]);

      const stats = await tracker.getDeadlineStats('org-1');

      expect(stats).toEqual({
        upcoming: 2,
        overdue: 1,
        completed: 2,
      });
    });
  });

  describe('getDeadlinesByType', () => {
    it('should return deadlines grouped by type', async () => {
      const mockDeadlines = [
        { id: 'dl1', type: 'COURT_FILING', title: 'Filing 1' },
        { id: 'dl2', type: 'COURT_FILING', title: 'Filing 2' },
        { id: 'dl3', type: 'DISCOVERY', title: 'Discovery 1' },
      ];

      (prisma.deadline.findMany as jest.Mock).mockResolvedValue(mockDeadlines);

      const result = await tracker.getDeadlinesByType('org-1');

      expect(result).toEqual([
        { type: 'COURT_FILING', count: 2 },
        { type: 'DISCOVERY', count: 1 },
      ]);
    });
  });

  describe('getCalendarEvents', () => {
    it('should return deadlines formatted as calendar events', async () => {
      const mockDeadlines = [
        {
          id: 'dl1',
          title: 'Court filing',
          date: new Date('2024-04-01'),
          type: 'COURT_FILING',
          priority: 'HIGH',
          matter: { title: 'Smith v. Jones' },
        },
      ];

      (prisma.deadline.findMany as jest.Mock).mockResolvedValue(mockDeadlines);

      const result = await tracker.getCalendarEvents(
        'org-1',
        new Date('2024-03-01'),
        new Date('2024-04-30')
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'dl1',
          title: 'Court filing',
          start: expect.any(Date),
          color: expect.any(String),
        })
      );
    });
  });
});
