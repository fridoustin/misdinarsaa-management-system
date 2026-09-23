/** Base class so use-cases throw typed errors, never raw strings or supabase errors. */
export class AppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(`${entity} dengan id ${id} tidak ditemukan.`, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Anda tidak memiliki akses untuk melakukan aksi ini.") {
    super(message, "FORBIDDEN");
  }
}

export class InvalidTransitionError extends AppError {
  constructor(message: string) {
    super(message, "INVALID_TRANSITION");
  }
}
