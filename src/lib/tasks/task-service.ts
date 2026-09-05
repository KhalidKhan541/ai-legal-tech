import { z } from "zod";

// ─── Enums & Types ──────────────────────────────────────────────────────────

export const TaskStatus = z.enum([
  "todo",
  "in_progress",
  "in_review",
  "blocked",
  "completed",
  "cancelled",
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskPriority = z.enum(["low", "medium", "high", "urgent"]);
export type TaskPriority = z.infer<typeof TaskPriority>;

export const TaskCategory = z.enum([
  "research",
  "drafting",
  "review",
  "filing",
  "discovery",
  "client_communication",
  "court_preparation",
  "administrative",
  "billing",
  "other",
]);
export type TaskCategory = z.infer<typeof TaskCategory>;

export const RepeatInterval = z.enum([
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
]);
export type RepeatInterval = z.infer<typeof RepeatInterval>;

// ─── Schemas ────────────────────────────────────────────────────────────────

export const TaskDependencySchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  dependsOnTaskId: z.string().uuid(),
  type: z.enum(["finish_to_start", "start_to_start", "finish_to_finish"]).default("finish_to_start"),
  createdAt: z.string().datetime(),
});

export type TaskDependency = z.infer<typeof TaskDependencySchema>;

export const TaskReminderSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  type: z.enum(["email", "push", "sms"]),
  minutesBefore: z.number().min(0),
  sent: z.boolean().default(false),
  sentAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type TaskReminder = z.infer<typeof TaskReminderSchema>;

