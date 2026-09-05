import { InvoiceService } from '@/lib/services/invoice-service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    invoiceLineItem: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    timeEntry: {
      updateMany: jest.fn(),
    },
  },
}));

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    service = new InvoiceService();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all invoices for an organization', async () => {
      const mockInvoices = [
        {
          id: 'inv1',
          invoiceNumber: 'INV-2024-001',
          status: 'SENT',
          totalAmount: 5250,
          taxAmount: 525,
          discountAmount: 0,
          dueDate: new Date('2024-04-15'),
          issuedAt: new Date('2024-03-15'),
          paidAt: null,
          clientId: 'c1',
          matterId: 'm1',
          client: { id: 'c1', name: 'Acme Corp' },
          matter: { id: 'm1', title: 'Contract Review' },
          lineItems: [
            { id: 'li1', description: 'Contract review', amount: 4200 },
            { id: 'li2', description: 'Legal research', amount: 1050 },
          ],
        },
        {
          id: 'inv2',
          invoiceNumber: 'INV-2024-002',
          status: 'PAID',
          totalAmount: 3500,
          taxAmount: 350,
          discountAmount: 175,
          dueDate: new Date('2024-03-01'),
          issuedAt: new Date('2024-02-01'),
          paidAt: new Date('2024-02-28'),
          clientId: 'c2',
          matterId: 'm2',
          client: { id: 'c2', name: 'John Smith' },
          matter: { id: 'm2', title: 'Litigation' },
          lineItems: [],
        },
      ];

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

      const result = await service.getAll('org-1');

      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: {
          client: { select: { id: true, name: true } },
          matter: { select: { id: true, title: true } },
          lineItems: true,
          payments: { select: { id: true, amount: true, paidAt: true } },
        },
        orderBy: { issuedAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('org-1', { status: 'SENT' });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SENT' }),
        })
      );
    });

    it('should filter by client', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('org-1', { clientId: 'c1' });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ clientId: 'c1' }),
        })
      );
    });

    it('should filter by date range', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('org-1', {
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            issuedAt: expect.objectContaining({
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            }),
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return an invoice with all details', async () => {
      const mockInvoice = {
        id: 'inv1',
        invoiceNumber: 'INV-2024-001',
        status: 'SENT',
        totalAmount: 5250,
        taxAmount: 525,
        discountAmount: 0,
        notes: 'Payment due within 30 days',
        terms: 'Late payments subject to 1.5% monthly interest',
        dueDate: new Date('2024-04-15'),
        issuedAt: new Date('2024-03-15'),
        clientId: 'c1',
        matterId: 'm1',
        organizationId: 'org-1',
        client: {
          id: 'c1',
          name: 'Acme Corp',
          email: 'billing@acme.com',
          address: { street: '123 Main St', city: 'NYC', state: 'NY', zip: '10001' },
        },
        matter: { id: 'm1', title: 'Contract Review', type: 'TRANSACTIONAL' },
        lineItems: [
          {
            id: 'li1',
            description: 'Contract review - 12 hours @ $350/hr',
            hours: 12,
            rate: 350,
            amount: 4200,
            type: 'TIME',
            date: new Date('2024-03-10'),
          },
          {
            id: 'li2',
            description: 'Legal research - 3 hours @ $350/hr',
            hours: 3,
            rate: 350,
            amount: 1050,
            type: 'TIME',
            date: new Date('2024-03-12'),
          },
        ],
        payments: [],
        timeEntries: [],
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await service.getById('inv1');

      expect(result.lineItems).toHaveLength(2);
      expect(result.totalAmount).toBe(5250);
    });

    it('should throw error when invoice not found', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(
        'Invoice not found'
      );
    });
  });

  describe('create', () => {
    it('should create an invoice from unbilled time entries', async () => {
      const invoiceData = {
        clientId: 'c1',
        matterId: 'm1',
        organizationId: 'org-1',
        dueDate: new Date('2024-04-15'),
        taxRate: 0.1,
        notes: 'Thank you for your business',
        lineItemIds: ['te1', 'te2', 'te3'],
      };

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([
        { id: 'te1', hours: 10, rate: 350, description: 'Contract review' },
        { id: 'te2', hours: 5, rate: 350, description: 'Legal research' },
        { id: 'te3', hours: 3, rate: 350, description: 'Client meeting' },
      ]);

      const createdInvoice = {
        id: 'new-inv1',
        invoiceNumber: 'INV-2024-003',
        status: 'DRAFT',
        totalAmount: 6615,
        taxAmount: 630,
        ...invoiceData,
      };

      (prisma.invoice.create as jest.Mock).mockResolvedValue(createdInvoice);
      (prisma.invoiceLineItem.createMany as jest.Mock).mockResolvedValue({
        count: 3,
      });
      (prisma.timeEntry.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.create(invoiceData);

      expect(prisma.invoice.create).toHaveBeenCalled();
      expect(result.invoiceNumber).toMatch(/^INV-\d{4}-\d{3}$/);
    });

    it('should calculate totals correctly', async () => {
      const invoiceData = {
        clientId: 'c1',
        matterId: 'm1',
        organizationId: 'org-1',
        dueDate: new Date('2024-04-15'),
        taxRate: 0.1,
        discountPercent: 5,
        lineItemIds: ['te1'],
      };

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([
        { id: 'te1', hours: 10, rate: 350, description: 'Work' },
      ]);

      (prisma.invoice.create as jest.Mock).mockResolvedValue({
        id: 'inv1',
        totalAmount: 3325,
        taxAmount: 332.5,
        discountAmount: 175,
      });
      (prisma.invoiceLineItem.createMany as jest.Mock).mockResolvedValue({
        count: 1,
      });
      (prisma.timeEntry.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.create(invoiceData);

      expect(result.totalAmount).toBe(3325);
    });

    it('should throw error with no line items', async () => {
      const invoiceData = {
        clientId: 'c1',
        matterId: 'm1',
        organizationId: 'org-1',
        dueDate: new Date('2024-04-15'),
        lineItemIds: [],
      };

      await expect(service.create(invoiceData)).rejects.toThrow(
        'Invoice must have at least one line item'
      );
    });

    it('should generate sequential invoice numbers', async () => {
      const invoiceData = {
        clientId: 'c1',
        matterId: 'm1',
        organizationId: 'org-1',
        dueDate: new Date('2024-04-15'),
        lineItemIds: ['te1'],
      };

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([
        { id: 'te1', hours: 2, rate: 350, description: 'Work' },
      ]);
      (prisma.invoice.count as jest.Mock).mockResolvedValue(5);
      (prisma.invoice.create as jest.Mock).mockResolvedValue({
        id: 'inv1',
        invoiceNumber: 'INV-2024-006',
      });
      (prisma.invoiceLineItem.createMany as jest.Mock).mockResolvedValue({
        count: 1,
      });
      (prisma.timeEntry.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.create(invoiceData);

      expect(result.invoiceNumber).toBe('INV-2024-006');
    });
  });

  describe('updateStatus', () => {
    it('should update invoice status from draft to sent', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'DRAFT',
      });
      (prisma.invoice.update as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'SENT',
        sentAt: new Date(),
      });

      const result = await service.updateStatus('inv1', 'SENT');

      expect(result.status).toBe('SENT');
    });

    it('should not allow sending an already sent invoice', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'SENT',
      });

      await expect(
        service.updateStatus('inv1', 'SENT')
      ).rejects.toThrow('Invoice already sent');
    });

    it('should not allow reverting a paid invoice', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'PAID',
      });

      await expect(
        service.updateStatus('inv1', 'DRAFT')
      ).rejects.toThrow('Cannot revert a paid invoice');
    });
  });

  describe('markAsPaid', () => {
    it('should mark invoice as paid', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'SENT',
        totalAmount: 5250,
      });
      (prisma.invoice.update as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'PAID',
        paidAt: new Date(),
      });

      const result = await service.markAsPaid('inv1', new Date('2024-04-01'));

      expect(result.status).toBe('PAID');
      expect(result.paidAt).toBeDefined();
    });

    it('should throw error when marking unpaid invoice as paid', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'DRAFT',
      });

      await expect(
        service.markAsPaid('inv1', new Date())
      ).rejects.toThrow('Invoice must be sent before marking as paid');
    });
  });

  describe('getInvoiceStats', () => {
    it('should return invoice statistics', async () => {
      (prisma.invoice.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { totalAmount: 50000 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 35000 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 10000 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 5000 } });
      (prisma.invoice.count as jest.Mock)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3);

      const stats = await service.getInvoiceStats('org-1');

      expect(stats).toEqual({
        totalInvoiced: 50000,
        totalPaid: 35000,
        totalPending: 10000,
        totalOverdue: 5000,
        invoiceCount: 20,
        paidCount: 12,
        pendingCount: 5,
        overdueCount: 3,
      });
    });
  });

  describe('getOverdueInvoices', () => {
    it('should return overdue invoices', async () => {
      const overdue = [
        {
          id: 'inv1',
          invoiceNumber: 'INV-2024-001',
          totalAmount: 5250,
          dueDate: new Date('2024-03-01'),
          client: { name: 'Acme Corp' },
        },
      ];

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(overdue);

      const result = await service.getOverdueInvoices('org-1');

      expect(result).toHaveLength(1);
    });
  });
});
