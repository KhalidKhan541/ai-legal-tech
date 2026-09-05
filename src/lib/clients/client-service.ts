import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const ClientType = z.enum([
  "individual",
  "corporation",
  "partnership",
  "llc",
  "non_profit",
  "government",
  "trust",
  "estate",
  "other",
]);
export type ClientType = z.infer<typeof ClientType>;

export const ClientStatus = z.enum([
  "active",
  "inactive",
  "prospect",
  "former",
  "archived",
]);
export type ClientStatus = z.infer<typeof ClientStatus>;

export const ContactType = z.enum([
  "primary",
  "billing",
  "emergency",
  "authorized",
  "other",
]);
export type ContactType = z.infer<typeof ContactType>;

export const RelationshipType = z.enum([
  "self",
  "spouse",
  "parent",
  "child",
  "sibling",
  "employee",
  "agent",
  "partner",
  "officer",
  "other",
]);
export type RelationshipType = z.infer<typeof RelationshipType>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const ClientContactSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
  relationship: RelationshipType,
  contactType: ContactType,
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  fax: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      street2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().default("US"),
    })
    .optional(),
  isAuthorizedToPractice: z.boolean().default(false),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ClientContact = z.infer<typeof ClientContactSchema>;

export const ClientBillingInfoSchema = z.object({
  clientId: z.string().uuid(),
  billingMethod: z.enum(["hourly", "fixed", "contingency", "retainer", "other"]),
  hourlyRate: z.number().min(0).optional(),
  retainerAmount: z.number().min(0).optional(),
  retainerBalance: z.number().min(0).optional(),
  paymentTerms: z.number().min(0).default(30),
  currency: z.string().default("USD"),
  taxId: z.string().optional(),
  taxExempt: z.boolean().default(false),
  preferredPaymentMethod: z.enum([
    "check",
    "wire",
    "credit_card",
    "ach",
    "other",
  ]).optional(),
  billingAddress: z
    .object({
      street: z.string().optional(),
      street2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().default("US"),
    })
    .optional(),
  invoicingEmail: z.string().email().optional(),
  poRequired: z.boolean().default(false),
  creditLimit: z.number().min(0).optional(),
  balance: z.number().default(0),
  totalBilled: z.number().default(0),
  totalPaid: z.number().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ClientBillingInfo = z.infer<typeof ClientBillingInfoSchema>;

export const ClientIntakeSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  intakeDate: z.string().datetime(),
  source: z.enum([
    "website",
    "referral",
    "ad",
    "social_media",
    "walk_in",
    "phone",
    "other",
  ]),
  referredBy: z.string().optional(),
  matterType: z.string(),
  description: z.string().min(1),
  urgency: z.enum(["low", "medium", "high", "emergency"]),
  conflictCheckCompleted: z.boolean().default(false),
  conflictCheckResult: z.enum(["cleared", "conflict", "pending"]).default("pending"),
  intakeAttorney: z.string().uuid(),
  intakeParalegal: z.string().uuid().optional(),
  consultationScheduled: z.boolean().default(false),
  consultationDate: z.string().datetime().optional()),
  consultationNotes: z.string().optional(),
  followUpDate: z.string().datetime().optional()),
  followUpNotes: z.string().optional(),
  status: z.enum([
    "new",
    "reviewing",
    "consultation_scheduled",
    "consultation_completed",
    "accepted",
    "declined",
    "pending_info",
  ]),
  documents: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        type: z.string(),
        uploadedAt: z.string().datetime(),
      })
    )
    .default([]),
  customFields: z.record(z.unknown()).default({}),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ClientIntake = z.infer<typeof ClientIntakeSchema>;

