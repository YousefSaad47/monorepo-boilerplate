/** biome-ignore-all lint/complexity/noBannedTypes: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { applyDecorators } from "@nestjs/common";
import {
  IsString as _IsString,
  IsNotEmpty,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import ms from "ms";

export const isStringValue = (val: any): val is ms.StringValue => {
  try {
    return typeof ms(val) === "number";
  } catch {
    return false;
  }
};

@ValidatorConstraint({ name: "IsStringValue", async: false })
class StringValueConstraint implements ValidatorConstraintInterface {
  validate(val: any) {
    return isStringValue(val);
  }

  defaultMessage?(args?: ValidationArguments) {
    return `${args?.property} must be a valid string value accepted by the 'ms' library (e.g., '1h', '30m', '15s')`;
  }
}

export const IsStringValue = (opts?: ValidationOptions) => {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: opts,
      constraints: [],
      validator: StringValueConstraint,
    });
  };
};

export const IsString = (opts: ValidationOptions = {}) => {
  return applyDecorators(_IsString(opts), IsNotEmpty());
};
