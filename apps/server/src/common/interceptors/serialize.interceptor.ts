/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { plainToInstance } from "class-transformer";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import {
  MESSAGE_KEY,
  SERIALIZE_KEY,
  SerializeOptions,
} from "@/common/decorators";
import { ClassConstructor } from "@/common/types";

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    const serialize = this.reflector.getAllAndOverride<{
      dto: ClassConstructor;
      opts: SerializeOptions;
    }>(SERIALIZE_KEY, [ctx.getHandler(), ctx.getClass()]);

    let dto: ClassConstructor;
    let opts: SerializeOptions;

    if (
      serialize &&
      typeof serialize === "object" &&
      "dto" in serialize &&
      "opts" in serialize
    ) {
      dto = serialize.dto;
      opts = serialize.opts;
    }

    const message =
      this.reflector.getAllAndOverride<string>(MESSAGE_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) || "Request successful";

    const req = ctx.switchToHttp().getRequest<Request>();
    const res = ctx.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: any) => {
        try {
          return {
            status: "success",
            status_code: res.statusCode,
            message,
            data: this.serialize(data, dto, opts),
            meta: {
              request_id: req.id,
              timestamp: new Date().toISOString(),
            },
          };
        } catch (err) {
          console.error(
            `SerializeInterceptor: Failed to transform data: ${err.message}`,
          );

          throw new InternalServerErrorException(
            "Response serialization failed",
          );
        }
      }),
    );
  }

  private serialize(data: any, dto: ClassConstructor, opts: SerializeOptions) {
    return plainToInstance(dto, data, {
      ...opts,
    });
  }
}
