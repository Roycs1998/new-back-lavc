import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'message' in data
        ) {
          return data;
        }

        if (
          data &&
          typeof data === 'object' &&
          'items' in data &&
          'meta' in data
        ) {
          return ApiResponseDto.success(
            data.items,
            this.getSuccessMessage(request.method, request.route?.path),
            data.meta,
          );
        }

        if (Array.isArray(data)) {
          return ApiResponseDto.success(
            data,
            this.getSuccessMessage(request.method, request.route?.path),
            { count: data.length },
          );
        }

        return ApiResponseDto.success(
          data,
          this.getSuccessMessage(request.method, request.route?.path),
        );
      }),
    );
  }

  private getSuccessMessage(method: string, path?: string): string {
    const resource = this.extractResourceName(path);

    switch (method) {
      case 'POST':
        return `${resource} creado exitosamente`;
      case 'PUT':
      case 'PATCH':
        return `${resource} actualizado exitosamente`;
      case 'DELETE':
        return `${resource} eliminado exitosamente`;
      case 'GET':
        return path?.includes(':id')
          ? `${resource} obtenido exitosamente`
          : `${resource} listados exitosamente`;
      default:
        return 'Operación completada exitosamente';
    }
  }

  private extractResourceName(path?: string): string {
    if (!path) return 'Recurso';

    const segments = path
      .split('/')
      .filter((segment) => segment && !segment.startsWith(':'));
    const resourceSegment =
      segments[segments.length - 1] || segments[segments.length - 2];

    if (resourceSegment?.endsWith('s')) {
      return (
        resourceSegment.slice(0, -1).charAt(0).toUpperCase() +
        resourceSegment.slice(1, -1)
      );
    }

    return (
      resourceSegment?.charAt(0).toUpperCase() + resourceSegment?.slice(1) ||
      'Recurso'
    );
  }
}
