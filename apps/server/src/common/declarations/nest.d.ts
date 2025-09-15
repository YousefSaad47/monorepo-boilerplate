import "@nestjs/common";

declare module "@nestjs/common" {
  interface INestApplication {
    registerGlobalPipes: () => this;
    registerSecurity: () => this;
    registerCors: () => this;
    registerCompression: () => this;
    registerParsers: () => this;
    registerSanitizers: () => this;
    registerSwagger: () => this;
    bootstrap: () => Promise<void>;
  }
}
