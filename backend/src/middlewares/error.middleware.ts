import { NextFunction, Request, Response } from "express";
import ApiError, { ApiErrorInterface } from "../utils/ApiError";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";

    error = new ApiError(
      statusCode,
      message,
      error?.errors || [],
      error.stack,
      null
    );
  }

  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode || 500).json(response);
};

export default errorHandler;
