import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { InvoiceService } from "@/app/modules/invoice/invoice.service";

const verifyInvoice = catchAsync(async (req: Request, res: Response) => {
  const token = req.params.token as string;

  const invoice = await InvoiceService.getInvoiceByVerificationToken(token);

  if (!invoice) {
    sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "This invoice could not be verified",
      data: null,
    });
    return;
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice verified successfully",
    data: invoice,
  });
});

export const VerifyController = { verifyInvoice };
