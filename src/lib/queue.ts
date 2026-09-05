export interface QueueJob<T = unknown> {
  id: string;
  data: T;
  status: "pending" | "processing" | "completed" | "failed" | "delayed";
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  processedAt?: number;
  completedAt?: number;
  failedAt?: number;
  error?: string;
  delay?: number;
}

export interface QueueOptions {
  maxRetries?: number;
  retryDelay?: number;
  concurrency?: number;
  removeOnComplete?: boolean;
  defaultDelay?: number;
}

export interface JobHandler<T = unknown> {
  (job: QueueJob<T>): Promise<void>;
}

export class Queue<TData = unknown> {
  private jobs: QueueJob<TData>[] = [];
  private handlers = new Map<string, JobHandler<TData>>();
  private processing = new Set<string>();
  private options: Required<QueueOptions>;
  private name: string;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(name: string, options: QueueOptions = {}) {
    this.name = name;
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      concurrency: options.concurrency ?? 1,
      removeOnComplete: options.removeOnComplete ?? true,
      defaultDelay: options.defaultDelay ?? 0,
    };
  }

  on(event: string, handler: JobHandler<TData>): void {
    this.handlers.set(event, handler);
  }

  async add(data: TData, options?: { delay?: number; jobId?: string }): Promise<QueueJob<TData>> {
    const job: QueueJob<TData> = {
      id: options?.jobId ?? crypto.randomUUID(),
      data,
      status: options?.delay ? "delayed" : "pending",
      attempts: 0,
      maxAttempts: this.options.maxRetries,
      createdAt: Date.now(),
      delay: options?.delay,
    };

    this.jobs.push(job);
    this.emit("job:added", job);

    if (!options?.delay) {
      this.processNext();
    }

    return job;
  }

  async processNext(): Promise<void> {
    if (this.processing.size >= this.options.concurrency) return;

    const pendingJob = this.jobs.find(
      (j) =>
        j.status === "pending" &&
        !this.processing.has(j.id)
    );

    if (!pendingJob) {
      const delayedJob = this.jobs.find(
        (j) =>
          j.status === "delayed" &&
          j.delay &&
          Date.now() >= j.createdAt + j.delay
      );
      if (delayedJob) {
        delayedJob.status = "pending";
        this.processNext();
      }
      return;
    }

    this.processing.add(pendingJob.id);
    pendingJob.status = "processing";
    pendingJob.attempts++;
    pendingJob.processedAt = Date.now();

    try {
      const handler = this.handlers.get("process");
      if (handler) {
        await handler(pendingJob);
      }
      pendingJob.status = "completed";
      pendingJob.completedAt = Date.now();
      this.emit("job:completed", pendingJob);

      if (this.options.removeOnComplete) {
        this.jobs = this.jobs.filter((j) => j.id !== pendingJob.id);
      }
    } catch (error) {
      pendingJob.error = error instanceof Error ? error.message : String(error);

      if (pendingJob.attempts < pendingJob.maxAttempts) {
        pendingJob.status = "pending";
        setTimeout(
          () => this.processNext(),
          this.options.retryDelay * pendingJob.attempts
        );
      } else {
        pendingJob.status = "failed";
        pendingJob.failedAt = Date.now();
        this.emit("job:failed", pendingJob);
      }
    } finally {
      this.processing.delete(pendingJob.id);
      this.processNext();
    }
  }

  getJob(id: string): QueueJob<TData> | undefined {
    return this.jobs.find((j) => j.id === id);
  }

  getJobs(status?: QueueJob<TData>["status"]): QueueJob<TData>[] {
    if (!status) return [...this.jobs];
    return this.jobs.filter((j) => j.status === status);
  }

  async removeJob(id: string): Promise<boolean> {
    const idx = this.jobs.findIndex((j) => j.id === id);
    if (idx === -1) return false;
    this.jobs.splice(idx, 1);
    return true;
  }

  async retryJob(id: string): Promise<boolean> {
    const job = this.jobs.find((j) => j.id === id);
    if (!job || job.status !== "failed") return false;
    job.status = "pending";
    job.attempts = 0;
    job.error = undefined;
    this.processNext();
    return true;
  }

  async pause(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async resume(): Promise<void> {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.processNext(), 100);
    }
  }

  getStats(): { pending: number; processing: number; completed: number; failed: number; delayed: number } {
    return {
      pending: this.jobs.filter((j) => j.status === "pending").length,
      processing: this.jobs.filter((j) => j.status === "processing").length,
      completed: this.jobs.filter((j) => j.status === "completed").length,
      failed: this.jobs.filter((j) => j.status === "failed").length,
      delayed: this.jobs.filter((j) => j.status === "delayed").length,
    };
  }

  private emit(event: string, job: QueueJob<TData>): void {
    const handler = this.handlers.get(event);
    if (handler) {
      handler(job).catch(console.error);
    }
  }

  destroy(): void {
    this.pause();
    this.jobs = [];
    this.handlers.clear();
    this.processing.clear();
  }
}

// ─── Queue Manager (Singleton) ───────────────────────────────────────────────

class QueueManager {
  private queues = new Map<string, Queue>();

  getQueue<T>(name: string, options?: QueueOptions): Queue<T> {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue<T>(name, options));
    }
    return this.queues.get(name) as Queue<T>;
  }

  getStats(): Record<string, ReturnType<Queue["getStats"]>> {
    const stats: Record<string, ReturnType<Queue["getStats"]>> = {};
    for (const [name, queue] of this.queues) {
      stats[name] = queue.getStats();
    }
    return stats;
  }

  destroyAll(): void {
    for (const queue of this.queues.values()) {
      queue.destroy();
    }
    this.queues.clear();
  }
}

export const queueManager = new QueueManager();

// ─── Pre-configured Queues ───────────────────────────────────────────────────

export const emailQueue = queueManager.getQueue<{ to: string; subject: string; body: string }>(
  "email",
  { maxRetries: 5, retryDelay: 5000 }
);

export const documentQueue = queueManager.getQueue<{ documentId: string; action: string }>(
  "document",
  { maxRetries: 3, concurrency: 3 }
);

export const analyticsQueue = queueManager.getQueue<{ event: string; data: unknown }>(
  "analytics",
  { maxRetries: 1, removeOnComplete: true }
);

export const webhookQueue = queueManager.getQueue<{ url: string; payload: unknown }>(
  "webhook",
  { maxRetries: 3, retryDelay: 2000 }
);
