export type Locale = "en" | "es" | "fr" | "de" | "zh" | "ja" | "ar";

export interface TranslationEntry {
  [key: string]: string | TranslationEntry;
}

export interface I18nConfig {
  defaultLocale: Locale;
  locales: Locale[];
  fallbackLocale: Locale;
  messages: Record<Locale, TranslationEntry>;
}

export interface I18nInstance {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  tExists: (key: string) => boolean;
  setLocale: (locale: Locale) => void;
  getLocale: () => Locale;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatRelativeTime: (date: Date | string) => string;
  pluralize: (key: string, count: number, params?: Record<string, string | number>) => string;
}

// ─── Default Translations ────────────────────────────────────────────────────

const enMessages: TranslationEntry = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    search: "Search",
    loading: "Loading...",
    error: "An error occurred",
    success: "Success",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    submit: "Submit",
    reset: "Reset",
    close: "Close",
    open: "Open",
    yes: "Yes",
    no: "No",
    all: "All",
    none: "None",
    select: "Select",
    actions: "Actions",
    status: "Status",
    date: "Date",
    name: "Name",
    description: "Description",
    type: "Type",
    amount: "Amount",
    total: "Total",
    details: "Details",
    view: "View",
    download: "Download",
    upload: "Upload",
    export: "Export",
    import: "Import",
    filter: "Filter",
    sort: "Sort",
    refresh: "Refresh",
  },
  nav: {
    dashboard: "Dashboard",
    matters: "Matters",
    clients: "Clients",
    documents: "Documents",
    contracts: "Contracts",
    billing: "Billing",
    settings: "Settings",
    help: "Help",
    notifications: "Notifications",
    profile: "Profile",
    logout: "Logout",
  },
  matter: {
    title: "Matters",
    createMatter: "Create Matter",
    editMatter: "Edit Matter",
    matterName: "Matter Name",
    matterNumber: "Matter Number",
    client: "Client",
    status: "Status",
    priority: "Priority",
    type: "Type",
    openDate: "Open Date",
    closeDate: "Close Date",
    description: "Description",
    budget: "Budget",
    hours: "Hours",
    timeline: "Timeline",
    notes: "Notes",
    assignments: "Assignments",
    noMatters: "No matters found",
  },
  client: {
    title: "Clients",
    createClient: "Create Client",
    editClient: "Edit Client",
    clientName: "Client Name",
    email: "Email",
    phone: "Phone",
    company: "Company",
    address: "Address",
    noClients: "No clients found",
  },
  document: {
    title: "Documents",
    uploadDocument: "Upload Document",
    documentName: "Document Name",
    version: "Version",
    uploadedBy: "Uploaded By",
    uploadedAt: "Uploaded At",
    size: "Size",
    noDocuments: "No documents found",
  },
  billing: {
    title: "Billing",
    invoice: "Invoice",
    invoices: "Invoices",
    createInvoice: "Create Invoice",
    invoiceNumber: "Invoice Number",
    dueDate: "Due Date",
    paid: "Paid",
    unpaid: "Unpaid",
    overdue: "Overdue",
    timeEntry: "Time Entry",
    timeEntries: "Time Entries",
    logTime: "Log Time",
    hours: "Hours",
    rate: "Rate",
    total: "Total",
  },
  contract: {
    title: "Contracts",
    createContract: "Create Contract",
    contractName: "Contract Name",
    parties: "Parties",
    effectiveDate: "Effective Date",
    expirationDate: "Expiration Date",
    clauses: "Clauses",
    status: "Status",
    aiAnalysis: "AI Analysis",
    riskScore: "Risk Score",
    noContracts: "No contracts found",
  },
  auth: {
    login: "Login",
    logout: "Logout",
    register: "Register",
    forgotPassword: "Forgot Password",
    resetPassword: "Reset Password",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    invalidCredentials: "Invalid email or password",
    accountLocked: "Account locked",
  },
};

