/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import xss from "xss";

const sanitize = (input: any) => {
  if (typeof input === "string") {
    return xss(input);
  }

  if (Array.isArray(input)) {
    return input.map(sanitize);
  }

  if (typeof input === "object" && input !== null) {
    Object.keys(input).forEach((key) => {
      input[key] = sanitize(input[key]);
    });

    return input;
  }

  return input;
};

export class XssSanitizerPipe implements PipeTransform {
  transform(val: any, _metadata: ArgumentMetadata) {
    return sanitize(val);
  }
}
