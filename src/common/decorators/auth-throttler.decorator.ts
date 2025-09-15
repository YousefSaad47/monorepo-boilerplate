import { Throttle } from "@nestjs/throttler";
import ms, { StringValue } from "ms";

type AuthThrottlerOptions = {
  ttl?: StringValue;
  limit?: number;
};

export const AuthThrottler = ({
  ttl = "1h",
  limit = 20,
}: AuthThrottlerOptions = {}) => {
  return Throttle({ default: { ttl: ms(ttl), limit } });
};
