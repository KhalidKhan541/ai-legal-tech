import {
  checkPermission,
  checkRole,
  canAccessMatter,
  canEditDocument,
  canDeleteMatter,
  canApproveInvoice,
  canManageUsers,
  canViewBilling,
  canCreateTimeEntry,
  canEditTimeEntry,
  canApproveTimeEntry,
  canGenerateInvoice,
  canRecordPayment,
  canAccessAIFeatures,
  canManageOrganization,
  getRolePermissions,
  Permission,
  Role,
} from '@/lib/permissions';

describe('Permissions', () => {
  describe('checkPermission', () => {
    it('should grant permission when user has the required permission', () => {
      const user = {
        id: 'u1',
        role: 'PARTNER',
        permissions: ['MATTERS_VIEW', 'MATTERS_CREATE', 'BILLING_VIEW'],
      };

      const result = checkPermission(user, 'MATTERS_VIEW');

      expect(result.allowed).toBe(true);
    });

    it('should deny permission when user lacks the required permission', () => {
      const user = {
        id: 'u1',
        role: 'ASSOCIATE',
        permissions: ['MATTERS_VIEW'],
      };

      const result = checkPermission(user, 'BILLING_VIEW');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Missing permission');
    });

    it('should check role-based permissions', () => {
      const adminUser = {
        id: 'u1',
        role: 'ADMIN',
        permissions: [],
      };

      const result = checkPermission(adminUser, 'ORGANIZATION_MANAGE');

      expect(result.allowed).toBe(true);
    });
  });

  describe('checkRole', () => {
    it('should return true when user has the required role', () => {
      expect(checkRole('PARTNER', ['PARTNER', 'ADMIN'])).toBe(true);
    });

    it('should return false when user lacks the required role', () => {
      expect(checkRole('ASSOCIATE', ['PARTNER', 'ADMIN'])).toBe(false);
    });

    it('should check for exact role match', () => {
      expect(checkRole('PARTNER', ['PARTNER'])).toBe(true);
      expect(checkRole('SENIOR_ASSOCIATE', ['PARTNER'])).toBe(false);
    });
  });

  describe('canAccessMatter', () => {
    it('should allow partner to access any matter', () => {
      const user = {
        id: 'u1',
        role: 'PARTNER',
        organizationId: 'org-1',
      };

      const matter = {
        id: 'm1',
        organizationId: 'org-1',
        assignedTo: [],
      };

      const result = canAccessMatter(user, matter);

      expect(result.allowed).toBe(true);
    });

    it('should allow assigned associate to access matter', () => {
      const user = {
        id: 'u1',
        role: 'ASSOCIATE',
        organizationId: 'org-1',
      };

      const matter = {
        id: 'm1',
        organizationId: 'org-1',
        assignedTo: [{ id: 'u1' }],
      };

      const result = canAccessMatter(user, matter);

      expect(result.allowed).toBe(true);
    });

    it('should deny unassigned associate access to matter', () => {
      const user = {
        id: 'u1',
        role: 'ASSOCIATE',
        organizationId: 'org-1',
      };

      const matter = {
        id: 'm1',
        organizationId: 'org-1',
        assignedTo: [{ id: 'u2' }],
      };

      const result = canAccessMatter(user, matter);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not assigned');
    });

    it('should deny access to matter from different organization', () => {
      const user = {
        id: 'u1',
        role: 'PARTNER',
        organizationId: 'org-1',
      };

      const matter = {
        id: 'm1',
        organizationId: 'org-2',
        assignedTo: [],
      };

      const result = canAccessMatter(user, matter);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('different organization');
    });

    it('should allow paralegal to access assigned matters', () => {
      const user = {
        id: 'u1',
        role: 'PARALEGAL',
        organizationId: 'org-1',
      };

      const matter = {
        id: 'm1',
        organizationId: 'org-1',
        assignedTo: [{ id: 'u1' }],
      };

      const result = canAccessMatter(user, matter);

      expect(result.allowed).toBe(true);
    });
  });

  describe('canEditDocument', () => {
    it('should allow document owner to edit', () => {
      const user = { id: 'u1', role: 'ASSOCIATE' };
      const document = { id: 'd1', uploadedBy: 'u1', matterId: 'm1' };
      const matter = { id: 'm1', assignedTo: [{ id: 'u1' }] };

      const result = canEditDocument(user, document, matter);

      expect(result.allowed).toBe(true);
    });

    it('should allow partner to edit any document', () => {
      const user = { id: 'u1', role: 'PARTNER' };
      const document = { id: 'd1', uploadedBy: 'u2', matterId: 'm1' };
      const matter = { id: 'm1', assignedTo: [] };

      const result = canEditDocument(user, document, matter);

      expect(result.allowed).toBe(true);
    });

    it('should deny non-owner associate from editing', () => {
      const user = { id: 'u1', role: 'ASSOCIATE' };
      const document = { id: 'd1', uploadedBy: 'u2', matterId: 'm1' };
      const matter = { id: 'm1', assignedTo: [{ id: 'u1' }] };

      const result = canEditDocument(user, document, matter);

      expect(result.allowed).toBe(false);
    });
  });

  describe('canDeleteMatter', () => {
    it('should allow partner to delete matter', () => {
      const user = { id: 'u1', role: 'PARTNER', organizationId: 'org-1' };
      const matter = { id: 'm1', organizationId: 'org-1', status: 'CLOSED' };

      const result = canDeleteMatter(user, matter);

      expect(result.allowed).toBe(true);
    });

    it('should not allow deleting active matters', () => {
      const user = { id: 'u1', role: 'PARTNER', organizationId: 'org-1' };
      const matter = { id: 'm1', organizationId: 'org-1', status: 'ACTIVE' };

      const result = canDeleteMatter(user, matter);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('active');
    });

    it('should not allow non-partners to delete matters', () => {
      const user = { id: 'u1', role: 'ASSOCIATE', organizationId: 'org-1' };
      const matter = { id: 'm1', organizationId: 'org-1', status: 'CLOSED' };

      const result = canDeleteMatter(user, matter);

      expect(result.allowed).toBe(false);
    });
  });

  describe('canApproveInvoice', () => {
    it('should allow partner to approve invoice', () => {
      const user = { id: 'u1', role: 'PARTNER' };
      const invoice = { id: 'inv1', status: 'DRAFT', totalAmount: 5000 };

      const result = canApproveInvoice(user, invoice);

      expect(result.allowed).toBe(true);
    });

    it('should not allow approving non-draft invoices', () => {
      const user = { id: 'u1', role: 'PARTNER' };
      const invoice = { id: 'inv1', status: 'SENT', totalAmount: 5000 };

      const result = canApproveInvoice(user, invoice);

      expect(result.allowed).toBe(false);
    });

    it('should not allow associates to approve invoices', () => {
      const user = { id: 'u1', role: 'ASSOCIATE' };
      const invoice = { id: 'inv1', status: 'DRAFT', totalAmount: 5000 };

      const result = canApproveInvoice(user, invoice);

      expect(result.allowed).toBe(false);
    });
  });

  describe('canManageUsers', () => {
    it('should allow admin to manage users', () => {
      expect(canManageUsers('ADMIN')).toBe(true);
    });

    it('should allow partner to manage users', () => {
      expect(canManageUsers('PARTNER')).toBe(true);
    });

    it('should not allow associate to manage users', () => {
      expect(canManageUsers('ASSOCIATE')).toBe(false);
    });

    it('should not allow paralegal to manage users', () => {
      expect(canManageUsers('PARALEGAL')).toBe(false);
    });
  });

  describe('canViewBilling', () => {
    it('should allow partner to view billing', () => {
      expect(canViewBilling('PARTNER', 'org-1')).toBe(true);
    });

    it('should allow associate to view billing for assigned matters', () => {
      const result = canViewBilling('ASSOCIATE', 'org-1');
      expect(result).toBe(true);
    });

    it('should not allow paralegal to view billing', () => {
      expect(canViewBilling('PARALEGAL', 'org-1')).toBe(false);
    });
  });

  describe('canCreateTimeEntry', () => {
    it('should allow associate to create time entries', () => {
      expect(canCreateTimeEntry('ASSOCIATE')).toBe(true);
    });

    it('should allow partner to create time entries', () => {
      expect(canCreateTimeEntry('PARTNER')).toBe(true);
    });

    it('should not allow paralegal to create billable time entries', () => {
      expect(canCreateTimeEntry('PARALEGAL', true)).toBe(false);
    });

    it('should allow paralegal to create non-billable time entries', () => {
      expect(canCreateTimeEntry('PARALEGAL', false)).toBe(true);
    });
  });

  describe('canApproveTimeEntry', () => {
    it('should allow partner to approve time entries', () => {
      expect(canApproveTimeEntry('PARTNER')).toBe(true);
    });

    it('should not allow associate to approve time entries', () => {
      expect(canApproveTimeEntry('ASSOCIATE')).toBe(false);
    });
  });

  describe('canGenerateInvoice', () => {
    it('should allow partner to generate invoices', () => {
      expect(canGenerateInvoice('PARTNER')).toBe(true);
    });

    it('should allow senior associate to generate invoices', () => {
      expect(canGenerateInvoice('SENIOR_ASSOCIATE')).toBe(true);
    });

    it('should not allow junior associate to generate invoices', () => {
      expect(canGenerateInvoice('ASSOCIATE')).toBe(false);
    });
  });

  describe('canRecordPayment', () => {
    it('should allow partner to record payments', () => {
      expect(canRecordPayment('PARTNER')).toBe(true);
    });

    it('should not allow associate to record payments', () => {
      expect(canRecordPayment('ASSOCIATE')).toBe(false);
    });
  });

  describe('canAccessAIFeatures', () => {
    it('should allow partner to access AI features', () => {
      expect(canAccessAIFeatures('PARTNER')).toBe(true);
    });

    it('should allow senior associate to access AI features', () => {
      expect(canAccessAIFeatures('SENIOR_ASSOCIATE')).toBe(true);
    });

    it('should allow associate to access AI features', () => {
      expect(canAccessAIFeatures('ASSOCIATE')).toBe(true);
    });

    it('should not allow paralegal to access AI features', () => {
      expect(canAccessAIFeatures('PARALEGAL')).toBe(false);
    });
  });

  describe('canManageOrganization', () => {
    it('should allow admin to manage organization', () => {
      expect(canManageOrganization('ADMIN')).toBe(true);
    });

    it('should not allow partner to manage organization', () => {
      expect(canManageOrganization('PARTNER')).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return correct permissions for partner', () => {
      const permissions = getRolePermissions('PARTNER');

      expect(permissions).toContain('MATTERS_VIEW');
      expect(permissions).toContain('MATTERS_CREATE');
      expect(permissions).toContain('MATTERS_EDIT');
      expect(permissions).toContain('MATTERS_DELETE');
      expect(permissions).toContain('BILLING_VIEW');
      expect(permissions).toContain('BILLING_CREATE');
      expect(permissions).toContain('BILLING_APPROVE');
      expect(permissions).toContain('USERS_MANAGE');
    });

    it('should return correct permissions for associate', () => {
      const permissions = getRolePermissions('ASSOCIATE');

      expect(permissions).toContain('MATTERS_VIEW');
      expect(permissions).toContain('MATTERS_CREATE');
      expect(permissions).toContain('TIME_ENTRIES_CREATE');
      expect(permissions).not.toContain('BILLING_APPROVE');
      expect(permissions).not.toContain('USERS_MANAGE');
    });

    it('should return correct permissions for paralegal', () => {
      const permissions = getRolePermissions('PARALEGAL');

      expect(permissions).toContain('MATTERS_VIEW');
      expect(permissions).not.toContain('MATTERS_CREATE');
      expect(permissions).not.toContain('BILLING_VIEW');
      expect(permissions).not.toContain('TIME_ENTRIES_CREATE');
    });

    it('should return permissions for admin role', () => {
      const permissions = getRolePermissions('ADMIN');

      expect(permissions).toContain('ORGANIZATION_MANAGE');
      expect(permissions).toContain('USERS_MANAGE');
      expect(permissions).toContain('MATTERS_VIEW');
      expect(permissions).toContain('BILLING_VIEW');
    });
  });
});
