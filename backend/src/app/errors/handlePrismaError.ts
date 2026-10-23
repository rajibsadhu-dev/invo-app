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
      // MySQL reports the violated index by NAME here, as a plain string; other
      // connectors report an array of column names. Assuming an array made this handler
      // itself throw, turning every duplicate into a 500 instead of a 409.
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target.map(String) : [];
      message = fields.length
        ? `${fields.join(", ")} already exists`
        : "A record with these values already exists";
      errorMessages.push({ path: fields.join(", "), message });
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
