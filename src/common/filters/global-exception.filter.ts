import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { Request, Response } from 'express';

import { MongoError } from 'mongodb';

import { Error as MongooseError } from 'mongoose';

import { ApiResponseDto } from '../dto/api-response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message =
          responseObj.message || responseObj.error || 'Error de validación';
        details =
          responseObj.message && Array.isArray(responseObj.message)
            ? responseObj.message
            : undefined;
        errorCode = responseObj.error || 'HTTP_EXCEPTION';
      }
    } else if (exception instanceof MongoError) {
      status = HttpStatus.BAD_REQUEST;
      if (exception.code === 11000) {
        message = 'Recurso duplicado: este elemento ya existe';
        errorCode = 'DUPLICATE_RESOURCE';

        const field = Object.keys((exception as any).keyValue || {})[0];
        if (field) {
          details = { field, value: (exception as any).keyValue[field] };
        }
      } else {
        message = 'Error en la base de datos';
        errorCode = 'DATABASE_ERROR';
      }
    } else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Error de validación de datos';
      errorCode = 'VALIDATION_ERROR';
      details = Object.values(exception.errors).map((err) => ({
        field: err.path,
        message: err.message,
        value: (err as any).value,
      }));
    } else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      message = `ID inválido: formato de ${exception.path} incorrecto`;
      errorCode = 'INVALID_ID_FORMAT';
      details = { field: exception.path, value: exception.value };
    } else if (exception instanceof Error) {
      message = exception.message || 'Error interno del servidor';
      errorCode = exception.name || 'UNKNOWN_ERROR';
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      {
        exception: exception instanceof Error ? exception.stack : exception,
        body: request.body,
        params: request.params,
        query: request.query,
        user: (request as any).user?.userId,
      },
    );

    const errorResponse = new ApiResponseDto(false, message, null, {
      errorCode,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(details && { details }),
    });

    response.status(status).json(errorResponse);
  }
}
