import { ClientService } from '@/lib/services/client-service';
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

describe('ClientService', () => {
  let service: ClientService;

  beforeEach(() => {
    service = new ClientService();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all clients for an organization', async () => {
      const mockClients = [
        {
          id: 'c1',
          name: 'Acme Corporation',
          email: 'legal@acme.com',
          phone: '+1-555-0100',
          type: 'CORPORATION',
          organizationId: 'org-1',
          createdAt: new Date('2024-01-01'),
          matters: [{ id: 'm1', title: 'Contract Review' }],
          _count: { matters: 1, invoices: 2 },
        },
        {
          id: 'c2',
          name: 'John Smith',
          email: 'john@smith.com',
          phone: '+1-555-0200',
          type: 'INDIVIDUAL',
          organizationId: 'org-1',
          createdAt: new Date('2024-02-01'),
          matters: [],
          _count: { matters: 0, invoices: 0 },
        },
      ];

      (prisma.client.findMany as jest.Mock).mockResolvedValue(mockClients);

      const result = await service.getAll('org-1');

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: {
          matters: { select: { id: true, title: true, status: true } },
          _count: { select: { matters: true, invoices: true } },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter clients by type', async () => {
      (prisma.client.findMany as jest.Mock).mockResolvedValue([
        { id: 'c1', name: 'Acme Corp', type: 'CORPORATION' },
      ]);

      await service.getAll('org-1', { type: 'CORPORATION' });

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'CORPORATION' }),
        })
      );
    });

    it('should search clients by name or email', async () => {
      (prisma.client.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('org-1', { search: 'Acme' });

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
              expect.objectContaining({ email: expect.any(Object) }),
            ]),
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return a client by id with all relations', async () => {
      const mockClient = {
        id: 'c1',
        name: 'Acme Corporation',
        email: 'legal@acme.com',
        phone: '+1-555-0100',
        type: 'CORPORATION',
        taxId: '12-3456789',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'US',
        },
        contacts: [
          { id: 'ct1', name: 'Jane Doe', email: 'jane@acme.com', role: 'CEO' },
        ],
        matters: [],
        invoices: [],
      };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(mockClient);

      const result = await service.getById('c1');

      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: 'c1' },
        include: {
          contacts: true,
          matters: {
            include: { assignedTo: true },
            orderBy: { updatedAt: 'desc' },
          },
          invoices: {
            orderBy: { issuedAt: 'desc' },
            take: 10,
          },
        },
      });
      expect(result).toEqual(mockClient);
    });

    it('should throw error when client not found', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(
        'Client not found'
      );
    });
  });

  describe('create', () => {
    it('should create a new individual client', async () => {
      const clientData = {
        name: 'John Smith',
        email: 'john@smith.com',
        phone: '+1-555-0200',
        type: 'INDIVIDUAL',
        organizationId: 'org-1',
        address: {
          street: '456 Oak Ave',
          city: 'Boston',
          state: 'MA',
          zip: '02101',
          country: 'US',
        },
      };

      const createdClient = {
        id: 'new-c1',
        ...clientData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.client.create as jest.Mock).mockResolvedValue(createdClient);

      const result = await service.create(clientData);

      expect(prisma.client.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'John Smith',
          type: 'INDIVIDUAL',
          organizationId: 'org-1',
        }),
      });
      expect(result.id).toBe('new-c1');
    });

    it('should create a new corporate client with tax ID', async () => {
      const clientData = {
        name: 'Tech Startup Inc',
        email: 'legal@techstartup.com',
        type: 'CORPORATION',
        organizationId: 'org-1',
        taxId: '98-7654321',
        industry: 'Technology',
      };

      (prisma.client.create as jest.Mock).mockResolvedValue({
        id: 'new-c2',
        ...clientData,
      });

      const result = await service.create(clientData);

      expect(result.taxId).toBe('98-7654321');
      expect(result.industry).toBe('Technology');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        type: 'INDIVIDUAL',
        organizationId: 'org-1',
      };

      await expect(service.create(incompleteData as any)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        name: 'Test',
        email: 'not-an-email',
        type: 'INDIVIDUAL',
        organizationId: 'org-1',
      };

      await expect(service.create(invalidEmailData)).rejects.toThrow(
        'Invalid email'
      );
    });
  });

  describe('update', () => {
    it('should update client information', async () => {
      const updateData = {
        name: 'Acme Corporation Updated',
        email: 'newlegal@acme.com',
      };

      (prisma.client.update as jest.Mock).mockResolvedValue({
        id: 'c1',
        ...updateData,
      });

      const result = await service.update('c1', updateData);

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: updateData,
      });
      expect(result.name).toBe('Acme Corporation Updated');
    });

    it('should not allow changing organizationId', async () => {
      const updateData = {
        organizationId: 'different-org',
        name: 'Test',
      };

      await expect(service.update('c1', updateData)).rejects.toThrow(
        'Cannot change organization'
      );
    });
  });

  describe('delete', () => {
    it('should soft-delete a client with no active matters', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        matters: [],
      });
      (prisma.client.update as jest.Mock).mockResolvedValue({
        id: 'c1',
        deletedAt: new Date(),
      });

      await service.delete('c1');

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw error when client has active matters', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        matters: [{ id: 'm1', status: 'ACTIVE' }],
      });

      await expect(service.delete('c1')).rejects.toThrow(
        'Cannot delete client with active matters'
      );
    });
  });

  describe('getClientStats', () => {
    it('should return client statistics', async () => {
      (prisma.client.count as jest.Mock)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);

      const stats = await service.getClientStats('org-1');

      expect(stats).toEqual({
        total: 15,
        individuals: 8,
        corporations: 5,
        other: 2,
      });
    });
  });

  describe('getRecentClients', () => {
    it('should return recently added clients', async () => {
      const recentClients = [
        { id: 'c5', name: 'New Corp', createdAt: new Date('2024-03-01') },
        { id: 'c4', name: 'Recent LLC', createdAt: new Date('2024-02-15') },
      ];

      (prisma.client.findMany as jest.Mock).mockResolvedValue(recentClients);

      const result = await service.getRecentClients('org-1', 5);

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          orderBy: { createdAt: 'desc' },
        })
      );
      expect(result).toHaveLength(2);
    });
  });
});
