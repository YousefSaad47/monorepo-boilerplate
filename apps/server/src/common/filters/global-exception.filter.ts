/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { randomUUID } from "node:crypto";

import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import { BaseExceptionFilter } from "@nestjs/core";
import chalk from "chalk";
import { Request, Response } from "express";
import { PinoLogger } from "nestjs-pino";

import { AppConfig } from "@/core/app.config";

@Injectable()
@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  constructor(
    @Inject(AppConfig.KEY)
    private readonly config: ConfigType<typeof AppConfig>,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const handledRes = this.handleException(exception, req);

    const finalRes = {
      error: handledRes?.error,
      meta: {
        request_id: req.id || randomUUID(),
        timestamp: new Date().toISOString(),
      },
    };

    res.status(finalRes.error.status_code).json(finalRes);
  }

  private handleException(exception: any, req: Request) {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const status = statusCode >= 500 ? "error" : "fail";
      const message = exception.message;
      const details =
        typeof exception.getResponse() === "object"
          ? (exception.getResponse() as Record<string, any>)
          : {};

      const normalized = exception.name
        .replace(/Exception$/, "")
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .toLowerCase();

      const code = details.code || `http_${normalized}`;

      delete details.message;
      delete details.statusCode;
      delete details.code;
      delete details.error;

      const httpExceptionRes = {
        error: {
          status,
          status_code: statusCode,
          code,
          message,
          details: {
            url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
            method: req.method,
            ...details,
          },
        },
      };

      this.logger.warn(
        chalk.yellow(
          `[${statusCode}] ${req.method} ${req.originalUrl} - ${message}`,
        ),
      );

      return httpExceptionRes;
    }

    const unknownExceptionRes = {
      error: {
        status: "error",
        status_code: HttpStatus.INTERNAL_SERVER_ERROR,
        code: `http_unknown_error`,
        message: "Something went wrong, please try again later",
        details: {
          url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
          method: req.method,
        },
        ...(this.config.isDev && { stack: exception.stack }),
      },
    };

    this.logger.error(chalk.red(unknownExceptionRes.error.stack));

    return unknownExceptionRes;
  }
}
