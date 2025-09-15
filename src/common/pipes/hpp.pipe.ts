/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { ArgumentMetadata, PipeTransform } from "@nestjs/common";

type HppPipeOptions = {
  allowList: string[];
};

export class HppPipe implements PipeTransform {
  constructor(private readonly opts: HppPipeOptions) {}

  transform(value: any, _metadata: ArgumentMetadata) {
    if (typeof value !== "object" || !value) {
      return value;
    }

    const sanitized = Object.entries(value).reduce((acc, [key, val]) => {
      if (Array.isArray(val) && val.length > 0) {
        acc[key] = this.opts.allowList.includes(key) ? val : val[0];
      } else {
        acc[key] = val;
      }

      return acc;
    }, {});

    return sanitized;
  }
}
