import { TaskService } from '@/lib/services/task-service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    taskDependency: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    service = new TaskService();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all tasks for a matter', async () => {
      const mockTasks = [
        {
          id: 't1',
          title: 'Review contract amendments',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          dueDate: new Date('2024-04-01'),
          matterId: 'm1',
          assigneeId: 'u1',
          assignee: { id: 'u1', name: 'Jane Doe' },
          createdAt: new Date('2024-03-01'),
          subtasks: [
            { id: 'st1', title: 'Section 3 review', completed: true },
            { id: 'st2', title: 'Section 5 review', completed: false },
          ],
        },
        {
          id: 't2',
          title: 'Draft discovery responses',
          status: 'TODO',
          priority: 'URGENT',
          dueDate: new Date('2024-03-15'),
          matterId: 'm1',
          assigneeId: 'u2',
          assignee: { id: 'u2', name: 'Bob Wilson' },
          createdAt: new Date('2024-03-05'),
          subtasks: [],
        },
      ];

      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const result = await service.getAll('m1');

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { matterId: 'm1' },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          subtasks: true,
          dependencies: { include: { dependsOn: true } },
          comments: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
        orderBy: [
          { priority: 'asc' },
          { dueDate: 'asc' },
        ],
      });
      expect(result).toHaveLength(2);
    });

    it('should filter tasks by status', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('m1', { status: 'IN_PROGRESS' });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );
    });

    it('should filter tasks by priority', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('m1', { priority: 'URGENT' });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: 'URGENT' }),
        })
      );
    });

    it('should filter tasks by assignee', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('m1', { assigneeId: 'u1' });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assigneeId: 'u1' }),
        })
      );
    });

    it('should filter overdue tasks', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('m1', { overdue: true });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: expect.objectContaining({ lt: expect.any(Date) }),
            status: expect.not.stringContaining('COMPLETED'),
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return a task with all relations', async () => {
      const mockTask = {
        id: 't1',
        title: 'Review contract amendments',
        description: 'Review all proposed amendments to the master agreement',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2024-04-01'),
        matterId: 'm1',
        assigneeId: 'u1',
        assignee: { id: 'u1', name: 'Jane Doe', email: 'jane@law.com' },
        matter: { id: 'm1', title: 'Smith v. Jones' },
        subtasks: [
          { id: 'st1', title: 'Section 3 review', completed: true },
          { id: 'st2', title: 'Section 5 review', completed: false },
        ],
        dependencies: [],
        comments: [
          { id: 'cm1', content: 'Started review', author: { name: 'Jane' } },
        ],
        attachments: [],
        timeEntries: [],
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-10'),
      };

      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);

      const result = await service.getById('t1');

      expect(result).toEqual(mockTask);
      expect(result.subtasks).toHaveLength(2);
    });

    it('should throw error when task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('create', () => {
    it('should create a new task with valid data', async () => {
      const taskData = {
        title: 'File motion for summary judgment',
        description: 'Prepare and file MSJ motion',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date('2024-05-01'),
        matterId: 'm1',
        assigneeId: 'u1',
        estimatedHours: 20,
        tags: ['motion', 'deadline'],
      };

      const createdTask = {
        id: 'new-t1',
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.task.create as jest.Mock).mockResolvedValue(createdTask);

      const result = await service.create(taskData);

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'File motion for summary judgment',
          status: 'TODO',
          priority: 'HIGH',
          matterId: 'm1',
          assigneeId: 'u1',
        }),
      });
      expect(result.id).toBe('new-t1');
    });

    it('should create task with dependencies', async () => {
      const taskData = {
        title: 'Follow-up task',
        matterId: 'm1',
        assigneeId: 'u1',
        dependencyIds: ['t-existing-1', 't-existing-2'],
      };

      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'new-t2',
        ...taskData,
      });
      (prisma.taskDependency.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      await service.create(taskData);

      expect(prisma.taskDependency.createMany).toHaveBeenCalledWith({
        data: [
          { taskId: 'new-t2', dependsOnId: 't-existing-1' },
          { taskId: 'new-t2', dependsOnId: 't-existing-2' },
        ],
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        matterId: 'm1',
        assigneeId: 'u1',
      };

      await expect(service.create(invalidData as any)).rejects.toThrow();
    });

    it('should validate due date is in the future for new tasks', async () => {
      const pastDate = new Date('2020-01-01');
      const taskData = {
        title: 'Task with past due date',
        dueDate: pastDate,
        matterId: 'm1',
        assigneeId: 'u1',
      };

      await expect(service.create(taskData)).rejects.toThrow(
        'Due date must be in the future'
      );
    });
  });

  describe('update', () => {
    it('should update task status', async () => {
      const updatedTask = {
        id: 't1',
        status: 'COMPLETED',
        completedAt: new Date(),
      };

      (prisma.task.update as jest.Mock).mockResolvedValue(updatedTask);

      const result = await service.update('t1', { status: 'COMPLETED' });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: expect.objectContaining({ status: 'COMPLETED' }),
      });
      expect(result.status).toBe('COMPLETED');
    });

    it('should mark all subtasks as completed when task is completed', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: 't1',
        subtasks: [
          { id: 'st1', completed: false },
          { id: 'st2', completed: false },
        ],
      });
      (prisma.task.update as jest.Mock).mockResolvedValue({ id: 't1' });

      await service.update('t1', { status: 'COMPLETED' });

      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtasks: expect.objectContaining({
              updateMany: expect.any(Object),
            }),
          }),
        })
      );
    });

    it('should not allow reopening a completed task', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: 't1',
        status: 'COMPLETED',
      });

      await expect(
        service.update('t1', { status: 'IN_PROGRESS' })
      ).rejects.toThrow('Cannot reopen a completed task');
    });

    it('should update task priority', async () => {
      (prisma.task.update as jest.Mock).mockResolvedValue({
        id: 't1',
        priority: 'CRITICAL',
      });

      const result = await service.update('t1', { priority: 'CRITICAL' });

      expect(result.priority).toBe('CRITICAL');
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      (prisma.task.delete as jest.Mock).mockResolvedValue({ id: 't1' });

      await service.delete('t1');

      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });

    it('should throw error when deleting non-existent task', async () => {
      (prisma.task.delete as jest.Mock).mockRejectedValue(
        new Error('Record to delete not found')
      );

      await expect(service.delete('nonexistent')).rejects.toThrow();
    });
  });

  describe('getOverdueTasks', () => {
    it('should return overdue tasks for an organization', async () => {
      const overdueTasks = [
        {
          id: 't1',
          title: 'Late filing',
          dueDate: new Date('2024-03-01'),
          status: 'IN_PROGRESS',
          matter: { title: 'Smith v. Jones' },
        },
      ];

      (prisma.task.findMany as jest.Mock).mockResolvedValue(overdueTasks);

      const result = await service.getOverdueTasks('org-1');

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: expect.objectContaining({ lt: expect.any(Date) }),
            status: { not: 'COMPLETED' },
          }),
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getTaskStats', () => {
    it('should return task statistics for a matter', async () => {
      (prisma.task.count as jest.Mock)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3);

      const stats = await service.getTaskStats('m1');

      expect(stats).toEqual({
        total: 30,
        todo: 10,
        inProgress: 8,
        completed: 7,
        overdue: 5,
        cancelled: 3,
      });
    });
  });
});
