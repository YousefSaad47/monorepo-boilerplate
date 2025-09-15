import { createParamDecorator } from "@nestjs/common";

export const CurrentUser = createParamDecorator((_data: never, ctx) => {
  const req = ctx.switchToHttp().getRequest();
  return req.currentUser;
});
