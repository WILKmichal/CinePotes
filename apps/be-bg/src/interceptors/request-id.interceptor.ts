import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { logHttpRequest } from '@workspace/logger';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Interceptor that generates a unique request ID for each incoming HTTP request
 * and logs the request with the ID for tracing across microservices
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = randomUUID();
    
    // Store requestId in request object for access in controllers
    request.requestId = requestId;
    
    // Also store in headers for potential forwarding
    request.headers[REQUEST_ID_HEADER] = requestId;
    
    const method = request.method;
    const path = request.url;
    
    // Log the incoming HTTP request
    logHttpRequest('be-bg', method, path, requestId);
    
    return next.handle().pipe(
      tap({
        error: (error) => {
          // Error logging will be handled by exception filters
          // This just ensures the interceptor doesn't break
        },
      }),
    );
  }
}
