export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  apiVersion?: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customerId: string;
  status: "active" | "canceled" | "incomplete" | "past_due" | "trialing" | "unpaid";
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  items: StripeSubscriptionItem[];
}

export interface StripeSubscriptionItem {
  id: string;
  priceId: string;
  quantity: number;
}

export interface StripeInvoice {
  id: string;
  customerId: string;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "requires_payment_method" | "requires_confirmation" | "succeeded" | "canceled";
  clientSecret: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  metadata?: Record<string, string>;
}

export interface CreateInvoiceParams {
  customerId: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateInvoiceItemParams {
  invoiceId: string;
  amount: number;
  currency?: string;
  description: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

// ─── Stripe Client Abstraction ───────────────────────────────────────────────

export interface StripeClient {
  customers: {
    create(params: CreateCustomerParams): Promise<StripeCustomer>;
    retrieve(id: string): Promise<StripeCustomer>;
    update(id: string, params: Partial<CreateCustomerParams>): Promise<StripeCustomer>;
    list(params?: { limit?: number; startingAfter?: string }): Promise<StripeCustomer[]>;
  };
  subscriptions: {
    create(params: { customerId: string; priceId: string; trialDays?: number }): Promise<StripeSubscription>;
    retrieve(id: string): Promise<StripeSubscription>;
    cancel(id: string): Promise<StripeSubscription>;
    list(params?: { customerId?: string; status?: string; limit?: number }): Promise<StripeSubscription[]>;
  };
  invoices: {
    create(params: CreateInvoiceParams): Promise<StripeInvoice>;
    retrieve(id: string): Promise<StripeInvoice>;
    addItem(params: CreateInvoiceItemParams): Promise<void>;
    finalize(invoiceId: string): Promise<StripeInvoice>;
    send(invoiceId: string): Promise<StripeInvoice>;
    void(invoiceId: string): Promise<StripeInvoice>;
    list(params?: { customerId?: string; limit?: number }): Promise<StripeInvoice[]>;
  };
  paymentIntents: {
    create(params: CreatePaymentIntentParams): Promise<StripePaymentIntent>;
    retrieve(id: string): Promise<StripePaymentIntent>;
    confirm(id: string): Promise<StripePaymentIntent>;
    cancel(id: string): Promise<StripePaymentIntent>;
  };
}

let stripeClient: StripeClient | null = null;

export function configureStripe(client: StripeClient): void {
  stripeClient = client;
}

function getClient(): StripeClient {
  if (!stripeClient) {
    throw new Error("Stripe client not configured. Call configureStripe() first.");
  }
  return stripeClient;
}

// ─── Customer Operations ─────────────────────────────────────────────────────

export async function createCustomer(params: CreateCustomerParams): Promise<StripeCustomer> {
  return getClient().customers.create(params);
}

export async function getCustomer(id: string): Promise<StripeCustomer> {
  return getClient().customers.retrieve(id);
}

export async function updateCustomer(
  id: string,
  params: Partial<CreateCustomerParams>
): Promise<StripeCustomer> {
  return getClient().customers.update(id, params);
}

export async function listCustomers(limit = 25): Promise<StripeCustomer[]> {
  return getClient().customers.list({ limit });
}

// ─── Subscription Operations ─────────────────────────────────────────────────

export async function createSubscription(
  customerId: string,
  priceId: string,
  trialDays?: number
): Promise<StripeSubscription> {
  return getClient().subscriptions.create({ customerId, priceId, trialDays });
}

export async function getSubscription(id: string): Promise<StripeSubscription> {
  return getClient().subscriptions.retrieve(id);
}

export async function cancelSubscription(id: string): Promise<StripeSubscription> {
  return getClient().subscriptions.cancel(id);
}

// ─── Invoice Operations ──────────────────────────────────────────────────────

export async function createInvoice(params: CreateInvoiceParams): Promise<StripeInvoice> {
  return getClient().invoices.create(params);
}

export async function addInvoiceItem(params: CreateInvoiceItemParams): Promise<void> {
  return getClient().invoices.addItem(params);
}

export async function finalizeInvoice(invoiceId: string): Promise<StripeInvoice> {
  return getClient().invoices.finalize(invoiceId);
}

export async function sendInvoice(invoiceId: string): Promise<StripeInvoice> {
  return getClient().invoices.send(invoiceId);
}

export async function voidInvoice(invoiceId: string): Promise<StripeInvoice> {
  return getClient().invoices.void(invoiceId);
}

// ─── Payment Operations ──────────────────────────────────────────────────────

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<StripePaymentIntent> {
  return getClient().paymentIntents.create(params);
}

// ─── Webhook Verification ────────────────────────────────────────────────────

export interface WebhookEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
  created: number;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const parts = signature.split(",").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  if (!parts.t || !parts.v1) return false;

  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${parts.t}.${payload}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
}

// ─── Billing Helpers ─────────────────────────────────────────────────────────

export function calculateInvoiceTotal(
  items: Array<{ hours: number; rate: number }>
): number {
  return items.reduce((total, item) => total + item.hours * item.rate, 0);
}

export function formatStripeAmount(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`;
}

export function toStripeAmount(dollars: number): number {
  return Math.round(dollars * 100);
}

export function fromStripeAmount(cents: number): number {
  return cents / 100;
}

export function generateInvoiceNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const num = String(sequence).padStart(5, "0");
  return `INV-${year}-${num}`;
}

export function calculateDueDate(
  invoiceDate: Date,
  netDays = 30
): Date {
  const due = new Date(invoiceDate);
  due.setDate(due.getDate() + netDays);
  return due;
}
