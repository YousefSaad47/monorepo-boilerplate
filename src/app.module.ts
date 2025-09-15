/** biome-ignore-all lint/style/noNonNullAssertion: <> */

import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  Reflector,
} from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";

import { GlobalExceptionFilter } from "@/common/filters";
import {
  AuthGuard,
  CsrfGuard,
  ThrottlerBehindProxyGuard,
} from "@/common/guards";
import {
  SerializeInterceptor,
  TimeoutInterceptor,
} from "@/common/interceptors";
import { RequestIdMiddleware } from "@/common/middlewares";
import { ResilienceInterceptor } from "@/common/resilience/interceptors";
import { ResilienceModule } from "@/common/resilience/resilience.module";
import { AppConfig } from "@/core/app.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [AppConfig],
    }),
    LoggerModule.forRootAsync({
      inject: [AppConfig.KEY],
      useFactory: (config: ConfigType<typeof AppConfig>) => ({
        pinoHttp: {
          level: config.isDev ? "debug" : "info",
          ...(config.isDev && { transport: { target: "pino-pretty" } }),
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [AppConfig.KEY],
      useFactory: (config: ConfigType<typeof AppConfig>) => [
        {
          ttl: config.THROTTLE_TTL,
          limit: config.THROTTLE_LIMIT,
        },
      ],
    }),
    ResilienceModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerBehindProxyGuard },
    {
      provide: APP_GUARD,
      inject: [Reflector, AppConfig.KEY],
      useFactory: (
        reflector: Reflector,
        config: ConfigType<typeof AppConfig>,
      ) =>
        new CsrfGuard(reflector, {
          origin: config.ALLOWED_ORIGINS,
          secFetchSite(secFetchSite, req) {
            if (
              secFetchSite === "same-origin" ||
              secFetchSite === "same-site"
            ) {
              return true;
            }

            if (
              secFetchSite === "cross-site" &&
              config.ALLOWED_ORIGINS.includes(req.headers.origin!)
            ) {
              return true;
            }

            return false;
          },
        }),
    },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SerializeInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResilienceInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware()).forRoutes("*");
  }
}
