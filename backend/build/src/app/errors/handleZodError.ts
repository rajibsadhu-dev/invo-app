import { ZodError, ZodIssue } from "zod";
import { IGenericErrorResponse } from "@/app/interfaces/error";
import httpStatus from "http-status";

const handleZodError = (error: ZodError): IGenericErrorResponse => {
  const errorMessages = error.issues.map((issue: ZodIssue) => ({
    path: issue.path[issue.path.length - 1]?.toString() || "",
    message: issue.message,
  }));

  return {
    statusCode: httpStatus.BAD_REQUEST,
    message: "Validation Error",
    errorMessages,
  };
};

export default handleZodError;
