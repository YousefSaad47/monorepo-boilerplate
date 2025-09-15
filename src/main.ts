import { ConfigType } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { AppModule } from "@/app.module";
import { extendNestApplication } from "@/common/extensions";
import { AppConfig } from "@/core/app.config";

(async () => {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  const config = app.get<ConfigType<typeof AppConfig>>(AppConfig.KEY);

  app.setGlobalPrefix(config.API_PREFIX);

  extendNestApplication(app);

  app
    .registerGlobalPipes()
    .registerSecurity()
    .registerCors()
    .registerCompression()
    .registerParsers()
    .registerSanitizers()
    .registerSwagger();

  await app.bootstrap();
})();
