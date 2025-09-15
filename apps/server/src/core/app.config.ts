import { Logger } from "@nestjs/common";
import { registerAs } from "@nestjs/config";
import chalk from "chalk";
import { plainToInstance, Transform } from "class-transformer";
import { IsEnum, validateSync } from "class-validator";
import ms from "ms";

import {
  IsNumber,
  IsString,
  IsStringValue,
  isStringValue,
} from "@/common/decorators/validation";

const nodeEnvs = ["development", "production"] as const;
type NodeEnv = (typeof nodeEnvs)[number];

class _AppConfig {
  @IsString()
  @IsEnum(nodeEnvs)
  NODE_ENV: NodeEnv;

  @IsNumber()
  PORT: number;

  @IsString()
  API_PREFIX: string;

  @IsStringValue()
  REQUEST_TIMEOUT: ms.StringValue;

  @IsString()
  ENCRYPTION_KEY: string;

  @IsString()
  COOKIE_SECRET: string;

  @IsStringValue()
  THROTTLE_TTL: ms.StringValue;

  @IsNumber()
  THROTTLE_LIMIT: number;

  @Transform(({ value }) => value.split(",").map((o: string) => o.trim()))
  @IsString({ each: true })
  ALLOWED_ORIGINS: string[];

  public get isDev() {
    return this.NODE_ENV === "development";
  }

  public get isProd() {
    return this.NODE_ENV === "production";
  }
}

export const AppConfig = registerAs("app", () => {
  const logger = new Logger(_AppConfig.name);

  const configInstance = plainToInstance(_AppConfig, process.env, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(configInstance, { whitelist: true });

  const envVars =
    process.env.NODE_ENV === "development"
      ? configInstance
      : Object.keys(configInstance);

  if (errors.length > 0) {
    logger.error("Validation failed. Errors: ", errors);
  }

  logger.log(
    "Loaded environment variables: " +
      chalk.bold.white.dim(JSON.stringify(envVars, null, 2)),
  );

  type MsTransformed<T> = {
    [K in keyof T]: T[K] extends ms.StringValue ? number : T[K];
  };

  for (const [key, val] of Object.entries(configInstance)) {
    if (isStringValue(val)) {
      configInstance[key] = ms(val);
    }
  }

  type TransformedConfig = MsTransformed<_AppConfig>;

  return configInstance as unknown as TransformedConfig;
});
