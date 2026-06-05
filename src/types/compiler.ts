export interface TableField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'relation';
  required: boolean;
  primaryKey?: boolean;
  defaultValue?: any;
  relationTable?: string;
  relationField?: string;
  validation?: {
    min?: number;
    max?: number;
    regex?: string;
    options?: string[];
  };
}

export interface DBTable {
  name: string;
  description: string;
  fields: TableField[];
}

export interface DBSchema {
  tables: DBTable[];
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  roleAccess: string[];
  requiresPremium: boolean;
  requestParams?: {
    name: string;
    type: string;
    required: boolean;
  }[];
  requestBody?: {
    name: string;
    type: string;
    required: boolean;
  }[];
  responseBody: {
    fields: {
      name: string;
      type: string;
    }[];
  };
  dbOperations: {
    table: string;
    action: 'select' | 'insert' | 'update' | 'delete';
    conditions?: string;
  }[];
}

export interface APISchema {
  endpoints: APIEndpoint[];
}

export interface UIComponent {
  id: string;
  type: 'stats' | 'table' | 'form' | 'chart' | 'detail' | 'banner';
  title: string;
  width: 'full' | 'half' | 'third';
  config: {
    fields?: {
      name: string;
      label: string;
      type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'email' | 'textarea';
      options?: string[];
      required: boolean;
      placeholder?: string;
    }[];
    columns?: {
      key: string;
      label: string;
      type: 'text' | 'number' | 'badge' | 'date' | 'currency';
    }[];
    statsItems?: {
      label: string;
      valueFormula: string; // e.g. "count(contacts)", "sum(deal_value)"
      icon: string;
    }[];
    chartType?: 'bar' | 'line' | 'pie';
    xAxisKey?: string;
    yAxisKey?: string;
    action?: {
      type: 'api_submit' | 'navigate' | 'modal_form';
      apiEndpoint?: string; // e.g. "POST /api/contacts"
      targetRoute?: string;
      successMessage?: string;
    };
    dataSourceEndpoint?: string; // e.g. "GET /api/contacts"
  };
}

export interface UIPage {
  route: string;
  title: string;
  description: string;
  roleAccess: string[];
  components: UIComponent[];
}

export interface UISchema {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    darkMode: boolean;
  };
  navigation: {
    items: {
      label: string;
      icon: string;
      route: string;
      roleAccess: string[];
    }[];
  };
  pages: UIPage[];
}

export interface AuthPermission {
  role: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | '*';
  granted: boolean;
}

export interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  gatedFeatures: string[]; // component IDs or routes or endpoints
}

export interface AuthSchema {
  roles: string[];
  defaultRole: string;
  permissions: AuthPermission[];
  pricingPlans: PricingPlan[];
}

export interface AppSchema {
  appName: string;
  appDescription: string;
  dbSchema: DBSchema;
  apiSchema: APISchema;
  uiSchema: UISchema;
  authSchema: AuthSchema;
}

// Pipeline and Diagnostic structures
export interface PipelineStageResult {
  stage: 'intent' | 'design' | 'schema' | 'refinement';
  success: boolean;
  duration: number;
  tokensUsed?: number;
  output: string; // Raw output (Markdown or JSON string)
  parsedOutput?: any;
}

export interface DiagnosticIssue {
  severity: 'error' | 'warning';
  category: 'json_parse' | 'structure' | 'consistency' | 'security';
  message: string;
  path: string; // Path in the schema (e.g. "uiSchema.pages[0].components[1].config.dataSourceEndpoint")
  details?: string;
  fixApplied?: boolean;
}

export interface CompilationResult {
  success: boolean;
  schema?: AppSchema;
  stages: PipelineStageResult[];
  diagnostics: DiagnosticIssue[];
  metrics: {
    totalDuration: number;
    totalCost: number;
    retries: number;
  };
  assumptions: string[];
  clarificationsNeeded: string[];
}

export interface EvalTestCase {
  id: string;
  title: string;
  prompt: string;
  type: 'benchmark' | 'edge_case';
  expectedEntities: string[];
  expectedRoles: string[];
}
