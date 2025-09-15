/** biome-ignore-all lint/complexity/noStaticOnlyClass: <> */

import { Request } from "express";

const re = /(\S+)\s+(\S+)/;

const parseAuthHeader = (hdrVal: string) => {
  if (typeof hdrVal !== "string") {
    return null;
  }

  const matches = hdrVal.match(re);
  return matches && { scheme: matches[1], value: matches[2] };
};

const AUTH_HEADER = "Authorization",
  BEARER_AUTH_SCHEME = "Bearer";

export abstract class TokenExtractor {
  public static fromHeader(req: Request, { hdrName }: { hdrName: string }) {
    let token: string | string[] | null = null;

    if (req.headers[hdrName]) {
      token = req.headers[hdrName];
    }

    return token;
  }

  public static fromAuthHeaderWithScheme(
    req: Request,
    { scheme }: { scheme: string },
  ) {
    const schemeLower = scheme.toLowerCase();

    let token: string | null = null;

    if (req.headers[AUTH_HEADER]) {
      const authParams = parseAuthHeader(req.headers[AUTH_HEADER] as string);

      if (authParams && authParams.scheme?.toLowerCase() === schemeLower) {
        token = authParams.value;
      }
    }

    return token;
  }

  public static fromAuthHeaderAsBearerToken(req: Request) {
    return TokenExtractor.fromAuthHeaderWithScheme(req, {
      scheme: BEARER_AUTH_SCHEME,
    });
  }

  public static fromCookies(
    req: Request,
    { cookieName }: { cookieName: string },
  ) {
    let token = null;

    if (req.signedCookies) {
      token = req.signedCookies[cookieName];
    }

    return token;
  }
}
