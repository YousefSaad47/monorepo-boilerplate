import { randomUUID } from "node:crypto";

import { mixin, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export interface RequestIdOptions {
  headerName?: string;
  generator?: () => string;
}
export const RequestIdMiddleware = (opts: RequestIdOptions = {}) => {
  return mixin(
    class RequestIdMiddleware implements NestMiddleware {
      use(req: Request, res: Response, next: NextFunction) {
        const { headerName = "X-Request-Id", generator = randomUUID } = opts;

        const requestId = req.headers[headerName] || generator();

        req.id = requestId as string;
        res.setHeader(headerName, requestId);

        next();
      }
    },
  );
};
