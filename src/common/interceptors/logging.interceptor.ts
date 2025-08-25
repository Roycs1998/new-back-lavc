import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = (request as any).user?.userId;

    const start = Date.now();

    this.logger.log(
      `🔄 ${method} ${url} - ${ip} - ${userAgent} ${userId ? `- User: ${userId}` : ''}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;

          this.logger.log(
            `✅ ${method} ${url} - ${statusCode} - ${duration}ms ${userId ? `- User: ${userId}` : ''}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - start;
          this.logger.error(
            `❌ ${method} ${url} - ERROR - ${duration}ms - ${error.message} ${userId ? `- User: ${userId}` : ''}`,
          );
        },
      }),
    );
  }
}
