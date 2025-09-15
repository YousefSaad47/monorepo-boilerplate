/** biome-ignore-all lint/style/noNonNullAssertion: <> */

import { INestApplication, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression from "compression";
import cookieParser from "cookie-parser";
import { NextFunction, Request, Response } from "express";

import { HppPipe, XssSanitizerPipe } from "@/common/pipes";

export const extendNestApplication = (app: INestApplication) => {
  Object.defineProperty(app, "registerGlobalPipes", {
    value: () => {
      app.useGlobalPipes(new XssSanitizerPipe());
      app.useGlobalPipes(new HppPipe({ allowList: [] }));
      return app;
    },
    writable: true,
    configurable: false,
    enumerable: true,
  });

  Object.defineProperty(app, "registerSecurity", {
    value: () => {
      // app.use(helmet());

      // Explicitly
      app.use((_req: Request, res: Response, next: NextFunction) => {
        res.removeHeader("X-Powered-By");

        res.setHeader(
          "Strict-Transport-Security",
          "max-age=63072000; includeSubDomains; preload",
        );

        res.setHeader(
          "Content-Security-Policy",
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; upgrade-insecure-requests",
        );

        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-XSS-Protection", "1; mode=block");
        res.setHeader("X-Frame-Options", "DENY");

        res.setHeader(
          "Permissions-Policy",
          "interest-cohort=(), geolocation=(), microphone=(), camera=()",
        );

        res.setHeader(
          "Referrer-Policy",
          // Disable referrers for browsers that don't support strict-origin-when-cross-origin; use strict-origin-when-cross-origin for browsers that do:
          "no-referrer, strict-origin-when-cross-origin",
        );

        res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        res.setHeader("Origin-Agent-Cluster", "?1");
        res.setHeader("X-DNS-Prefetch-Control", "off");
        res.setHeader("X-Download-Options", "noopen");
        res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

        next();
      });

      return app;
    },
    writable: true,
    configurable: false,
    enumerable: true,
  });

  Object.defineProperty(app, "registerCors", {
    value: () => {
      app.enableCors({
        origin: process.env.ALLOWED_ORIGINS,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
      });

      return app;
    },
    writable: true,
    configurable: false,
    enumerable: true,
  });

  Object.defineProperty(app, "registerCompression", {
    value: () => {
      app.use(compression());
      return app;
    },
    writable: true,
    configurable: false,
    enumerable: true,
  });

  Object.defineProperty(app, "registerParsers", {
    value: () => {
      app.use(cookieParser(process.env.COOKIE_SECRET));

      return app;
    },
    writable: true,
    configurable: false,
    enumerable: true,
  });

  Object.defineProperty(app, "registerSanitizers", {
    value: () => {
      return app;
    },
    writable: true,
    configurable: false,
    enumerable: true,
  });

  Object.defineProperty(app, "registerSwagger", {
    value: () => {
      const config = new DocumentBuilder()
        .setTitle("LMS API")
        .setDescription("API documentation for the Learning Management System")
        .setVersion("1.0")
        .addGlobalResponse({
          status: 500,
          description: "Internal server error",
        })
        .build();

      const documentFactory = () => SwaggerModule.createDocument(app, config);

      SwaggerModule.setup("docs", app, documentFactory, {
        useGlobalPrefix: true,
        // Explicitly set JSON/YAML URLs for clarity
        jsonDocumentUrl: "docs-json",
        yamlDocumentUrl: "docs-yaml",
        // Disable JSON/YAML URLS in production
        raw: process.env.NODE_ENV === "development",
        // Disable UI in production
        ui: process.env.NODE_ENV === "development",
      });

      return app;
    },
    writable: true,
    configurable: false,
    enumerable: true,
  });

  Object.defineProperty(app, "bootstrap", {
    value: async () => {
      await app.listen(process.env.PORT!);
      Logger.log(`Server is running on: ${await app.getUrl()}`, "Bootstrap");
    },
    writable: true,
    configurable: false,
    enumerable: true,
  });
};
