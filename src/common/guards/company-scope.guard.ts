import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { COMPANY_SCOPE_KEY } from '../decorators/company-scope.decorator';

@Injectable()
export class CompanyScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isCompanyScoped = this.reflector.getAllAndOverride<boolean>(
      COMPANY_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isCompanyScoped) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user.role === UserRole.PLATFORM_ADMIN) {
      return true;
    }

    if (user.role === UserRole.COMPANY_ADMIN) {
      const companyIdFromParams = request.params.companyId;
      const companyIdFromBody = request.body?.companyId;

      if (!companyIdFromParams && !companyIdFromBody) {
        return true;
      }

      const targetCompanyId = companyIdFromParams || companyIdFromBody;
      if (user.companyId !== targetCompanyId) {
        throw new ForbiddenException(
          'Access denied. You can only access resources from your company.',
        );
      }

      return true;
    }

    throw new ForbiddenException('Access denied. Company admin role required.');
  }
}
