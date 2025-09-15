/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import {
  catchError,
  Observable,
  TimeoutError,
  throwError,
  timeout,
} from "rxjs";

import { AppConfig } from "@/core/app.config";

import { TIMEOUT_KEY } from "../decorators/timeout.decorator";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(
    @Inject(AppConfig.KEY)
    private readonly config: ConfigType<typeof AppConfig>,
    private readonly reflector: Reflector,
  ) {}

  intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    const timeoutMS =
      this.reflector.getAllAndOverride<number>(TIMEOUT_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) || this.config.REQUEST_TIMEOUT;

    return next.handle().pipe(
      timeout(timeoutMS),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }

        return throwError(() => err);
      }),
    );
  }
}
