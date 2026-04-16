import { Prisma } from "@prisma/client";
import { IGenericErrorResponse } from "@/app/interfaces/error";
declare const handlePrismaError: (error: Prisma.PrismaClientKnownRequestError) => IGenericErrorResponse;
export default handlePrismaError;
//# sourceMappingURL=handlePrismaError.d.ts.map