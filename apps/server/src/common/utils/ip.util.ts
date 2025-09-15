/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { Request } from "express";

const regexes = {
  ipv4: /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/,
  ipv6: /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i,
};

const exists = (val: any) => {
  return val != null;
};

const ip = (val: any): val is string => {
  return (exists(val) && regexes.ipv4.test(val)) || regexes.ipv6.test(val);
};

const getClientIpFromXForwardedFor = (val: any) => {
  if (!exists(val)) {
    return null;
  }

  if (!(typeof val === "string")) {
    throw new TypeError(`Expected a string, got "${typeof val}"`);
  }

  const forwardedIps = val.split(",").map((e) => {
    const ip = e.trim();
    if (ip.includes(":")) {
      const split = ip.split(":");
      // make sure we only use this if it's ipv4 (ip:port)
      if (split.length === 2) {
        return split[0];
      }
    }
    return ip;
  });

  for (let i = 0; i < forwardedIps.length; i++) {
    if (ip(forwardedIps[i])) {
      return forwardedIps[i];
    }
  }

  // If no value in the split list is an ip, return null
  return null;
};

export const getClientIp = (req: Request) => {
  const ipHeaders = [
    "x-client-ip",
    "cf-connecting-ip",
    "Cf-Pseudo-IPv4",
    "do-connecting-ip",
    "fastly-client-ip",
    "true-client-ip",
    "x-real-ip",
    "x-cluster-client-ip",
    "x-forwarded",
    "forwarded-for",
    "forwarded",
    "x-appengine-user-ip",
  ];

  if (req.headers) {
    const xForwardedFor = getClientIpFromXForwardedFor(
      req.headers["x-forwarded-for"],
    );

    if (ip(xForwardedFor)) {
      return xForwardedFor;
    }

    for (const h of ipHeaders) {
      if (ip(req.headers[h])) {
        return req.headers[h];
      }
    }
  }

  if (exists(req.socket) && ip(req.socket.remoteAddress)) {
    return req.socket.remoteAddress;
  }

  return null;
};

export const getGeoData = async (ip: string) => {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`);
    const data = (await res.json()) as any;

    return {
      city: data.city,
      region: data.regionName,
      countryCode: data.countryCode,
    };
  } catch {
    return null;
  }
};
