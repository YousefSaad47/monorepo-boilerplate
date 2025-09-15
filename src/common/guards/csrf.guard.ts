import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Observable } from "rxjs";

import { SKIP_CSRF_KEY } from "@/common/decorators";

type IsAllowedOriginHandler = (origin: string, req: Request) => boolean;

const secFetchSiteValues = [
  "same-origin",
  "same-site",
  "none",
  "cross-site",
] as const;

type SecFetchSite = (typeof secFetchSiteValues)[number];

const isSecFetchSite = (val: string): val is SecFetchSite => {
  return (secFetchSiteValues as readonly string[]).includes(val);
};

type IsAllowedSecFetchSiteHandler = (
  secFetchSite: SecFetchSite,
  req: Request,
) => boolean;

type CSRFOptions = {
  origin?: string | string[] | IsAllowedOriginHandler;
  secFetchSite?: SecFetchSite | SecFetchSite[] | IsAllowedSecFetchSiteHandler;
};

const isSafeMethodRe = /^(GET|HEAD)$/;

const isRequestedByFormElementRe =
  /^\b(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)\b/i;

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly opts: CSRFOptions,
  ) {}

  canActivate(
    ctx: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<Request>();

    const originHandler: IsAllowedOriginHandler = ((optsOrigin) => {
      if (!optsOrigin) {
        return (origin, req) => origin === req.headers.origin;
      } else if (typeof optsOrigin === "string") {
        return (origin) => origin === optsOrigin;
      } else if (typeof optsOrigin === "function") {
        return optsOrigin;
      } else {
        return (origin) => optsOrigin.includes(origin);
      }
    })(this.opts?.origin);

    const isAllowedOrigin = (origin: string | undefined, req: Request) => {
      if (origin === undefined) {
        return false;
      }
      return originHandler(origin, req);
    };

    const secFetchSiteHandler: IsAllowedSecFetchSiteHandler = ((
      optsSecFetchSite,
    ) => {
      if (!optsSecFetchSite) {
        return (secFetchSite) => secFetchSite === "same-origin";
      } else if (typeof optsSecFetchSite === "string") {
        return (secFetchSite) => secFetchSite === optsSecFetchSite;
      } else if (typeof optsSecFetchSite === "function") {
        return optsSecFetchSite;
      } else {
        return (secFetchSite) => optsSecFetchSite.includes(secFetchSite);
      }
    })(this.opts?.secFetchSite);

    const isAllowedSecFetchSite = (
      secFetchSite: string | undefined,
      req: Request,
    ) => {
      if (secFetchSite === undefined) {
        return false;
      }
      if (!isSecFetchSite(secFetchSite)) {
        return false;
      }
      return secFetchSiteHandler(secFetchSite, req);
    };

    if (
      !isSafeMethodRe.test(req.method) &&
      isRequestedByFormElementRe.test(
        req.header("content-type") || "text/plain",
      ) &&
      !isAllowedSecFetchSite(req.header("sec-fetch-site"), req) &&
      !isAllowedOrigin(req.headers.origin, req)
    ) {
      return false;
    }

    return true;
  }
}
