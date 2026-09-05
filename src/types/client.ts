export type ClientType = "individual" | "corporate" | "government" | "nonprofit";

export type ClientStatus = "active" | "inactive" | "prospect" | "former";

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address: ClientAddress;
  billingAddress?: ClientAddress;
  contacts: ClientContact[];
  matters: ClientMatterRef[];
  billingInfo: ClientBillingInfo;
  tags: string[];
  notes?: string;
  referredBy?: string;
  conflictChecked: boolean;
  conflictCheckedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ClientAddress {
  street: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ClientContact {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
}

export interface ClientMatterRef {
  matterId: string;
  matterNumber: string;
  title: string;
  status: string;
  openDate: Date;
}

export interface ClientBillingInfo {
  billingMethod: "hourly" | "flat_fee" | "contingency" | "retainer";
  hourlyRate?: number;
  retainerAmount?: number;
  retainerBalance?: number;
  paymentTerms: number;
  currency: string;
  taxId?: string;
  billingEmail?: string;
  billingAddress?: ClientAddress;
}

export interface ClientCommunication {
  id: string;
  clientId: string;
  matterId?: string;
  type: "email" | "phone" | "meeting" | "letter" | "other";
  subject: string;
  content: string;
  direction: "inbound" | "outbound";
  date: Date;
  userId: string;
  userName: string;
  attachments?: ClientAttachment[];
}

export interface ClientAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  clientsByType: Record<ClientType, number>;
  clientsByStatus: Record<ClientStatus, number>;
  totalRevenue: number;
  averageRevenuePerClient: number;
}

export interface ClientFilter {
  type?: ClientType[];
  status?: ClientStatus[];
  tags?: string[];
  search?: string;
  hasActiveMatters?: boolean;
  dateRange?: { start: Date; end: Date };
}

export interface CreateClientInput {
  name: string;
  type: ClientType;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address: ClientAddress;
  billingAddress?: ClientAddress;
  billingInfo: Partial<ClientBillingInfo>;
  tags?: string[];
  notes?: string;
  referredBy?: string;
}

export interface UpdateClientInput {
  name?: string;
  type?: ClientType;
  status?: ClientStatus;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: ClientAddress;
  billingAddress?: ClientAddress;
  billingInfo?: Partial<ClientBillingInfo>;
  tags?: string[];
  notes?: string;
}
