export type ErrorDetails = Record<string, unknown>;

export abstract class DomainError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly errorCode: string;
  public readonly details?: ErrorDetails;

  constructor(message: string, details?: ErrorDetails) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON() {
    return {
      error: this.name,
      code: this.errorCode,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class NotFoundError extends DomainError {
  public readonly statusCode = 404;
  public readonly errorCode = "RESOURCE_NOT_FOUND";
}

export class ValidationError extends DomainError {
  public readonly statusCode = 400;
  public readonly errorCode = "VALIDATION_FAILED";
}

export class InsufficientStockError extends DomainError {
  public readonly statusCode = 409;
  public readonly errorCode = "INSUFFICIENT_STOCK";

  constructor(message: string, details?: { sku: string; requested: number; available: number; componentSku?: string }) {
    super(message, details);
  }
}

export class PreOrderStateError extends DomainError {
  public readonly statusCode = 422;
  public readonly errorCode = "INVALID_PREORDER_STATE";

  constructor(message: string, details?: { current: string; expected?: string | string[] }) {
    super(message, details);
  }
}

export class DepositCalculationError extends DomainError {
  public readonly statusCode = 400;
  public readonly errorCode = "INVALID_DEPOSIT_AMOUNT";

  constructor(message: string, details?: { minimumRequired: number; provided: number }) {
    super(message, details);
  }
}

export class ReservationExpiredError extends DomainError {
  public readonly statusCode = 410;
  public readonly errorCode = "RESERVATION_EXPIRED";

  constructor(reservationId: string) {
    super(`Stock reservation '${reservationId}' has expired (15-minute TTL elapsed).`, { reservationId });
  }
}

export class IdempotencyConflictError extends DomainError {
  public readonly statusCode = 409;
  public readonly errorCode = "IDEMPOTENCY_IN_PROGRESS";

  constructor(key: string) {
    super(`A request with idempotency key '${key}' is currently being processed.`, { idempotencyKey: key });
  }
}

export class WebhookSignatureError extends DomainError {
  public readonly statusCode = 401;
  public readonly errorCode = "INVALID_WEBHOOK_SIGNATURE";

  constructor(provider: string) {
    super(`Cryptographic webhook signature verification failed for provider: ${provider}`, { provider });
  }
}
