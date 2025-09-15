/** biome-ignore-all lint/complexity/noBannedTypes: <> */

import { SetMetadata } from "@nestjs/common";

import { ClassConstructor } from "@/common/types";

export const SERIALIZE_KEY = "serialize";

export type SerializeOptions = {
  excludeExtraneousValues?: boolean;
  exposeDefaultValues?: boolean;
  groups?: string[];
};

export const Serialize = (
  dto: ClassConstructor,
  opts: SerializeOptions = {
    excludeExtraneousValues: true,
    exposeDefaultValues: false,
    groups: [],
  },
) => SetMetadata(SERIALIZE_KEY, { dto, opts });
