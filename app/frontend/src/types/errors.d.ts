export class EmailValidationError extends Error {
    constructor(
      message: string,
      public code: 'EMPTY' | 'INVALID_FORMAT' | 'DOMAIN_ERROR',
      public status: number = 400
    ) {
      super(message);
      this.name = 'EmailValidationError';
    }
  }