import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentUserData {
  id: string;
  email: string;
  role: string;
  companyId?: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user: CurrentUserData }>();
    return req.user;
  },
);
