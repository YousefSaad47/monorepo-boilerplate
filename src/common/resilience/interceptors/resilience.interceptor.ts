/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import chalk from "chalk";
import { PinoLogger } from "nestjs-pino";
import { from, lastValueFrom, Observable } from "rxjs";

import { ResilienceService } from "@/common/resilience";
import { CIRCUIT_OPTIONS, RETRY_OPTIONS } from "@/common/resilience/decorators";

@Injectable()
export class ResilienceInterceptor implements NestInterceptor {
  constructor(
    private readonly resilience: ResilienceService,
    private readonly reflector: Reflector,
    private readonly logger: PinoLogger,
  ) {}

  intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    const retryOpts = this.reflector.getAllAndOverride(RETRY_OPTIONS, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const circuitOpts = this.reflector.getAllAndOverride(CIRCUIT_OPTIONS, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!retryOpts && !circuitOpts) {
      return next.handle();
    }

    const className = ctx.getClass().name;
    const handlerName = ctx.getHandler().name;
    const key = `${className}.${handlerName}`;

    this.logger.debug(
      { retryOpts, circuitOpts, key },
      chalk.blue("ResilienceInterceptor - applying resilience options"),
    );

    const execFn = () => lastValueFrom(next.handle());

    let wrapped = execFn;

    if (retryOpts) {
      const retryWrapped = wrapped;
      wrapped = () => this.resilience.retry(retryWrapped, retryOpts);
    }

    if (circuitOpts) {
      const circuitWrapped = wrapped;
      wrapped = () =>
        this.resilience.circuitBreaker(key, circuitWrapped, circuitOpts);
    }

    return from(wrapped());
  }
}
