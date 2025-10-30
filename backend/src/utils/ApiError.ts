// src/utils/ApiError.ts
export interface ApiErrorInterface {
  statusCode: number;
  message: string;
  data?: any;
  errors?: any[];
  stack?: string;
}

class ApiError extends Error implements ApiErrorInterface {
  statusCode: number;
  data?: any;
  errors?: any[];

  constructor(
    statusCode: number,
    message = "Something went wrong",
    errors: any[] = [],
    stack = "",
    data: any = null
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.data = data;

    if (stack) {
      this.stack = stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
