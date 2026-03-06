import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logHttpRequest } from '@workspace/logger';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Middleware that generates a unique request ID for each incoming HTTP request
 * Runs before guards to ensure request.requestId is available in AuthGuard
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const requestId = randomUUID();
    
    // Store requestId in request object for access in controllers and guards
    (request as any).requestId = requestId;
    
    // Also store in headers for potential forwarding
    request.headers[REQUEST_ID_HEADER] = requestId;
    
    const method = request.method;
    const path = request.url;
    
    // Log the incoming HTTP request
    logHttpRequest('be-bg', method, path, requestId);
    
    next();
  }
}
