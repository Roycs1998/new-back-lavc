import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err) {
      throw err;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
