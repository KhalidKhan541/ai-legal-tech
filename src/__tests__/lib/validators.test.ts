import { z } from 'zod';
import {
  matterSchema,
  clientSchema,
  documentSchema,
  timeEntrySchema,
  invoiceSchema,
  paymentSchema,
  taskSchema,
  userSchema,
  contactSchema,
  addressSchema,
  validateDateRange,
  validateFileSize,
  validateFileType,
  sanitizeHtml,
  validatePhoneNumber,
  validateTaxId,
  validateCreditCard,
} from '@/lib/validators';

describe('Validators', () => {
  describe('matterSchema', () => {
    it('should accept valid matter data', () => {
      const validMatter = {
        title: 'Smith v. Jones',
        description: 'Contract dispute',
        status: 'ACTIVE',
        type: 'LITIGATION',
        clientId: 'c1',
        organizationId: 'org-1',
        practiceArea: 'Commercial Litigation',
        jurisdiction: 'New York',
        billingType: 'HOURLY',
        hourlyRate: 350,
        estimatedHours: 100,
      };

      const result = matterSchema.safeParse(validMatter);

      expect(result.success).toBe(true);
    });

    it('should reject matter without title', () => {
      const invalidMatter = {
        status: 'ACTIVE',
        type: 'LITIGATION',
        clientId: 'c1',
        organizationId: 'org-1',
      };

      const result = matterSchema.safeParse(invalidMatter);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('should reject matter with invalid status', () => {
      const invalidMatter = {
        title: 'Test',
        status: 'INVALID_STATUS',
        type: 'LITIGATION',
        clientId: 'c1',
        organizationId: 'org-1',
      };

      const result = matterSchema.safeParse(invalidMatter);

      expect(result.success).toBe(false);
    });

    it('should reject matter with negative hourly rate', () => {
      const invalidMatter = {
        title: 'Test',
        status: 'ACTIVE',
        type: 'LITIGATION',
        clientId: 'c1',
        organizationId: 'org-1',
        billingType: 'HOURLY',
        hourlyRate: -100,
      };

      const result = matterSchema.safeParse(invalidMatter);

      expect(result.success).toBe(false);
    });

    it('should reject matter with title exceeding max length', () => {
      const invalidMatter = {
        title: 'A'.repeat(201),
        status: 'ACTIVE',
        type: 'LITIGATION',
        clientId: 'c1',
        organizationId: 'org-1',
      };

      const result = matterSchema.safeParse(invalidMatter);

      expect(result.success).toBe(false);
    });
  });

  describe('clientSchema', () => {
    it('should accept valid individual client', () => {
      const validClient = {
        name: 'John Smith',
        email: 'john@smith.com',
        phone: '+1-555-0100',
        type: 'INDIVIDUAL',
        organizationId: 'org-1',
      };

      const result = clientSchema.safeParse(validClient);

      expect(result.success).toBe(true);
    });

    it('should accept valid corporate client', () => {
      const validClient = {
        name: 'Acme Corporation',
        email: 'legal@acme.com',
        type: 'CORPORATION',
        organizationId: 'org-1',
        taxId: '12-3456789',
        industry: 'Technology',
      };

      const result = clientSchema.safeParse(validClient);

      expect(result.success).toBe(true);
    });

    it('should reject client with invalid email', () => {
      const invalidClient = {
        name: 'Test',
        email: 'not-an-email',
        type: 'INDIVIDUAL',
        organizationId: 'org-1',
      };

      const result = clientSchema.safeParse(invalidClient);

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailIssue = result.error.issues.find(
          (i) => i.path.includes('email')
        );
        expect(emailIssue).toBeDefined();
      }
    });

    it('should reject client without required fields', () => {
      const invalidClient = {
        email: 'test@test.com',
      };

      const result = clientSchema.safeParse(invalidClient);

      expect(result.success).toBe(false);
    });
  });

  describe('documentSchema', () => {
    it('should accept valid document data', () => {
      const validDoc = {
        name: 'Contract Draft.pdf',
        type: 'CONTRACT',
        matterId: 'm1',
        organizationId: 'org-1',
        uploadedBy: 'u1',
      };

      const result = documentSchema.safeParse(validDoc);

      expect(result.success).toBe(true);
    });

    it('should reject document with invalid type', () => {
      const invalidDoc = {
        name: 'Test',
        type: 'INVALID_TYPE',
        matterId: 'm1',
        organizationId: 'org-1',
        uploadedBy: 'u1',
      };

      const result = documentSchema.safeParse(invalidDoc);

      expect(result.success).toBe(false);
    });

    it('should reject document with empty name', () => {
      const invalidDoc = {
        name: '',
        type: 'CONTRACT',
        matterId: 'm1',
        organizationId: 'org-1',
        uploadedBy: 'u1',
      };

      const result = documentSchema.safeParse(invalidDoc);

      expect(result.success).toBe(false);
    });
  });

  describe('timeEntrySchema', () => {
    it('should accept valid time entry', () => {
      const validEntry = {
        description: 'Contract review and analysis',
        hours: 3.5,
        rate: 350,
        date: '2024-03-15',
        matterId: 'm1',
        userId: 'u1',
        billable: true,
        category: 'LEGAL_RESEARCH',
      };

      const result = timeEntrySchema.safeParse(validEntry);

      expect(result.success).toBe(true);
    });

    it('should reject time entry with negative hours', () => {
      const invalidEntry = {
        description: 'Test',
        hours: -2,
        rate: 350,
        date: '2024-03-15',
        matterId: 'm1',
        userId: 'u1',
        billable: true,
      };

      const result = timeEntrySchema.safeParse(invalidEntry);

      expect(result.success).toBe(false);
    });

    it('should reject time entry with hours exceeding 24', () => {
      const invalidEntry = {
        description: 'Test',
        hours: 25,
        rate: 350,
        date: '2024-03-15',
        matterId: 'm1',
        userId: 'u1',
        billable: true,
      };

      const result = timeEntrySchema.safeParse(invalidEntry);

      expect(result.success).toBe(false);
    });

    it('should reject time entry with missing description', () => {
      const invalidEntry = {
        hours: 2,
        rate: 350,
        date: '2024-03-15',
        matterId: 'm1',
        userId: 'u1',
        billable: true,
      };

      const result = timeEntrySchema.safeParse(invalidEntry);

      expect(result.success).toBe(false);
    });

    it('should accept entry with decimal hours', () => {
      const validEntry = {
        description: 'Quick review',
        hours: 0.25,
        rate: 350,
        date: '2024-03-15',
        matterId: 'm1',
        userId: 'u1',
        billable: true,
      };

      const result = timeEntrySchema.safeParse(validEntry);

      expect(result.success).toBe(true);
    });
  });

  describe('invoiceSchema', () => {
    it('should accept valid invoice data', () => {
      const validInvoice = {
        clientId: 'c1',
        matterId: 'm1',
        organizationId: 'org-1',
        dueDate: '2024-04-15',
        taxRate: 0.1,
        lineItemIds: ['te1', 'te2'],
      };

      const result = invoiceSchema.safeParse(validInvoice);

      expect(result.success).toBe(true);
    });

    it('should reject invoice with empty line items', () => {
      const invalidInvoice = {
        clientId: 'c1',
        matterId: 'm1',
        organizationId: 'org-1',
        dueDate: '2024-04-15',
        lineItemIds: [],
      };

      const result = invoiceSchema.safeParse(invalidInvoice);

      expect(result.success).toBe(false);
    });

    it('should reject invoice with negative tax rate', () => {
      const invalidInvoice = {
        clientId: 'c1',
        matterId: 'm1',
        organizationId: 'org-1',
        dueDate: '2024-04-15',
        taxRate: -0.1,
        lineItemIds: ['te1'],
      };

      const result = invoiceSchema.safeParse(invalidInvoice);

      expect(result.success).toBe(false);
    });

    it('should reject invoice with tax rate exceeding 100%', () => {
      const invalidInvoice = {
        clientId: 'c1',
        matterId: 'm1',
        organizationId: 'org-1',
        dueDate: '2024-04-15',
        taxRate: 1.5,
        lineItemIds: ['te1'],
      };

      const result = invoiceSchema.safeParse(invalidInvoice);

      expect(result.success).toBe(false);
    });
  });

  describe('taskSchema', () => {
    it('should accept valid task data', () => {
      const validTask = {
        title: 'Review contract amendments',
        description: 'Review all proposed amendments',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: '2024-04-01',
        matterId: 'm1',
        assigneeId: 'u1',
        estimatedHours: 10,
      };

      const result = taskSchema.safeParse(validTask);

      expect(result.success).toBe(true);
    });

    it('should reject task without title', () => {
      const invalidTask = {
        status: 'TODO',
        priority: 'HIGH',
        matterId: 'm1',
        assigneeId: 'u1',
      };

      const result = taskSchema.safeParse(invalidTask);

      expect(result.success).toBe(false);
    });

    it('should reject task with invalid priority', () => {
      const invalidTask = {
        title: 'Test',
        status: 'TODO',
        priority: 'INVALID',
        matterId: 'm1',
        assigneeId: 'u1',
      };

      const result = taskSchema.safeParse(invalidTask);

      expect(result.success).toBe(false);
    });
  });

  describe('addressSchema', () => {
    it('should accept valid address', () => {
      const validAddress = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      };

      const result = addressSchema.safeParse(validAddress);

      expect(result.success).toBe(true);
    });

    it('should accept address with optional fields', () => {
      const validAddress = {
        street: '456 Oak Ave',
        street2: 'Suite 200',
        city: 'Boston',
        state: 'MA',
        zip: '02101',
        country: 'US',
      };

      const result = addressSchema.safeParse(validAddress);

      expect(result.success).toBe(true);
    });

    it('should reject address without required fields', () => {
      const invalidAddress = {
        street: '123 Main St',
      };

      const result = addressSchema.safeParse(invalidAddress);

      expect(result.success).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    it('should validate a valid date range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');

      const result = validateDateRange(start, end);

      expect(result.valid).toBe(true);
    });

    it('should reject when end date is before start date', () => {
      const start = new Date('2024-12-31');
      const end = new Date('2024-01-01');

      const result = validateDateRange(start, end);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('End date must be after start date');
    });

    it('should reject when date range exceeds one year', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2025-06-01');

      const result = validateDateRange(start, end);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Date range cannot exceed');
    });
  });

  describe('validateFileSize', () => {
    it('should accept file within size limit', () => {
      const result = validateFileSize(1024 * 1024, 10 * 1024 * 1024);

      expect(result.valid).toBe(true);
    });

    it('should reject file exceeding size limit', () => {
      const result = validateFileSize(20 * 1024 * 1024, 10 * 1024 * 1024);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });
  });

  describe('validateFileType', () => {
    it('should accept allowed file types', () => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

      const result = validateFileType('application/pdf', allowedTypes);

      expect(result.valid).toBe(true);
    });

    it('should reject disallowed file types', () => {
      const allowedTypes = ['application/pdf'];

      const result = validateFileType('application/x-executable', allowedTypes);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>';

      const result = sanitizeHtml(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
    });

    it('should remove event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';

      const result = sanitizeHtml(input);

      expect(result).not.toContain('onerror');
    });

    it('should preserve safe HTML tags', () => {
      const input = '<p><strong>Bold</strong> text</p>';

      const result = sanitizeHtml(input);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate US phone numbers', () => {
      expect(validatePhoneNumber('+1-555-0100')).toBe(true);
      expect(validatePhoneNumber('(555) 010-0100')).toBe(true);
      expect(validatePhoneNumber('5550100100')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('abc')).toBe(false);
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
    });
  });

  describe('validateTaxId', () => {
    it('should validate EIN format', () => {
      expect(validateTaxId('12-3456789')).toBe(true);
      expect(validateTaxId('98-7654321')).toBe(true);
    });

    it('should reject invalid EIN format', () => {
      expect(validateTaxId('123456789')).toBe(false);
      expect(validateTaxId('12-34567')).toBe(false);
      expect(validateTaxId('AB-3456789')).toBe(false);
    });
  });
});
