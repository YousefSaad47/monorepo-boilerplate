import { applyDecorators } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsNumber as _IsNumber, IsNotEmpty } from "class-validator";

export const IsNumber = () => {
  return applyDecorators(
    Transform(({ value }) => (value ? Number(value) : value)),
    _IsNumber(),
    IsNotEmpty(),
  );
};
