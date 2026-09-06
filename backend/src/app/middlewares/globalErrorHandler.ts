import { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import config from "@/config";
import ApiError from "@/app/errors/ApiError";
import { IGenericErrorMessage } from "@/app/interfaces/error";
import handleZodError from "@/app/errors/handleZodError";
import handlePrismaError from "@/app/errors/handlePrismaError";

const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong!";
  let errorMessages: IGenericErrorMessage[] = [];

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const simplified = handlePrismaError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorMessages = simplified.errorMessages;
  } else if (err instanceof ZodError) {
    const simplified = handleZodError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorMessages = simplified.errorMessages;
  } else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorMessages = err.message ? [{ path: "", message: err.message }] : [];
  } else if (err instanceof TokenExpiredError) {
    // Backstop for any code path that verifies a token outside the auth middleware.
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Access token expired";
    errorMessages = [{ path: "", message }];
  } else if (err instanceof JsonWebTokenError) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Invalid access token";
    errorMessages = [{ path: "", message }];
  } else if (err instanceof MulterError) {
    statusCode = httpStatus.BAD_REQUEST;
    message =
      err.code === "LIMIT_FILE_SIZE" ? "File is too large" : "File upload failed";
    errorMessages = [{ path: err.field ?? "", message: err.message }];
  } else if (err instanceof Error) {
    // Unrecognised failures are genuine 500s. Never echo the raw message in production —
    // it routinely carries connection strings, SQL and file paths.
    if (config.isProduction) {
      console.error("Unhandled error:", err);
      errorMessages = [{ path: "", message }];
    } else {
      message = err.message;
      errorMessages = err.message ? [{ path: "", message: err.message }] : [];
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.isProduction ? undefined : err?.stack,
  });
};

export default globalErrorHandler;
