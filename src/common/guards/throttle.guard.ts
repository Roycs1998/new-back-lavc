import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.userId || req.ip;
  }

  protected async getErrorMessage(): Promise<string> {
    return 'Demasiadas peticiones. Por favor, intenta más tarde.';
  }
}
