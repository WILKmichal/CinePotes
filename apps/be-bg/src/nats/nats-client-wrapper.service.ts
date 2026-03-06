import { Injectable, Inject, Scope } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { logNatsMessage } from '@workspace/logger';

/**
 * Wrapper service for NATS client that automatically injects requestId
 * Note: NATS in NestJS doesn't support custom headers in standard ClientProxy.
 * This wrapper logs the requestId for tracing but doesn't inject it into messages.
 * RequestId must be passed in message payload for proper tracing.
 */
@Injectable({ scope: Scope.REQUEST })
export class NatsClientWrapper {
  constructor(
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  private attachRequestId<TInput>(data: TInput, requestId?: string): TInput {
    if (!requestId) return data;
    if (data === null || data === undefined) return data;
    if (typeof data !== 'object' || Array.isArray(data)) return data;

    return {
      ...(data as Record<string, unknown>),
      requestId,
    } as TInput;
  }

  /**
   * Send a message via NATS with requestId in headers
   */
  send<TResult = any, TInput = any>(
    pattern: string,
    data: TInput,
  ): Observable<TResult> {
    const requestId = (this.request as any).requestId;
    
    logNatsMessage('be-bg', pattern, 'send', requestId);
    
    const payload = this.attachRequestId(data, requestId);
    return this.natsClient.send<TResult, TInput>(pattern, payload);
  }

  /**
   * Emit an event via NATS with requestId in headers
   */
  emit<TResult = any, TInput = any>(
    pattern: string,
    data: TInput,
  ): Observable<TResult> {
    const requestId = (this.request as any).requestId;
    
    logNatsMessage('be-bg', pattern, 'send', requestId);
    
    const payload = this.attachRequestId(data, requestId);
    return this.natsClient.emit<TResult, TInput>(pattern, payload);
  }
}
