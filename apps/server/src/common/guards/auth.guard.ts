import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Observable } from "rxjs";

import { IS_PUBLIC_KEY } from "@/common/decorators";
import { TokenExtractor } from "@/common/utils";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    ctx: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<Request>();

    const sid =
      TokenExtractor.fromCookies(req, { cookieName: "__Host-sid" }) ||
      TokenExtractor.fromAuthHeaderAsBearerToken(req);

    const hsid = TokenExtractor.fromCookies(req, { cookieName: "__Host-hsid" });

    if (!sid || !hsid) {
      return false;
    }

    // TODO Continue

    return true;
  }
}
