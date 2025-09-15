import { SetMetadata } from "@nestjs/common";
import ms, { StringValue } from "ms";

export const TIMEOUT_KEY = "timeout";

type TimeOutDecoratorOptions = {
  timeout: StringValue;
};

export const Timeout = ({ timeout }: TimeOutDecoratorOptions) =>
  SetMetadata(TIMEOUT_KEY, ms(timeout));
