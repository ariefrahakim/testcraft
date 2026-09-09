import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import {
  isMessageCode,
  resolveLocale,
  translate,
  type ApiLocale,
} from '../i18n/messages';

/** Error per-field pada kegagalan validasi. */
interface FieldError {
  field: string;
  code: string;
  message: string;
}

/**
 * Menyeragamkan seluruh error API.
 *
 * Bentuk respons:
 * ```json
 * {
 *   "statusCode": 401,
 *   "code": "auth.invalidCredentials",
 *   "message": "Incorrect email or password",
 *   "errors": [{ "field": "email", "code": "validation.email.invalid", "message": "…" }],
 *   "error": "Unauthorized",
 *   "path": "/api/v1/auth/login",
 *   "timestamp": "…"
 * }
 * ```
 *
 * `code` stabil lintas bahasa — itu yang dipakai klien untuk logika.
 * `message` mengikuti header `Accept-Language`.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // Respons bisa saja sudah dikirim, misalnya ketika sebuah guard melakukan
    // redirect. Menulis untuk kedua kalinya memicu ERR_HTTP_HEADERS_SENT yang
    // mematikan proses, jadi cukup diabaikan.
    if (res.headersSent) return;

    const locale = resolveLocale(req.headers['accept-language']);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'server.error';
    let error = 'InternalServerError';
    let fieldErrors: FieldError[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        code = body;
      } else {
        const b = body as {
          code?: string;
          message?: string | string[];
          errors?: FieldError[];
          error?: string;
        };
        error = b.error ?? exception.name;

        if (b.errors?.length) {
          // Kegagalan validasi: terjemahkan setiap field.
          fieldErrors = b.errors.map((f) => ({
            ...f,
            message: translate(f.code, locale),
          }));
          code = b.code ?? 'validation.failed';
        } else {
          code = b.code ?? firstString(b.message) ?? exception.message;
        }
      }

      error = error === 'InternalServerError' ? statusName(status) : error;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      ({ status, code, error } = mapPrismaError(exception));
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} → ${status}`, exception);
    }

    res.status(status).json({
      statusCode: status,
      code: isMessageCode(code) ? code : undefined,
      message: buildMessage(code, fieldErrors, locale),
      ...(fieldErrors ? { errors: fieldErrors } : {}),
      error,
      path: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string | undefined,
    });
  }
}

/**
 * Pesan utama. Untuk kegagalan validasi, pesan field pertama jauh lebih
 * berguna bagi pengguna daripada kalimat umum "periksa isian Anda".
 */
function buildMessage(
  code: string,
  fieldErrors: FieldError[] | undefined,
  locale: ApiLocale,
): string {
  if (fieldErrors?.length) return fieldErrors[0].message;
  return translate(code, locale);
}

function firstString(message?: string | string[]): string | undefined {
  if (!message) return undefined;
  return Array.isArray(message) ? message[0] : message;
}

function statusName(status: number): string {
  return (
    {
      400: 'BadRequest',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'NotFound',
      409: 'Conflict',
      422: 'UnprocessableEntity',
      429: 'TooManyRequests',
    }[status] ?? 'Error'
  );
}

function mapPrismaError(e: Prisma.PrismaClientKnownRequestError): {
  status: number;
  code: string;
  error: string;
} {
  switch (e.code) {
    case 'P2002':
      return { status: HttpStatus.CONFLICT, code: 'db.duplicate', error: 'Conflict' };
    case 'P2025':
      return { status: HttpStatus.NOT_FOUND, code: 'record.notFound', error: 'NotFound' };
    case 'P2003':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'db.invalidReference',
        error: 'BadRequest',
      };
    default:
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'db.error',
        error: 'DatabaseError',
      };
  }
}
