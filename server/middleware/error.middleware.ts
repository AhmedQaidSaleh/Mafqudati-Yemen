import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error("Unhandled Error:", err);

  const errorMessage = err instanceof Error ? err.message : undefined;

  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
  });
};
