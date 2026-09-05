export type ContractStatus =
  | "draft"
  | "review"
  | "negotiation"
  | "pending_signature"
  | "active"
  | "expired"
  | "terminated"
  | "amended";

export type ContractType =
  | "service_agreement"
  | "employment"
  | "nda"
  | "partnership"
  | "vendor"
  | "lease"
  | "licensing"
  | "consulting"
  | "other";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Contract {
  id: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  matterId?: string;
  parties: ContractParty[];
  effectiveDate: Date;
  expirationDate?: Date;
  renewalDate?: Date;
  totalValue?: number;
  currency?: string;
  clauses: ContractClause[];
  tags: string[];
  description?: string;
  governingLaw?: string;
  jurisdiction?: string;
  aiAnalysis?: ContractAIAnalysis;
  versions: ContractVersion[];
  currentVersion: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractParty {
  id: string;
  name: string;
  role: "client" | "counterparty" | "guarantor" | "witness";
  entityName?: string;
  signatory?: string;
  signatoryTitle?: string;
  signedAt?: Date;
  address?: string;
  email?: string;
}

export interface ContractClause {
  id: string;
  contractId: string;
  number: string;
  title: string;
  content: string;
  category: ClauseCategory;
  riskLevel?: RiskLevel;
  aiSuggestion?: string;
  isRequired: boolean;
  order: number;
  parentId?: string;
}

export type ClauseCategory =
  | "payment"
  | "termination"
  | "confidentiality"
  | "indemnification"
  | "liability"
  | "intellectual_property"
  | "dispute_resolution"
  | "force_majeure"
  | "governing_law"
  | "assignment"
  | "entire_agreement"
  | "severability"
  | "notice"
  | "amendment"
  | "other";

export interface ContractVersion {
  id: string;
  contractId: string;
  version: number;
  content: string;
  changeNotes?: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface ContractAIAnalysis {
  overallRisk: RiskLevel;
  riskScore: number;
  summary: string;
  keyTerms: ContractKeyTerm[];
  risks: ContractRisk[];
  suggestions: string[];
  complianceIssues: string[];
  analyzedAt: Date;
  model: string;
}

export interface ContractKeyTerm {
  term: string;
  value: string;
  clauseNumber?: string;
  importance: "low" | "medium" | "high";
}

export interface ContractRisk {
  clauseNumber: string;
  clauseTitle: string;
  level: RiskLevel;
  description: string;
  recommendation: string;
  precedent?: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  type: ContractType;
  description: string;
  content: string;
  clauses: Array<{
    title: string;
    content: string;
    category: ClauseCategory;
    isRequired: boolean;
  }>;
  tags: string[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface ContractFilter {
  type?: ContractType[];
  status?: ContractStatus[];
  matterId?: string;
  partyName?: string;
  riskLevel?: RiskLevel[];
  tags?: string[];
  dateRange?: { start: Date; end: Date };
  search?: string;
}

export interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  expiringSoon: number;
  contractsByType: Record<ContractType, number>;
  contractsByStatus: Record<ContractStatus, number>;
  averageRiskScore: number;
  totalContractValue: number;
}

export interface CreateContractInput {
  title: string;
  type: ContractType;
  matterId?: string;
  parties: Omit<ContractParty, "id">[];
  effectiveDate: Date;
  expirationDate?: Date;
  totalValue?: number;
  currency?: string;
  description?: string;
  governingLaw?: string;
  jurisdiction?: string;
  tags?: string[];
  templateId?: string;
}

export interface UpdateContractInput {
  title?: string;
  type?: ContractType;
  status?: ContractStatus;
  effectiveDate?: Date;
  expirationDate?: Date;
  totalValue?: number;
  description?: string;
  governingLaw?: string;
  jurisdiction?: string;
  tags?: string[];
}
