import { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
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
  } else if (err instanceof Error) {
    message = err.message;
    errorMessages = err.message ? [{ path: "", message: err.message }] : [];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.env !== "production" ? err?.stack : undefined,
  });
};

export default globalErrorHandler;
