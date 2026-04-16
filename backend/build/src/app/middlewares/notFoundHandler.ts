import { RequestHandler } from "express";
import httpStatus from "http-status";

const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API Not Found!",
    errorMessages: [
      {
        path: _req.originalUrl,
        message: "API Not Found!",
      },
    ],
  });
};

export default notFoundHandler;