export const TaskCommentSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  authorId: z.string().uuid(),
  authorName: z.string(),
  content: z.string().min(1),
  attachments: z
    .array(
      z.object({
        id: z.string().uuid(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
      })
    )
    .default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TaskComment = z.infer<typeof TaskCommentSchema>;

export const TaskTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: TaskCategory,
  defaultPriority: TaskPriority,
  estimatedHours: z.number().min(0).optional(),
  checklist: z
    .array(
      z.object({
        id: z.string().uuid(),
        text: z.string().min(1),
        isRequired: z.boolean().default(false),
      })
    )
    .default([]),
  tags: z.array(z.string()).default([]),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TaskTemplate = z.infer<typeof TaskTemplateSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  taskNumber: z.string(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: TaskStatus,
  priority: TaskPriority,
  category: TaskCategory,
  matterId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  assignedToName: z.string().optional(),
  createdBy: z.string().uuid(),
  createdByName: z.string(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).default(0),
  billableHours: z.number().min(0).default(0),
  isBillable: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  dependencies: z.array(TaskDependencySchema).default([]),
  reminders: z.array(TaskReminderSchema).default([]),
  comments: z.array(TaskCommentSchema).default([]),
  checklist: z
    .array(
      z.object({
        id: z.string().uuid(),
        text: z.string(),
        isCompleted: z.boolean().default(false),
        completedAt: z.string().datetime().optional(),
        completedBy: z.string().uuid().optional(),
      })
    )
    .default([]),
  templateId: z.string().uuid().optional(),
  parentTaskId: z.string().uuid().optional(),
  subtasks: z.array(z.string().uuid()).default([]),
  isRecurring: z.boolean().default(false),
  recurrence: z
    .object({
      interval: RepeatInterval,
      every: z.number().min(1).default(1),
      endDate: z.string().datetime().optional(),
      count: z.number().min(1).optional(),
    })
    .optional(),
  customFields: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = TaskSchema.omit({
  id: true,
  taskNumber: true,
  createdAt: true,
  updatedAt: true,
  dependencies: true,
  reminders: true,
  comments: true,
  checklist: true,
  subtasks: true,
  actualHours: true,
  billableHours: true,
  completedAt: true,
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = TaskSchema.partial().omit({
  id: true,
  taskNumber: true,
  createdAt: true,
  createdBy: true,
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const TaskFilterSchema = z.object({
  status: z.array(TaskStatus).optional(),
  priority: z.array(TaskPriority).optional(),
  category: z.array(TaskCategory).optional(),
  matterId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  isBillable: z.boolean().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  startDateFrom: z.string().datetime().optional(),
  startDateTo: z.string().datetime().optional(),
  overdue: z.boolean().optional(),
  hasDependencies: z.boolean().optional(),
  sortBy: z
    .enum([
      "title",
      "status",
      "priority",
      "dueDate",
      "createdAt",
      "updatedAt",
      "estimatedHours",
    ])
    .default("dueDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type TaskFilter = z.infer<typeof TaskFilterSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaskStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByCategory: Record<TaskCategory, number>;
  averageCompletionTimeHours: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  totalBillableHours: number;
}

export interface KanbanBoard {
  columns: {
    status: TaskStatus;
    title: string;
    tasks: Task[];
    count: number;
  }[];
  totalTasks: number;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

let tasks: Task[] = [];
let templates: TaskTemplate[] = [];
let taskCounter = 1;

function generateId(): string {
  return crypto.randomUUID();
}

function generateTaskNumber(): string {
  const year = new Date().getFullYear();
  const num = String(taskCounter++).padStart(5, "0");
  return `TSK-${year}-${num}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Task Service ───────────────────────────────────────────────────────────

export const TaskService = {
  /**
   * Create a new task
   */
  create(input: CreateTaskInput, userId: string, userName: string): Task {
    const validated = CreateTaskSchema.parse(input);

    const task: Task = {
      ...validated,
      id: generateId(),
      taskNumber: generateTaskNumber(),
      status: validated.status ?? "todo",
      createdBy: userId,
      createdByName: userName,
      createdAt: now(),
      updatedAt: now(),
      dependencies: [],
      reminders: [],
      comments: [],
      checklist: [],
      subtasks: [],
      actualHours: 0,
      billableHours: 0,
    };

    tasks.push(task);
    return task;
  },

  /**
   * Get task by ID
   */
  getById(id: string): Task | undefined {
    return tasks.find((t) => t.id === id);
  },

  /**
   * Get task by task number
   */
  getByTaskNumber(taskNumber: string): Task | undefined {
    return tasks.find((t) => t.taskNumber === taskNumber);
  },

  /**
   * Update task
   */
  update(
    id: string,
    input: UpdateTaskInput,
    userId: string
  ): Task | undefined {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    const validated = UpdateTaskSchema.parse(input);
    const previous = { ...tasks[index] };

    tasks[index] = {
      ...tasks[index],
      ...validated,
      updatedAt: now(),
    };

    // Handle status change
    if (validated.status && validated.status !== previous.status) {
      if (validated.status === "completed") {
        tasks[index].completedAt = now();
      } else if (previous.status === "completed") {
        tasks[index].completedAt = undefined;
      }
    }

    return tasks[index];
  },

  /**
   * Delete task
   */
  delete(id: string, userId: string): boolean {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;

    const task = tasks[index];

    // Remove from parent task's subtasks
    if (task.parentTaskId) {
      const parentTask = tasks.find((t) => t.id === task.parentTaskId);
      if (parentTask) {
        parentTask.subtasks = parentTask.subtasks.filter((st) => st !== id);
        parentTask.updatedAt = now();
      }
    }

    // Delete subtasks
    for (const subtaskId of task.subtasks) {
      const subtaskIndex = tasks.findIndex((t) => t.id === subtaskId);
      if (subtaskIndex !== -1) {
        tasks.splice(subtaskIndex, 1);
      }
    }

    // Remove dependencies referencing this task
    for (const otherTask of tasks) {
      otherTask.dependencies = otherTask.dependencies.filter(
        (dep) => dep.taskId !== id && dep.dependsOnTaskId !== id
      );
    }

    tasks.splice(index, 1);
    return true;
  },

  /**
   * Transition task status
   */
  transitionStatus(
    id: string,
    targetStatus: TaskStatus,
    userId: string
  ): Task {
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    // Validate status transition
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      todo: ["in_progress", "cancelled"],
      in_progress: ["in_review", "blocked", "completed", "cancelled"],
      in_review: ["in_progress", "completed", "cancelled"],
      blocked: ["in_progress", "cancelled"],
      completed: ["in_progress"],
      cancelled: ["todo"],
    };

    if (!validTransitions[task.status]?.includes(targetStatus)) {
      throw new Error(
        `Invalid status transition from ${task.status} to ${targetStatus}`
      );
    }

    // Check dependencies for in_progress
    if (targetStatus === "in_progress") {
      const incompleteDependencies = task.dependencies.filter((dep) => {
        const dependentTask = tasks.find((t) => t.id === dep.dependsOnTaskId);
        return dependentTask && dependentTask.status !== "completed";
      });

      if (incompleteDependencies.length > 0) {
        throw new Error(
          "Cannot start task with incomplete dependencies"
        );
      }
    }

    task.status = targetStatus;
    task.updatedAt = now();

    if (targetStatus === "completed") {
      task.completedAt = now();
    } else if (targetStatus !== "completed" && task.completedAt) {
      task.completedAt = undefined;
    }

    return task;
  },

  /**
   * Assign task
   */
  assign(
    id: string,
    assigneeId: string,
    assigneeName: string,
    userId: string
  ): Task | undefined {
    const task = tasks.find((t) => t.id === id);
    if (!task) return undefined;

    task.assignedTo = assigneeId;
    task.assignedToName = assigneeName;
    task.updatedAt = now();
    return task;
  },

  /**
   * Unassign task
   */
  unassign(id: string, userId: string): Task | undefined {
    const task = tasks.find((t) => t.id === id);
    if (!task) return undefined;

    task.assignedTo = undefined;
    task.assignedToName = undefined;
    task.updatedAt = now();
    return task;
  },

  /**
   * Add dependency
   */
  addDependency(
    taskId: string,
    dependsOnTaskId: string,
    type: TaskDependency["type"] = "finish_to_start"
  ): TaskDependency {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const dependentTask = tasks.find((t) => t.id === dependsOnTaskId);
    if (!dependentTask) {
      throw new Error(`Dependent task not found: ${dependsOnTaskId}`);
    }

    // Check for circular dependencies
    if (taskId === dependsOnTaskId) {
      throw new Error("Task cannot depend on itself");
    }

    // Check if adding this dependency would create a cycle
    const visited = new Set<string>();
    const queue = [dependsOnTaskId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === taskId) {
        throw new Error("Adding this dependency would create a circular reference");
      }
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentTask = tasks.find((t) => t.id === currentId);
      if (currentTask) {
        for (const dep of currentTask.dependencies) {
          queue.push(dep.dependsOnTaskId);
        }
      }
    }

    // Check if dependency already exists
    const existing = task.dependencies.find(
      (d) => d.dependsOnTaskId === dependsOnTaskId
    );
    if (existing) {
      throw new Error("Dependency already exists");
    }

    const dependency: TaskDependency = {
      id: generateId(),
      taskId,
      dependsOnTaskId,
      type,
      createdAt: now(),
    };

    task.dependencies.push(dependency);
    task.updatedAt = now();
    return dependency;
  },

  /**
   * Remove dependency
   */
  removeDependency(taskId: string, dependencyId: string): boolean {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return false;

    const index = task.dependencies.findIndex((d) => d.id === dependencyId);
    if (index === -1) return false;

    task.dependencies.splice(index, 1);
    task.updatedAt = now();
    return true;
  },

  /**
   * Add comment
   */
  addComment(
    taskId: string,
    authorId: string,
    authorName: string,
    content: string
  ): TaskComment {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const comment: TaskComment = {
      id: generateId(),
      taskId,
      authorId,
      authorName,
      content,
      createdAt: now(),
      updatedAt: now(),
    };

    task.comments.push(comment);
    task.updatedAt = now();
    return comment;
  },

  /**
   * Update comment
   */
  updateComment(
    taskId: string,
    commentId: string,
    content: string,
    userId: string
  ): TaskComment | undefined {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    const comment = task.comments.find((c) => c.id === commentId);
    if (!comment) return undefined;

    if (comment.authorId !== userId) {
      throw new Error("Only the comment author can edit the comment");
    }

    comment.content = content;
    comment.updatedAt = now();
    task.updatedAt = now();
    return comment;
  },

  /**
   * Delete comment
   */
  deleteComment(taskId: string, commentId: string, userId: string): boolean {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return false;

    const index = task.comments.findIndex((c) => c.id === commentId);
    if (index === -1) return false;

    const comment = task.comments[index];
    if (comment.authorId !== userId) {
      throw new Error("Only the comment author can delete the comment");
    }

    task.comments.splice(index, 1);
    task.updatedAt = now();
    return true;
  },

  /**
   * Add checklist item
   */
  addChecklistItem(
    taskId: string,
    text: string,
    isRequired: boolean = false
  ): Task["checklist"][0] {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const item = {
      id: generateId(),
      text,
      isCompleted: false,
    };

    task.checklist.push(item);
    task.updatedAt = now();
    return item;
  },

  /**
   * Toggle checklist item
   */
  toggleChecklistItem(
    taskId: string,
    itemId: string,
    userId: string
  ): Task | undefined {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    const item = task.checklist.find((i) => i.id === itemId);
    if (!item) return undefined;

    item.isCompleted = !item.isCompleted;
    item.completedAt = item.isCompleted ? now() : undefined;
    item.completedBy = item.isCompleted ? userId : undefined;
    task.updatedAt = now();
    return task;
  },

  /**
   * Remove checklist item
   */
  removeChecklistItem(taskId: string, itemId: string): boolean {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return false;

    const index = task.checklist.findIndex((i) => i.id === itemId);
    if (index === -1) return false;

    task.checklist.splice(index, 1);
    task.updatedAt = now();
    return true;
  },

  /**
   * Create subtask
   */
  createSubtask(
    parentTaskId: string,
    input: CreateTaskInput,
    userId: string,
    userName: string
  ): Task {
    const parentTask = tasks.find((t) => t.id === parentTaskId);
    if (!parentTask) {
      throw new Error(`Parent task not found: ${parentTaskId}`);
    }

    const subtask = TaskService.create(
      { ...input, parentTaskId },
      userId,
      userName
    );

    parentTask.subtasks.push(subtask.id);
    parentTask.updatedAt = now();
    return subtask;
  },

  /**
   * Log time against task
   */
  logTime(
    taskId: string,
    hours: number,
    isBillable: boolean = false
  ): Task | undefined {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    task.actualHours += hours;
    if (isBillable) {
      task.billableHours += hours;
    }
    task.updatedAt = now();
    return task;
  },

  /**
   * Add reminder
   */
  addReminder(
    taskId: string,
    type: TaskReminder["type"],
    minutesBefore: number
  ): TaskReminder {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const reminder: TaskReminder = {
      id: generateId(),
      taskId,
      type,
      minutesBefore,
      sent: false,
      createdAt: now(),
    };

    task.reminders.push(reminder);
    return reminder;
  },

  /**
   * Remove reminder
   */
  removeReminder(taskId: string, reminderId: string): boolean {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return false;

    const index = task.reminders.findIndex((r) => r.id === reminderId);
    if (index === -1) return false;

    task.reminders.splice(index, 1);
    return true;
  },

  /**
   * Create task from template
   */
  createFromTemplate(
    templateId: string,
    matterId: string | undefined,
    userId: string,
    userName: string,
    overrides?: Partial<CreateTaskInput>
  ): Task {
    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const taskInput: CreateTaskInput = {
      title: template.name,
      description: template.description,
      category: template.category,
      priority: template.defaultPriority,
      matterId,
      estimatedHours: template.estimatedHours,
      tags: [...template.tags],
      isBillable: true,
      templateId: template.id,
      ...overrides,
    };

    const task = TaskService.create(taskInput, userId, userName);

    // Add checklist items from template
    for (const item of template.checklist) {
      TaskService.addChecklistItem(task.id, item.text, item.isRequired);
    }

    return task;
  },

  /**
   * Create task template
   */
  createTemplate(
    input: Omit<TaskTemplate, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): TaskTemplate {
    const template: TaskTemplate = {
      ...input,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };

    templates.push(template);
    return template;
  },

  /**
   * Update task template
   */
  updateTemplate(
    id: string,
    updates: Partial<Omit<TaskTemplate, "id" | "createdAt" | "updatedAt">>
  ): TaskTemplate | undefined {
    const index = templates.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: now(),
    };

    return templates[index];
  },

  /**
   * Delete task template
   */
  deleteTemplate(id: string): boolean {
    const index = templates.findIndex((t) => t.id === id);
    if (index === -1) return false;

    templates.splice(index, 1);
    return true;
  },

  /**
   * Get templates
   */
  getTemplates(): TaskTemplate[] {
    return [...templates];
  },

  /**
   * Search and filter tasks
   */
  search(filter: TaskFilter): PaginatedResult<Task> {
    const validated = TaskFilterSchema.parse(filter);
    let filtered = [...tasks];

    // Status filter
    if (validated.status?.length) {
      filtered = filtered.filter((t) => validated.status!.includes(t.status));
    }

    // Priority filter
    if (validated.priority?.length) {
      filtered = filtered.filter((t) =>
        validated.priority!.includes(t.priority)
      );
    }

    // Category filter
    if (validated.category?.length) {
      filtered = filtered.filter((t) =>
        validated.category!.includes(t.category)
      );
    }

    // Matter filter
    if (validated.matterId) {
      filtered = filtered.filter((t) => t.matterId === validated.matterId);
    }

    // Client filter
    if (validated.clientId) {
      filtered = filtered.filter((t) => t.clientId === validated.clientId);
    }

    // Assignee filter
    if (validated.assignedTo) {
      filtered = filtered.filter((t) => t.assignedTo === validated.assignedTo);
    }

    // Creator filter
    if (validated.createdBy) {
      filtered = filtered.filter((t) => t.createdBy === validated.createdBy);
    }

    // Tags filter
    if (validated.tags?.length) {
      filtered = filtered.filter((t) =>
        validated.tags!.some((tag) => t.tags.includes(tag))
      );
    }

    // Text search
    if (validated.search) {
      const term = validated.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term) ||
          t.taskNumber.toLowerCase().includes(term)
      );
    }

    // Billable filter
    if (validated.isBillable !== undefined) {
      filtered = filtered.filter((t) => t.isBillable === validated.isBillable);
    }

    // Due date range filters
    if (validated.dueDateFrom) {
      filtered = filtered.filter(
        (t) => t.dueDate && new Date(t.dueDate) >= new Date(validated.dueDateFrom!)
      );
    }
    if (validated.dueDateTo) {
      filtered = filtered.filter(
        (t) => t.dueDate && new Date(t.dueDate) <= new Date(validated.dueDateTo!)
      );
    }

    // Start date range filters
    if (validated.startDateFrom) {
      filtered = filtered.filter(
        (t) =>
          t.startDate && new Date(t.startDate) >= new Date(validated.startDateFrom!)
      );
    }
    if (validated.startDateTo) {
      filtered = filtered.filter(
        (t) =>
          t.startDate && new Date(t.startDate) <= new Date(validated.startDateTo!)
      );
    }

    // Overdue filter
    if (validated.overdue) {
      const nowDate = new Date();
      filtered = filtered.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < nowDate &&
          t.status !== "completed" &&
          t.status !== "cancelled"
      );
    }

    // Dependencies filter
    if (validated.hasDependencies !== undefined) {
      filtered = filtered.filter((t) =>
        validated.hasDependencies
          ? t.dependencies.length > 0
          : t.dependencies.length === 0
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (validated.sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "priority": {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case "dueDate":
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else
            comparison =
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case "estimatedHours":
          comparison =
            (a.estimatedHours ?? 0) - (b.estimatedHours ?? 0);
          break;
      }
      return validated.sortOrder === "asc" ? comparison : -comparison;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / validated.limit);
    const start = (validated.page - 1) * validated.limit;
    const items = filtered.slice(start, start + validated.limit);

    return { items, total, page: validated.page, limit: validated.limit, totalPages };
  },

  /**
   * Get tasks by assignee
   */
  getByAssignee(userId: string): Task[] {
    return tasks
      .filter((t) => t.assignedTo === userId && t.status !== "completed" && t.status !== "cancelled")
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  },

  /**
   * Get overdue tasks
   */
  getOverdue(): Task[] {
    const nowDate = new Date();
    return tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < nowDate &&
        t.status !== "completed" &&
        t.status !== "cancelled"
    );
  },

  /**
   * Get Kanban board view
   */
  getKanbanBoard(matterId?: string): KanbanBoard {
    const statuses: TaskStatus[] = ["todo", "in_progress", "in_review", "blocked", "completed"];
    const statusTitles: Record<TaskStatus, string> = {
      todo: "To Do",
      in_progress: "In Progress",
      in_review: "In Review",
      blocked: "Blocked",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    let filteredTasks = matterId
      ? tasks.filter((t) => t.matterId === matterId)
      : tasks;

    // Exclude cancelled tasks from kanban
    filteredTasks = filteredTasks.filter((t) => t.status !== "cancelled");

    const columns = statuses.map((status) => {
      const statusTasks = filteredTasks
        .filter((t) => t.status === status)
        .sort((a, b) => {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

      return {
        status,
        title: statusTitles[status],
        tasks: statusTasks,
        count: statusTasks.length,
      };
    });

    return {
      columns,
      totalTasks: filteredTasks.length,
    };
  },

  /**
   * Get task statistics
   */
  getStats(matterId?: string): TaskStats {
    const filteredTasks = matterId
      ? tasks.filter((t) => t.matterId === matterId)
      : tasks;

    const tasksByStatus = {} as Record<TaskStatus, number>;
    const tasksByPriority = {} as Record<TaskPriority, number>;
    const tasksByCategory = {} as Record<TaskCategory, number>;

    for (const status of Object.values(TaskStatus.enum)) {
      tasksByStatus[status] = 0;
    }
    for (const priority of Object.values(TaskPriority.enum)) {
      tasksByPriority[priority] = 0;
    }
    for (const category of Object.values(TaskCategory.enum)) {
      tasksByCategory[category] = 0;
    }

    let totalEstimatedHours = 0;
    let totalActualHours = 0;
    let totalBillableHours = 0;
    let completedCount = 0;
    let totalCompletionTimeMs = 0;
    const nowDate = new Date();

    for (const task of filteredTasks) {
      tasksByStatus[task.status]++;
      tasksByPriority[task.priority]++;
      tasksByCategory[task.category]++;

      if (task.estimatedHours) totalEstimatedHours += task.estimatedHours;
      totalActualHours += task.actualHours;
      totalBillableHours += task.billableHours;

      if (task.status === "completed" && task.completedAt) {
        completedCount++;
        totalCompletionTimeMs +=
          new Date(task.completedAt).getTime() -
          new Date(task.createdAt).getTime();
      }
    }

    const overdueTasks = filteredTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < nowDate &&
        t.status !== "completed" &&
        t.status !== "cancelled"
    ).length;

    return {
      totalTasks: filteredTasks.length,
      activeTasks: filteredTasks.filter(
        (t) =>
          t.status !== "completed" && t.status !== "cancelled"
      ).length,
      completedTasks: completedCount,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
      tasksByCategory,
      averageCompletionTimeHours:
        completedCount > 0
          ? totalCompletionTimeMs / completedCount / (1000 * 60 * 60)
          : 0,
      totalEstimatedHours,
      totalActualHours,
      totalBillableHours,
    };
  },

  /**
   * Reset store (for testing)
   */
  _reset(): void {
    tasks = [];
    templates = [];
    taskCounter = 1;
  },
};
