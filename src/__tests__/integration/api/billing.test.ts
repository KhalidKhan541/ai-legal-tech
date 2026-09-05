import { createMocks } from 'node-mocks-http';
import { GET as GET_INVOICES, POST as POST_INVOICE } from '@/app/api/billing/invoices/route';
import { GET as GET_TIME_ENTRIES, POST as POST_TIME_ENTRY } from '@/app/api/billing/time-entries/route';
import { GET as GET_PAYMENTS, POST as POST_PAYMENT } from '@/app/api/billing/payments/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    timeEntry: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    },
    invoiceLineItem: {
      createMany: jest.fn(),
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

describe('Billing API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/billing/invoices', () => {
    it('should return all invoices', async () => {
      const mockInvoices = [
        {
          id: 'inv1',
          invoiceNumber: 'INV-2024-001',
          status: 'SENT',
          totalAmount: 5250,
          clientId: 'c1',
          matterId: 'm1',
          client: { name: 'Acme Corp' },
          matter: { title: 'Contract Review' },
          lineItems: [],
          payments: [],
        },
      ];

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/billing/invoices',
      });

      const response = await GET_INVOICES(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
    });

    it('should filter invoices by status', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/billing/invoices?status=SENT',
      });

      const response = await GET_INVOICES(req as any);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/billing/invoices', () => {
    it('should create an invoice', async () => {
      const invoiceData = {
        clientId: 'c1',
        matterId: 'm1',
        dueDate: '2024-04-15',
        taxRate: 0.1,
        lineItemIds: ['te1', 'te2'],
      };

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([
        { id: 'te1', hours: 10, rate: 350, description: 'Contract review' },
        { id: 'te2', hours: 5, rate: 350, description: 'Research' },
      ]);
      (prisma.invoice.count as jest.Mock).mockResolvedValue(0);
      (prisma.invoice.create as jest.Mock).mockResolvedValue({
        id: 'new-inv1',
        invoiceNumber: 'INV-2024-001',
        status: 'DRAFT',
        totalAmount: 5775,
      });
      (prisma.invoiceLineItem.createMany as jest.Mock).mockResolvedValue({
        count: 2,
      });
      (prisma.timeEntry.update as jest.Mock).mockResolvedValue({});

      const { req } = createMocks({
        method: 'POST',
        url: '/api/billing/invoices',
        body: invoiceData,
      });

      const response = await POST_INVOICE(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.invoiceNumber).toBe('INV-2024-001');
    });

    it('should return 400 for invalid invoice data', async () => {
      const invalidData = {
        clientId: 'c1',
      };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/billing/invoices',
        body: invalidData,
      });

      const response = await POST_INVOICE(req as any);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/billing/time-entries', () => {
    it('should return time entries for a matter', async () => {
      const mockEntries = [
        {
          id: 'te1',
          description: 'Contract review',
          hours: 3.5,
          rate: 350,
          amount: 1225,
          status: 'APPROVED',
          user: { id: 'u1', name: 'Jane Doe' },
          matter: { id: 'm1', title: 'Smith v. Jones' },
        },
      ];

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/billing/time-entries?matterId=m1',
      });

      const response = await GET_TIME_ENTRIES(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
    });

    it('should filter by user', async () => {
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/billing/time-entries?matterId=m1&userId=u1',
      });

      const response = await GET_TIME_ENTRIES(req as any);

      expect(response.status).toBe(200);
    });

    it('should filter by status', async () => {
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/billing/time-entries?matterId=m1&status=PENDING',
      });

      const response = await GET_TIME_ENTRIES(req as any);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/billing/time-entries', () => {
    it('should create a time entry', async () => {
      const entryData = {
        description: 'Drafted motion for summary judgment',
        hours: 4.5,
        rate: 350,
        date: '2024-03-20',
        matterId: 'm1',
        billable: true,
        category: 'DRAFTING',
      };

      const createdEntry = {
        id: 'new-te1',
        ...entryData,
        amount: 1575,
        status: 'PENDING',
        userId: 'u1',
      };

      (prisma.timeEntry.create as jest.Mock).mockResolvedValue(createdEntry);

      const { req } = createMocks({
        method: 'POST',
        url: '/api/billing/time-entries',
        body: entryData,
      });

      const response = await POST_TIME_ENTRY(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.amount).toBe(1575);
    });

    it('should return 400 for invalid time entry data', async () => {
      const invalidData = {
        hours: -2,
        rate: 350,
        matterId: 'm1',
      };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/billing/time-entries',
        body: invalidData,
      });

      const response = await POST_TIME_ENTRY(req as any);

      expect(response.status).toBe(400);
    });

    it('should return 400 when hours exceed 24', async () => {
      const invalidData = {
        description: 'Too many hours',
        hours: 25,
        rate: 350,
        date: '2024-03-20',
        matterId: 'm1',
        billable: true,
      };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/billing/time-entries',
        body: invalidData,
      });

      const response = await POST_TIME_ENTRY(req as any);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/billing/payments', () => {
    it('should return payments', async () => {
      const mockPayments = [
        {
          id: 'p1',
          amount: 5250,
          method: 'BANK_TRANSFER',
          status: 'COMPLETED',
          paidAt: new Date('2024-04-01'),
          invoice: { invoiceNumber: 'INV-2024-001' },
          client: { name: 'Acme Corp' },
        },
      ];

      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/billing/payments',
      });

      const response = await GET_PAYMENTS(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
    });
  });

  describe('POST /api/billing/payments', () => {
    it('should record a payment', async () => {
      const paymentData = {
        invoiceId: 'inv1',
        amount: 5250,
        method: 'BANK_TRANSFER',
        reference: 'Wire transfer ref-123',
        paidAt: '2024-04-01',
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'SENT',
        totalAmount: 5250,
        paidAmount: 0,
      });
      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'new-p1',
        ...paymentData,
        status: 'COMPLETED',
        clientId: 'c1',
        organizationId: 'org-1',
        recordedBy: 'u1',
      });
      (prisma.invoice.update as jest.Mock).mockResolvedValue({
        id: 'inv1',
        status: 'PAID',
        paidAt: new Date(),
      });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/billing/payments',
        body: paymentData,
      });

      const response = await POST_PAYMENT(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('COMPLETED');
    });

    it('should return 400 for invalid payment data', async () => {
      const invalidData = {
        amount: -100,
        method: 'BANK_TRANSFER',
      };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/billing/payments',
        body: invalidData,
      });

      const response = await POST_PAYMENT(req as any);

      expect(response.status).toBe(400);
    });

    it('should return 400 when payment exceeds invoice balance', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv1',
        totalAmount: 5000,
        paidAmount: 4000,
      });

      const paymentData = {
        invoiceId: 'inv1',
        amount: 2000,
        method: 'BANK_TRANSFER',
        paidAt: '2024-04-01',
      };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/billing/payments',
        body: paymentData,
      });

      const response = await POST_PAYMENT(req as any);

      expect(response.status).toBe(400);
    });
  });
});