const esMessages: TranslationEntry = {
  common: {
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    create: "Crear",
    search: "Buscar",
    loading: "Cargando...",
    error: "Ocurrió un error",
    success: "Éxito",
    confirm: "Confirmar",
    back: "Volver",
    next: "Siguiente",
    submit: "Enviar",
    reset: "Restablecer",
    close: "Cerrar",
    open: "Abrir",
    yes: "Sí",
    no: "No",
    all: "Todos",
    none: "Ninguno",
    select: "Seleccionar",
    actions: "Acciones",
    status: "Estado",
    date: "Fecha",
    name: "Nombre",
    description: "Descripción",
    type: "Tipo",
    amount: "Monto",
    total: "Total",
    details: "Detalles",
    view: "Ver",
    download: "Descargar",
    upload: "Subir",
    export: "Exportar",
    import: "Importar",
    filter: "Filtrar",
    sort: "Ordenar",
    refresh: "Actualizar",
  },
  nav: {
    dashboard: "Panel",
    matters: "Asuntos",
    clients: "Clientes",
    documents: "Documentos",
    contracts: "Contratos",
    billing: "Facturación",
    settings: "Configuración",
    help: "Ayuda",
    notifications: "Notificaciones",
    profile: "Perfil",
    logout: "Cerrar sesión",
  },
  matter: {
    title: "Asuntos",
    createMatter: "Crear Asunto",
    editMatter: "Editar Asunto",
    matterName: "Nombre del Asunto",
    matterNumber: "Número de Asunto",
    client: "Cliente",
    status: "Estado",
    priority: "Prioridad",
    type: "Tipo",
    openDate: "Fecha de Apertura",
    closeDate: "Fecha de Cierre",
    description: "Descripción",
    budget: "Presupuesto",
    hours: "Horas",
    timeline: "Cronograma",
    notes: "Notas",
    assignments: "Asignaciones",
    noMatters: "No se encontraron asuntos",
  },
};

// ─── I18n Implementation ─────────────────────────────────────────────────────

function getNestedValue(obj: TranslationEntry, path: string): string | undefined {
  const keys = path.split(".");
  let current: TranslationEntry | string = obj;

  for (const key of keys) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as TranslationEntry)[key] as TranslationEntry | string;
    if (current === undefined) return undefined;
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{{${key}}}`;
  });
}

export function createI18n(config: I18nConfig): I18nInstance {
  let currentLocale = config.defaultLocale;

  function t(key: string, params?: Record<string, string | number>): string {
    const messages = config.messages[currentLocale] ?? config.messages[config.fallbackLocale];
    let value = getNestedValue(messages, key);

    if (value === undefined) {
      const fallbackMessages = config.messages[config.fallbackLocale];
      value = getNestedValue(fallbackMessages, key);
    }

    if (value === undefined) {
      return key;
    }

    return params ? interpolate(value, params) : value;
  }

  function tExists(key: string): boolean {
    const messages = config.messages[currentLocale] ?? config.messages[config.fallbackLocale];
    return getNestedValue(messages, key) !== undefined;
  }

  function setLocale(locale: Locale): void {
    if (config.locales.includes(locale)) {
      currentLocale = locale;
    }
  }

  function getLocale(): Locale {
    return currentLocale;
  }

  function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(currentLocale, options).format(value);
  }

  function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(currentLocale, options).format(d);
  }

  function formatCurrency(value: number, currency = "USD"): string {
    return new Intl.NumberFormat(currentLocale, {
      style: "currency",
      currency,
    }).format(value);
  }

  function formatRelativeTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: "auto" });

    if (diffSec < 60) return rtf.format(-diffSec, "second");
    if (diffMin < 60) return rtf.format(-diffMin, "minute");
    if (diffHr < 24) return rtf.format(-diffHr, "hour");
    if (diffDay < 7) return rtf.format(-diffDay, "day");
    if (diffDay < 30) return rtf.format(-Math.floor(diffDay / 7), "week");
    if (diffDay < 365) return rtf.format(-Math.floor(diffDay / 30), "month");
    return rtf.format(-Math.floor(diffDay / 365), "year");
  }

  function pluralize(
    key: string,
    count: number,
    params?: Record<string, string | number>
  ): string {
    const pluralKey = count === 1 ? `${key}_singular` : `${key}_plural`;
    return t(pluralKey, { count, ...params });
  }

  return {
    t,
    tExists,
    setLocale,
    getLocale,
    formatNumber,
    formatDate,
    formatCurrency,
    formatRelativeTime,
    pluralize,
  };
}

// ─── Singleton Instance ──────────────────────────────────────────────────────

const defaultConfig: I18nConfig = {
  defaultLocale: "en",
  locales: ["en", "es"],
  fallbackLocale: "en",
  messages: {
    en: enMessages,
    es: esMessages,
  } as Record<Locale, TranslationEntry>,
};

let i18nInstance: I18nInstance | null = null;

export function getI18n(): I18nInstance {
  if (!i18nInstance) {
    i18nInstance = createI18n(defaultConfig);
  }
  return i18nInstance;
}

export function configureI18n(config: I18nConfig): I18nInstance {
  i18nInstance = createI18n(config);
  return i18nInstance;
}
