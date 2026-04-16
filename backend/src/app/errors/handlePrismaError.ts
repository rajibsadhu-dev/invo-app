import { Prisma } from "@prisma/client";
import { IGenericErrorResponse } from "@/app/interfaces/error";
import httpStatus from "http-status";

const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError
): IGenericErrorResponse => {
  let statusCode: number = httpStatus.BAD_REQUEST;
  let message = "Database Error";
  const errorMessages = [];

  switch (error.code) {
    case "P2002": {
      statusCode = httpStatus.CONFLICT;
      message = "Unique constraint violation";
      const target = (error.meta?.target as string[]) || [];
      errorMessages.push({
        path: target.join(", "),
        message: `${target.join(", ")} already exists`,
      });
      break;
    }
    case "P2025":
      statusCode = httpStatus.NOT_FOUND;
      message = "Record not found";
      errorMessages.push({ path: "", message: error.message });
      break;
    case "P2003":
      statusCode = httpStatus.BAD_REQUEST;
      message = "Foreign key constraint failed";
      errorMessages.push({ path: "", message: error.message });
      break;
    default:
      errorMessages.push({ path: "", message: error.message });
  }

  return { statusCode, message, errorMessages };
};

export default handlePrismaError;
