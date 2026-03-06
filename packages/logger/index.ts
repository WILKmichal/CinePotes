import { LOG_EMOJI } from './emoji.constants';
import { colorizeRequestId } from './color-mapper';

export { LOG_EMOJI };
export { extractRequestId } from './extract-request-id';
export { colorizeRequestId, getColorForRequestId } from './color-mapper';


function formatLog(
  emoji: string,
  serviceName: string,
  message: string,
  requestId?: string,
): string {
  const timestamp = new Date().toISOString();
  const reqId = requestId ? colorizeRequestId(requestId) : '[no-request-id]';
  return `${emoji} [${timestamp}] [${serviceName}] ${reqId} ${message}`;
}


export function logStart(serviceName: string, message: string): void {
  console.log(formatLog(LOG_EMOJI.APP_START, serviceName, message));
}

export function logAction(
  serviceName: string,
  message: string,
  requestId?: string,
): void {
  console.log(formatLog(LOG_EMOJI.ACTION_START, serviceName, message, requestId));
}

export function logSuccess(
  serviceName: string,
  message: string,
  requestId?: string,
): void {
  console.log(formatLog(LOG_EMOJI.SUCCESS, serviceName, message, requestId));
}

export function logError(
  serviceName: string,
  message: string,
  requestId?: string,
  error?: Error | unknown,
): void {
  console.log(formatLog(LOG_EMOJI.ERROR, serviceName, message, requestId));
  if (error instanceof Error && error.stack) {
    console.log(`  Stack: ${error.stack}`);
  } else if (error) {
    console.log(`  Error details: ${JSON.stringify(error)}`);
  }
}

export function logCustom(
  emoji: string,
  serviceName: string,
  message: string,
  requestId?: string,
): void {
  console.log(formatLog(emoji, serviceName, message, requestId));
}

export function logHttpRequest(
  serviceName: string,
  method: string,
  path: string,
  requestId: string,
): void {
  console.log(
    formatLog(
      LOG_EMOJI.ACTION_START,
      serviceName,
      `${method} ${path}`,
      requestId,
    ),
  );
}

export function logNatsMessage(
  serviceName: string,
  pattern: string,
  direction: 'send' | 'receive',
  requestId?: string,
): void {
  console.log(
    formatLog(
      LOG_EMOJI.ACTION_START,
      serviceName,
      `${direction === 'send' ? 'Sending' : 'Received'} ${pattern}`,
      requestId,
    ),
  );
}

export function logDatabase(
  serviceName: string,
  operation: string,
  entity: string,
  requestId?: string,
): void {
  console.log(
    formatLog(
      LOG_EMOJI.ACTION_START,
      serviceName,
      `${operation} ${entity}`,
      requestId,
    ),
  );
}

export function logExternalApi(
  serviceName: string,
  apiName: string,
  endpoint: string,
  requestId?: string,
): void {
  console.log(
    formatLog(
      LOG_EMOJI.ACTION_START,
      serviceName,
      `Calling ${apiName} ${endpoint}`,
      requestId,
    ),
  );
}
