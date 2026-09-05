export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  defaultValue: boolean;
  rolloutPercentage?: number;
  allowedUsers?: string[];
  allowedRoles?: string[];
  variants?: FeatureFlagVariant[];
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface FeatureFlagVariant {
  key: string;
  name: string;
  weight: number;
  payload?: Record<string, unknown>;
}

export interface FeatureFlagContext {
  userId?: string;
  role?: string;
  email?: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface FeatureFlagEvaluation {
  flagKey: string;
  enabled: boolean;
  variant?: FeatureFlagVariant;
  reason: "default" | "disabled" | "enabled" | "rollout" | "targeted" | "variant";
}

// ─── Feature Flag Store ──────────────────────────────────────────────────────

class FeatureFlagStore {
  private flags = new Map<string, FeatureFlag>();
  private evaluations = new Map<string, FeatureFlagEvaluation>();

  setFlag(flag: Omit<FeatureFlag, "createdAt" | "updatedAt">): void {
    const existing = this.flags.get(flag.key);
    this.flags.set(flag.key, {
      ...flag,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
  }

  removeFlag(key: string): void {
    this.flags.delete(key);
  }

  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  evaluate(key: string, context?: FeatureFlagContext): FeatureFlagEvaluation {
    const cached = this.evaluations.get(`${key}:${context?.userId ?? "anon"}`);
    if (cached) return cached;

    const flag = this.flags.get(key);

    if (!flag) {
      const evaluation: FeatureFlagEvaluation = {
        flagKey: key,
        enabled: false,
        reason: "default",
      };
      return evaluation;
    }

    if (!flag.enabled) {
      return {
        flagKey: key,
        enabled: false,
        reason: "disabled",
      };
    }

    if (context?.userId && flag.allowedUsers?.includes(context.userId)) {
      return {
        flagKey: key,
        enabled: true,
        reason: "targeted",
      };
    }

    if (context?.role && flag.allowedRoles?.includes(context.role)) {
      return {
        flagKey: key,
        enabled: true,
        reason: "targeted",
      };
    }

    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = context?.userId
        ? this.hashString(`${key}:${context.userId}`)
        : Math.random();
      const percentage = (hash % 100);

      if (percentage >= flag.rolloutPercentage) {
        return {
          flagKey: key,
          enabled: false,
          reason: "rollout",
        };
      }
    }

    let variant: FeatureFlagVariant | undefined;
    if (flag.variants && flag.variants.length > 0) {
      const hash = context?.userId
        ? this.hashString(`${key}:variant:${context.userId}`)
        : Math.random() * 100;

      let cumulative = 0;
      for (const v of flag.variants) {
        cumulative += v.weight;
        if (hash < cumulative) {
          variant = v;
          break;
        }
      }
    }

    const evaluation: FeatureFlagEvaluation = {
      flagKey: key,
      enabled: true,
      variant,
      reason: variant ? "variant" : "enabled",
    };

    this.evaluations.set(`${key}:${context?.userId ?? "anon"}`, evaluation);
    return evaluation;
  }

  isEnabled(key: string, context?: FeatureFlagContext): boolean {
    return this.evaluate(key, context).enabled;
  }

  getVariant<T = Record<string, unknown>>(
    key: string,
    context?: FeatureFlagContext
  ): T | undefined {
    const evaluation = this.evaluate(key, context);
    return evaluation.variant?.payload as T | undefined;
  }

  clearEvaluations(): void {
    this.evaluations.clear();
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

// ─── Singleton & Public API ──────────────────────────────────────────────────

const flagStore = new FeatureFlagStore();

export function defineFeatureFlag(
  flag: Omit<FeatureFlag, "createdAt" | "updatedAt">
): void {
  flagStore.setFlag(flag);
}

export function isFeatureEnabled(key: string, context?: FeatureFlagContext): boolean {
  return flagStore.isEnabled(key, context);
}

export function getFeatureVariant<T = Record<string, unknown>>(
  key: string,
  context?: FeatureFlagContext
): T | undefined {
  return flagStore.getVariant<T>(key, context);
}

export function evaluateFeatureFlag(
  key: string,
  context?: FeatureFlagContext
): FeatureFlagEvaluation {
  return flagStore.evaluate(key, context);
}

export function getAllFeatureFlags(): FeatureFlag[] {
  return flagStore.getAllFlags();
}

// ─── Default Legal Tech Feature Flags ────────────────────────────────────────

export const DEFAULT_FLAGS: Array<Omit<FeatureFlag, "createdAt" | "updatedAt">> = [
  {
    key: "ai-contract-review",
    name: "AI Contract Review",
    description: "Enable AI-powered contract analysis and review",
    enabled: true,
    defaultValue: true,
  },
  {
    key: "ai-legal-research",
    name: "AI Legal Research",
    description: "Enable AI-powered legal research assistant",
    enabled: true,
    defaultValue: true,
  },
  {
    key: "document-versioning",
    name: "Document Versioning",
    description: "Enable document version control",
    enabled: true,
    defaultValue: true,
  },
  {
    key: "time-tracking",
    name: "Time Tracking",
    description: "Enable time tracking for billing",
    enabled: true,
    defaultValue: true,
  },
  {
    key: "automated-invoicing",
    name: "Automated Invoicing",
    description: "Enable automated invoice generation",
    enabled: false,
    defaultValue: false,
  },
  {
    key: "client-portal",
    name: "Client Portal",
    description: "Enable client-facing portal",
    enabled: false,
    defaultValue: false,
    rolloutPercentage: 25,
  },
  {
    key: "advanced-analytics",
    name: "Advanced Analytics",
    description: "Enable advanced analytics dashboard",
    enabled: false,
    defaultValue: false,
    allowedRoles: ["admin", "partner"],
  },
  {
    key: "bulk-document-upload",
    name: "Bulk Document Upload",
    description: "Enable bulk document upload feature",
    enabled: true,
    defaultValue: true,
  },
];

export function initializeDefaultFlags(): void {
  for (const flag of DEFAULT_FLAGS) {
    flagStore.setFlag(flag);
  }
}
