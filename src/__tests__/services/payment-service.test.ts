import { PaymentService } from '@/lib/services/payment-service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    payment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    invoice: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(() => {
    service = new PaymentService();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all payments for an organization', async () => {
      const mockPayments = [
        {
          id: 'p1',
          amount: 5250,
          method: 'BANK_TRANSFER',
          status: 'COMPLETED',
          reference: 'TXN-2024-001',
          paidAt: new Date('2024-04-01'),
          invoiceId: 'inv1',
          clientId: 'c1',
          invoice: {
            id: 'inv1',
            invoiceNumber: 'INV-2024-001',
            totalAmount: 5250,
          },
          client: { id: 'c1', name: 'Acme Corp' },
          createdAt: new Date('2024-04-01'),
        },
        {
          id: 'p2',
          amount: 3500,
          method: 'CREDIT_CARD',
          status: 'COMPLETED',
          reference: 'CC-2024-002',
          paidAt: new Date('2024-03-15'),
          invoiceId: 'inv2',
          clientId: 'c2',
          invoice: {
            id: 'inv2',
            invoiceNumber: 'INV-2024-002',
            totalAmount: 3500,
          },
          client: { id: 'c2', name: 'John Smith' },
          createdAt: new Date('2024-03-15'),
        },
      ];

      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);

      const result = await service.getAll('org-1');

      expect(prisma.payment.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              status: true,
            },
          },
          client: { select: { id: true, name: true } },
          recordedByUser: { select: { id: true, name: true } },
        },
        orderBy: { paidAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by payment method', async () => {
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('org-1', { method: 'BANK_TRANSFER' });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ method: 'BANK_TRANSFER' }),
        })
      );
    });

    it('should filter by status', async () => {
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('org-1', { status: 'COMPLETED' });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'COMPLETED' }),
        })
      );
    });

    it('should filter by date range', async () => {
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAll('org-1', {
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paidAt: expect.objectContaining({
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            }),
          }),
        })
      );
    });
  });

  describe('create', () => {
    it('should record a payment against an invoice', async () => {
      const paymentData = {
        invoiceId: 'inv1',
        clientId: 'c1',
        organizationId: 'org-1',
        amount: 5250,
        method: 'BANK_TRANSFER',
        reference: 'Wire transfer ref-123',
        paidAt: new Date('2024-04-01'),
        notes: 'Full payment received',
        recordedBy: 'u1',
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'SENT',
        totalAmount: 5250,
        paidAmount: 0,
      });

      const createdPayment = {
        id: 'new-p1',
        ...paymentData,
        status: 'COMPLETED',
        createdAt: new Date(),
      };

      (prisma.payment.create as jest.Mock).mockResolvedValue(createdPayment);
      (prisma.invoice.update as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'PAID',
        paidAt: new Date(),
      });

      const result = await service.create(paymentData);

      expect(prisma.payment.create).toHaveBeenCalled();
      expect(result.id).toBe('new-p1');
    });

    it('should handle partial payments', async () => {
      const paymentData = {
        invoiceId: 'inv1',
        clientId: 'c1',
        organizationId: 'org-1',
        amount: 2000,
        method: 'CHECK',
        reference: 'CHK-1234',
        paidAt: new Date('2024-04-01'),
        recordedBy: 'u1',
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'SENT',
        totalAmount: 5250,
        paidAmount: 0,
      });

      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'p1',
        ...paymentData,
        status: 'COMPLETED',
      });
      (prisma.invoice.update as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'PARTIALLY_PAID',
        paidAmount: 2000,
      });

      const result = await service.create(paymentData);

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: expect.objectContaining({
          status: 'PARTIALLY_PAID',
        }),
      });
    });

    it('should validate payment amount does not exceed invoice total', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv1',
        totalAmount: 5000,
        paidAmount: 4000,
      });

      const paymentData = {
        invoiceId: 'inv1',
        clientId: 'c1',
        organizationId: 'org-1',
        amount: 2000,
        method: 'BANK_TRANSFER',
        paidAt: new Date(),
        recordedBy: 'u1',
      };

      await expect(service.create(paymentData)).rejects.toThrow(
        'Payment amount exceeds remaining balance'
      );
    });

    it('should validate payment amount is positive', async () => {
      const paymentData = {
        invoiceId: 'inv1',
        clientId: 'c1',
        organizationId: 'org-1',
        amount: -100,
        method: 'BANK_TRANSFER',
        paidAt: new Date(),
        recordedBy: 'u1',
      };

      await expect(service.create(paymentData)).rejects.toThrow(
        'Payment amount must be positive'
      );
    });

    it('should throw error when invoice not found', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

      const paymentData = {
        invoiceId: 'nonexistent',
        clientId: 'c1',
        organizationId: 'org-1',
        amount: 1000,
        method: 'BANK_TRANSFER',
        paidAt: new Date(),
        recordedBy: 'u1',
      };

      await expect(service.create(paymentData)).rejects.toThrow(
        'Invoice not found'
      );
    });
  });

  describe('refund', () => {
    it('should process a refund for a payment', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        amount: 5250,
        status: 'COMPLETED',
        invoiceId: 'inv1',
      });
      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'refund-p1',
        amount: -5250,
        method: 'REFUND',
        status: 'COMPLETED',
        reference: 'REFUND-p1',
      });
      (prisma.invoice.update as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'SENT',
        paidAmount: 0,
      });

      const result = await service.refund('p1', 'Customer request');

      expect(result.amount).toBe(-5250);
      expect(result.method).toBe('REFUND');
    });

    it('should not allow refunding a pending payment', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        amount: 1000,
        status: 'PENDING',
      });

      await expect(service.refund('p1', 'Reason')).rejects.toThrow(
        'Cannot refund a pending payment'
      );
    });

    it('should not allow refunding an already refunded payment', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        amount: -1000,
        status: 'REFUNDED',
      });

      await expect(service.refund('p1', 'Reason')).rejects.toThrow(
        'Payment already refunded'
      );
    });
  });

  describe('getPaymentStats', () => {
    it('should return payment statistics', async () => {
      (prisma.payment.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { amount: 75000 } })
        .mockResolvedValueOnce({ _sum: { amount: 60000 } })
        .mockResolvedValueOnce({ _sum: { amount: 5000 } })
        .mockResolvedValueOnce({ _sum: { amount: 10000 } });
      (prisma.payment.count as jest.Mock)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);

      const stats = await service.getPaymentStats('org-1');

      expect(stats).toEqual({
        totalReceived: 75000,
        thisMonth: 60000,
        refunds: 5000,
        pending: 10000,
        paymentCount: 30,
        completedCount: 25,
        refundedCount: 3,
        pendingCount: 2,
      });
    });
  });

  describe('getPaymentsByMethod', () => {
    it('should return payments grouped by method', async () => {
      const mockPayments = [
        { id: 'p1', method: 'BANK_TRANSFER', amount: 5000 },
        { id: 'p2', method: 'BANK_TRANSFER', amount: 3000 },
        { id: 'p3', method: 'CREDIT_CARD', amount: 2000 },
      ];

      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);

      const result = await service.getPaymentsByMethod('org-1');

      expect(result).toEqual([
        { method: 'BANK_TRANSFER', total: 8000, count: 2 },
        { method: 'CREDIT_CARD', total: 2000, count: 1 },
      ]);
    });
  });
});
