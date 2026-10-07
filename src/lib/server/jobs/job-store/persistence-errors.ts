export class JobWriteConflictError extends Error {
  readonly code = "job_write_conflict";
  readonly status = 409;

  constructor(jobId: string) {
    super(`Job ${jobId} changed during this operation; reload and retry.`);
    this.name = "JobWriteConflictError";
  }
}

export class JobPersistenceUnavailableError extends Error {
  readonly code = "job_persistence_unavailable";
  readonly status = 503;

  constructor(message = "Durable job storage is unavailable") {
    super(message);
    this.name = "JobPersistenceUnavailableError";
  }
}