export const ClientSchema = z.object({
  id: z.string().uuid(),
  clientNumber: z.string(),
  type: ClientType,
  status: ClientStatus,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  companyName: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  fax: z.string().optional(),
  website: z.string().url().optional(),
  address: z
    .object({
      street: z.string().optional(),
      street2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().default("US"),
    })
    .optional(),
  contacts: z.array(ClientContactSchema).default([]),
  matterIds: z.array(z.string().uuid()).default([]),
  billingInfo: ClientBillingInfoSchema.optional(),
  intakeForms: z.array(ClientIntakeSchema).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  referredBy: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

export type Client = z.infer<typeof ClientSchema>;

export const CreateClientSchema = ClientSchema.omit({
  id: true,
  clientNumber: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  contacts: true,
  matterIds: true,
  intakeForms: true,
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;

export const UpdateClientSchema = ClientSchema.partial().omit({
  id: true,
  clientNumber: true,
  createdAt: true,
  createdBy: true,
});

export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

export const ClientFilterSchema = z.object({
  type: z.array(ClientType).optional(),
  status: z.array(ClientStatus).optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  hasActiveMatters: z.boolean().optional(),
  minBalance: z.number().optional(),
  maxBalance: z.number().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  sortBy: z
    .enum([
      "firstName",
      "lastName",
      "companyName",
      "status",
      "createdAt",
      "updatedAt",
    ])
    .default("lastName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type ClientFilter = z.infer<typeof ClientFilterSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  clientsByType: Record<ClientType, number>;
  clientsByStatus: Record<ClientStatus, number>;
  totalOutstandingBalance: number;
  clientsWithActiveMatters: number;
  newClientsThisMonth: number;
}

export interface ClientConflictCheckResult {
  clientId: string;
  conflictFound: boolean;
  conflicts: {
    type: string;
    description: string;
    relatedClientId: string;
    relatedClientName: string;
    matterId?: string;
    matterNumber?: string;
    riskLevel: "low" | "medium" | "high" | "critical";
  }[];
  checkedAt: string;
}

export interface BillingInvoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  matterId: string;
  matterNumber: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  lineItems: {
    description: string;
    hours?: number;
    rate?: number;
    amount: number;
    date: string;
  }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let clients: Client[] = [];
let invoices: BillingInvoice[] = [];
let intakeForms: ClientIntake[] = [];
let clientCounter = 1;
let invoiceCounter = 1;

function generateId(): string {
  return crypto.randomUUID();
}

function generateClientNumber(): string {
  const year = new Date().getFullYear();
  const num = String(clientCounter++).padStart(5, "0");
  return `CLI-${year}-${num}`;
}

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const num = String(invoiceCounter++).padStart(5, "0");
  return `INV-${year}-${num}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Client Service ─────────────────────────────────────────────────────────

export const ClientService = {
  /**
   * Create a new client
   */
  create(input: CreateClientInput, userId: string): Client {
    const validated = CreateClientSchema.parse(input);

    const client: Client = {
      ...validated,
      id: generateId(),
      clientNumber: generateClientNumber(),
      createdAt: now(),
      updatedAt: now(),
      createdBy: userId,
      updatedBy: userId,
      contacts: [],
      matterIds: [],
      intakeForms: [],
    };

    clients.push(client);
    return client;
  },

  /**
   * Get client by ID
   */
  getById(id: string): Client | undefined {
    return clients.find((c) => c.id === id);
  },

  /**
   * Get client by client number
   */
  getByClientNumber(clientNumber: string): Client | undefined {
    return clients.find((c) => c.clientNumber === clientNumber);
  },

  /**
   * Update client
   */
  update(id: string, input: UpdateClientInput, userId: string): Client | undefined {
    const index = clients.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    const validated = UpdateClientSchema.parse(input);
    clients[index] = {
      ...clients[index],
      ...validated,
      updatedAt: now(),
      updatedBy: userId,
    };

    return clients[index];
  },

  /**
   * Delete client (soft delete by archiving)
   */
  delete(id: string, userId: string): boolean {
    const client = clients.find((c) => c.id === id);
    if (!client) return false;

    // Check for active matters
    if (client.matterIds.length > 0) {
      throw new Error(
        "Cannot delete client with active matters. Remove all matters first."
      );
    }

    client.status = "archived";
    client.updatedAt = now();
    client.updatedBy = userId;
    return true;
  },

  /**
   * Add contact to client
   */
  addContact(
    clientId: string,
    contact: Omit<ClientContact, "id" | "clientId" | "createdAt" | "updatedAt">
  ): ClientContact {
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Check if primary contact already exists
    if (contact.contactType === "primary") {
      const existingPrimary = client.contacts.find(
        (c) => c.contactType === "primary"
      );
      if (existingPrimary) {
        throw new Error("Primary contact already exists. Update existing or change type.");
      }
    }

    const newContact: ClientContact = {
      ...contact,
      id: generateId(),
      clientId,
      createdAt: now(),
      updatedAt: now(),
    };

    client.contacts.push(newContact);
    client.updatedAt = now();
    return newContact;
  },

  /**
   * Update contact
   */
  updateContact(
    clientId: string,
    contactId: string,
    updates: Partial<Omit<ClientContact, "id" | "clientId" | "createdAt" | "updatedAt">>
  ): ClientContact | undefined {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return undefined;

    const contactIndex = client.contacts.findIndex((c) => c.id === contactId);
    if (contactIndex === -1) return undefined;

    client.contacts[contactIndex] = {
      ...client.contacts[contactIndex],
      ...updates,
      updatedAt: now(),
    };
    client.updatedAt = now();

    return client.contacts[contactIndex];
  },

  /**
   * Delete contact
   */
  deleteContact(clientId: string, contactId: string): boolean {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return false;

    const contactIndex = client.contacts.findIndex((c) => c.id === contactId);
    if (contactIndex === -1) return false;

    client.contacts.splice(contactIndex, 1);
    client.updatedAt = now();
    return true;
  },

  /**
   * Get contacts for a client
   */
  getContacts(clientId: string): ClientContact[] {
    const client = clients.find((c) => c.id === clientId);
    return client?.contacts ?? [];
  },

  /**
   * Link matter to client
   */
  linkMatter(clientId: string, matterId: string): Client | undefined {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return undefined;

    if (!client.matterIds.includes(matterId)) {
      client.matterIds.push(matterId);
      client.updatedAt = now();
    }

    return client;
  },

  /**
   * Unlink matter from client
   */
  unlinkMatter(clientId: string, matterId: string): Client | undefined {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return undefined;

    client.matterIds = client.matterIds.filter((id) => id !== matterId);
    client.updatedAt = now();
    return client;
  },

  /**
   * Get client matters
   */
  getClientMatters(clientId: string): string[] {
    const client = clients.find((c) => c.id === clientId);
    return client?.matterIds ?? [];
  },

  /**
   * Update billing info
   */
  updateBillingInfo(
    clientId: string,
    billingInfo: Partial<Omit<ClientBillingInfo, "clientId" | "createdAt" | "updatedAt">>
  ): ClientBillingInfo | undefined {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return undefined;

    if (!client.billingInfo) {
      client.billingInfo = {
        clientId,
        billingMethod: "hourly",
        paymentTerms: 30,
        currency: "USD",
        taxExempt: false,
        poRequired: false,
        balance: 0,
        totalBilled: 0,
        totalPaid: 0,
        createdAt: now(),
        updatedAt: now(),
        ...billingInfo,
      };
    } else {
      client.billingInfo = {
        ...client.billingInfo,
        ...billingInfo,
        updatedAt: now(),
      };
    }

    client.updatedAt = now();
    return client.billingInfo;
  },

  /**
   * Get billing history for client
   */
  getBillingHistory(clientId: string): BillingInvoice[] {
    return invoices
      .filter((inv) => inv.clientId === clientId)
      .sort(
        (a, b) =>
          new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
      );
  },

  /**
   * Create invoice for client
   */
  createInvoice(
    clientId: string,
    matterId: string,
    lineItems: BillingInvoice["lineItems"],
    notes?: string
  ): BillingInvoice {
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const amount = lineItems.reduce((sum, item) => sum + item.amount, 0);

    const invoice: BillingInvoice = {
      id: generateId(),
      clientId,
      invoiceNumber: generateInvoiceNumber(),
      matterId,
      matterNumber: "",
      amount,
      currency: client.billingInfo?.currency ?? "USD",
      status: "draft",
      issueDate: now(),
      dueDate: new Date(
        Date.now() +
          (client.billingInfo?.paymentTerms ?? 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
      lineItems,
      notes,
      createdAt: now(),
      updatedAt: now(),
    };

    invoices.push(invoice);

    // Update client billing totals
    if (client.billingInfo) {
      client.billingInfo.totalBilled += amount;
      client.billingInfo.balance += amount;
      client.billingInfo.updatedAt = now();
    }

    return invoice;
  },

  /**
   * Update invoice status
   */
  updateInvoiceStatus(
    invoiceId: string,
    status: BillingInvoice["status"]
  ): BillingInvoice | undefined {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return undefined;

    invoice.status = status;
    invoice.updatedAt = now();

    if (status === "paid") {
      invoice.paidDate = now();

      // Update client balance
      const client = clients.find((c) => c.id === invoice.clientId);
      if (client?.billingInfo) {
        client.billingInfo.balance -= invoice.amount;
        client.billingInfo.totalPaid += invoice.amount;
        client.billingInfo.updatedAt = now();
      }
    }

    return invoice;
  },

  /**
   * Get client intake forms
   */
  getIntakeForms(clientId: string): ClientIntake[] {
    return intakeForms
      .filter((form) => form.clientId === clientId)
      .sort(
        (a, b) =>
          new Date(b.intakeDate).getTime() - new Date(a.intakeDate).getTime()
      );
  },

  /**
   * Create intake form
   */
  createIntakeForm(
    input: Omit<ClientIntake, "id" | "createdAt" | "updatedAt">
  ): ClientIntake {
    const intake: ClientIntake = {
      ...input,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };

    intakeForms.push(intake);
    return intake;
  },

  /**
   * Update intake form
   */
  updateIntakeForm(
    id: string,
    updates: Partial<Omit<ClientIntake, "id" | "createdAt" | "updatedAt">>
  ): ClientIntake | undefined {
    const index = intakeForms.findIndex((f) => f.id === id);
    if (index === -1) return undefined;

    intakeForms[index] = {
      ...intakeForms[index],
      ...updates,
      updatedAt: now(),
    };

    return intakeForms[index];
  },

  /**
   * Run conflict check for client
   */
  runConflictCheck(
    clientId: string,
    opposingParty: string,
    opposingPartyType: "individual" | "corporation" = "individual"
  ): ClientConflictCheckResult {
    const client = clients.find((c) => c.id === clientId);
    const conflicts: ClientConflictCheckResult["conflicts"] = [];

    // Check if opposing party is another client
    for (const otherClient of clients) {
      if (otherClient.id === clientId) continue;

      const otherName =
        otherClient.type === "individual" || otherClient.type === "trust" || otherClient.type === "estate"
          ? `${otherClient.firstName} ${otherClient.lastName}`.toLowerCase()
          : (otherClient.companyName ?? "").toLowerCase();

      const opposingName = opposingParty.toLowerCase();

      if (otherName === opposingName) {
        conflicts.push({
          type: "direct",
          description: `Opposing party "${opposingParty}" is an existing client`,
          relatedClientId: otherClient.id,
          relatedClientName:
            otherClient.type === "individual" || otherClient.type === "trust" || otherClient.type === "estate"
              ? `${otherClient.firstName} ${otherClient.lastName}`
              : otherClient.companyName ?? "Unknown",
          riskLevel: "critical",
        });
      }

      // Check if opposing party is a contact of another client
      for (const contact of otherClient.contacts) {
        const contactName =
          `${contact.firstName} ${contact.lastName}`.toLowerCase();
        if (contactName === opposingName) {
          conflicts.push({
            type: "related",
            description: `Opposing party "${opposingParty}" is a contact for client ${otherClient.clientNumber}`,
            relatedClientId: otherClient.id,
            relatedClientName:
              `${otherClient.firstName} ${otherClient.lastName}`,
            riskLevel: "high",
          });
        }
      }
    }

    // Check if opposing party is a contact of the same client
    if (client) {
      for (const contact of client.contacts) {
        const contactName =
          `${contact.firstName} ${contact.lastName}`.toLowerCase();
        if (contactName === opposingParty.toLowerCase()) {
          conflicts.push({
            type: "financial_interest",
            description: `Opposing party "${opposingParty}" is a contact of this client`,
            relatedClientId: clientId,
            relatedClientName: `${client.firstName} ${client.lastName}`,
            riskLevel: "high",
          });
        }
      }
    }

    return {
      clientId,
      conflictFound: conflicts.some(
        (c) => c.riskLevel === "critical" || c.riskLevel === "high"
      ),
      conflicts,
      checkedAt: now(),
    };
  },

  /**
   * Search and filter clients
   */
  search(filter: ClientFilter): PaginatedResult<Client> {
    const validated = ClientFilterSchema.parse(filter);
    let filtered = [...clients];

    // Type filter
    if (validated.type?.length) {
      filtered = filtered.filter((c) => validated.type!.includes(c.type));
    }

    // Status filter
    if (validated.status?.length) {
      filtered = filtered.filter((c) => validated.status!.includes(c.status));
    }

    // Text search
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.firstName.toLowerCase().includes(term) ||
          c.lastName.toLowerCase().includes(term) ||
          c.companyName?.toLowerCase().includes(term) ||
          c.clientNumber.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.phone?.includes(term)
      );
    }

    // Tags filter
    if (validated.tags?.length) {
      filtered = filtered.filter((c) =>
        validated.tags!.some((tag) => c.tags.includes(tag))
      );
    }

    // Active matters filter
    if (validated.hasActiveMatters !== undefined) {
      filtered = filtered.filter((c) =>
        validated.hasActiveMatters ? c.matterIds.length > 0 : c.matterIds.length === 0
      );
    }

    // Balance filters
    if (validated.minBalance !== undefined) {
      filtered = filtered.filter(
        (c) => (c.billingInfo?.balance ?? 0) >= validated.minBalance!
      );
    }
    if (validated.maxBalance !== undefined) {
      filtered = filtered.filter(
        (c) => (c.billingInfo?.balance ?? 0) <= validated.maxBalance!
      );
    }

    // Date range filters
    if (validated.createdFrom) {
      filtered = filtered.filter(
        (c) => new Date(c.createdAt) >= new Date(validated.createdFrom!)
      );
    }
    if (validated.createdTo) {
      filtered = filtered.filter(
        (c) => new Date(c.createdAt) <= new Date(validated.createdTo!)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[validated.sortBy] ?? "";
      const bVal = b[validated.sortBy] ?? "";
      const comparison = String(aVal).localeCompare(String(bVal));
      return validated.sortOrder === "asc" ? comparison : -comparison;
    });

    // Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / validated.limit);
    const start = (validated.page - 1) * validated.limit;
    const items = filtered.slice(start, start + validated.limit);

    return { items, total, page: validated.page, limit: validated.limit, totalPages };
  },

  /**
   * Get client statistics
   */
  getStats(): ClientStats {
    const clientsByType = {} as Record<ClientType, number>;
    const clientsByStatus = {} as Record<ClientStatus, number>;

    for (const type of Object.values(ClientType.enum)) {
      clientsByType[type] = 0;
    }
    for (const status of Object.values(ClientStatus.enum)) {
      clientsByStatus[status] = 0;
    }

    let totalOutstandingBalance = 0;
    let clientsWithActiveMatters = 0;
    let newClientsThisMonth = 0;

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    for (const client of clients) {
      clientsByType[client.type]++;
      clientsByStatus[client.status]++;

      if (client.billingInfo) {
        totalOutstandingBalance += client.billingInfo.balance;
      }

      if (client.matterIds.length > 0) {
        clientsWithActiveMatters++;
      }

      if (new Date(client.createdAt) >= thisMonth) {
        newClientsThisMonth++;
      }
    }

    return {
      totalClients: clients.length,
      activeClients: clients.filter((c) => c.status === "active").length,
      clientsByType,
      clientsByStatus,
      totalOutstandingBalance,
      clientsWithActiveMatters,
      newClientsThisMonth,
    };
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    clients = [];
    invoices = [];
    intakeForms = [];
    clientCounter = 1;
    invoiceCounter = 1;
  },
};
