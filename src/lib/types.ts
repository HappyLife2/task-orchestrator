/* eslint-disable @typescript-eslint/no-explicit-any */
// Type definitions for all Monday.com modules
// Centralized types for use across the application

// ============================================================================
// CORE TYPES
// ============================================================================

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TaskState = 'ACTIVE' | 'ARCHIVED';
export type ViewType = 'table' | 'kanban' | 'calendar' | 'timeline' | 'chart' | 'map' | 'form' | 'files';
export type WidgetType = 'chart' | 'number' | 'battery' | 'timeline' | 'boardView' | 'text';
export type ResourceType = 'workspace' | 'board' | 'dashboard' | 'task' | 'document';

// ============================================================================
// COLUMN TYPES
// ============================================================================

export type ColumnType =
  | 'status'
  | 'person'
  | 'date'
  | 'timeline'
  | 'numbers'
  | 'text'
  | 'long-text'
  | 'formula'
  | 'files'
  | 'link'
  | 'dependency'
  | 'dropdown'
  | 'checkbox'
  | 'rating'
  | 'color'
  | 'location'
  | 'phone'
  | 'email'
  | 'time-tracking';

export interface ColumnSettings {
  status?: {
    labels: Record<string, string>; // label -> color
  };
  person?: {
    allowMultiple?: boolean;
  };
  timeline?: {
    showDuration?: boolean;
  };
  numbers?: {
    format?: 'number' | 'currency' | 'percentage';
    currency?: string;
    decimals?: number;
  };
  dropdown?: {
    options: string[];
    allowMultiple?: boolean;
  };
  rating?: {
    maxRating?: number;
    icon?: 'star' | 'heart' | 'thumbs';
  };
  formula?: {
    expression: string;
  };
}

export interface BoardColumn {
  id: string;
  type: ColumnType;
  title: string;
  width?: number;
  locked?: boolean;
  hidden?: boolean;
  settings?: ColumnSettings;
}

// ============================================================================
// BOARD & GROUP TYPES
// ============================================================================

export interface Group {
  id: string;
  boardId: string;
  title: string;
  color?: string;
  position: number;
  collapsed: boolean;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  departmentId: string;
  columns: BoardColumn[];
  groups?: Group[];
  views?: BoardView[];
  department?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TASK TYPES
// ============================================================================

export interface Task {
  id: string;
  name: string;
  state: TaskState;
  boardId: string;
  groupId?: string;
  assignedUserId?: string;
  description?: string;
  columnValues: string; // JSON string
  parsedValues: Record<string, any>; // Parsed column values
  position: number;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  creator?: {
    id: string;
    name: string;
  };
  parentTaskId?: string;
  subTasks?: Task[];
  _count?: {
    updates: number;
    subTasks: number;
    timeEntries: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// VIEW TYPES
// ============================================================================

export interface ViewFilter {
  columnId: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
}

export interface ViewSort {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface ViewGrouping {
  columnId?: string;
  collapsed?: boolean;
}

export interface ViewSettings {
  filters?: ViewFilter[];
  sorting?: ViewSort[];
  grouping?: ViewGrouping;
  hiddenColumns?: string[];
  kanban?: {
    groupByColumn: string;
  };
  calendar?: {
    dateColumn: string;
    viewMode: 'month' | 'week' | 'day';
  };
  timeline?: {
    startColumn: string;
    endColumn: string;
    showDependencies?: boolean;
  };
  chart?: {
    type: 'pie' | 'bar' | 'line' | 'area';
    dataColumn: string;
    labelColumn?: string;
  };
}

export interface BoardView {
  id: string;
  boardId: string;
  name: string;
  type: ViewType;
  settings: ViewSettings;
  position: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface WidgetConfig {
  chart?: {
    type: 'pie' | 'bar' | 'line' | 'area' | 'funnel';
    boardId?: string;
    dataColumn?: string;
    labelColumn?: string;
  };
  number?: {
    boardId?: string;
    aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
    columnId?: string;
    filter?: ViewFilter[];
  };
  battery?: {
    boardId?: string;
    statusColumn: string;
    total?: number;
  };
  boardView?: {
    boardId: string;
    viewId?: string;
  };
  text?: {
    content: string;
  };
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Dashboard {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  layout: any[]; // Grid layout config
  widgets?: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// AUTOMATION TYPES
// ============================================================================

export interface AutomationTrigger {
  type: 'status_change' | 'date_arrives' | 'item_created' | 'column_changed' | 'recurring';
  columnId?: string;
  fromValue?: any;
  toValue?: any;
  offset?: number; // days before/after for date_arrives
  schedule?: string; // cron expression for recurring
  groupId?: string;
}

export interface AutomationCondition {
  columnId: string;
  operator: 'equals' | 'contains' | 'greater' | 'less';
  value: any;
}

export interface AutomationAction {
  type: 'notify_someone' | 'change_status' | 'create_item' | 'send_email' | 'webhook' | 'assign_person';
  userId?: string;
  columnId?: string;
  value?: any;
  message?: string;
  groupId?: string;
  template?: Record<string, any>;
  email?: {
    to: string;
    subject: string;
    body: string;
  };
  webhook?: {
    url: string;
    payload: Record<string, any>;
  };
}

export interface Automation {
  id: string;
  boardId: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface Template {
  id: string;
  boardId?: string;
  name: string;
  description?: string;
  category?: string;
  isPublic: boolean;
  config: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    columns: BoardColumn[];
    groups: Omit<Group, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>[];
    sampleTasks?: Partial<Task>[];
  };
  thumbnail?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// WORKFORM TYPES
// ============================================================================

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'file';
  label: string;
  columnId?: string; // Map to board column
  required?: boolean;
  placeholder?: string;
  options?: string[]; // For dropdown
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface WorkformSettings {
  thankYouMessage?: string;
  submitButtonText?: string;
  allowMultiple?: boolean;
  requireAuth?: boolean;
  redirectUrl?: string;
}

export interface Workform {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  boardId?: string;
  fields: FormField[];
  settings: WorkformSettings;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// COLLABORATION TYPES
// ============================================================================

export interface Update {
  id: string;
  taskId: string;
  userId: string;
  content: string; // HTML
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  parentId?: string;
  replies?: Update[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'assignment' | 'update' | 'automation';
  title: string;
  content?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  description?: string;
  isBillable: boolean;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export interface Permission {
  id: string;
  userId: string;
  resourceType: ResourceType;
  resourceId: string;
  role: UserRole;
  settings: {
    canEditColumns?: boolean;
    canDeleteItems?: boolean;
    canManageAutomations?: boolean;
    canExport?: boolean;
    canInvite?: boolean;
  };
  createdAt: string;
}
