import { randomUUID } from 'crypto';


interface MessageContext {
  getArgs(): unknown;
}


const HEALTH_CHECK_PATTERNS = ['health', 'ping', 'liveness', 'readiness'];

function isHealthCheck(pattern?: string): boolean {
  if (!pattern) return false;
  return HEALTH_CHECK_PATTERNS.some(hc => pattern.toLowerCase().includes(hc));
}

function extractPatternFromContext(context: MessageContext): string | undefined {
  try {
    const args = context.getArgs() as any;
    return args?.[0]?.subject;
  } catch {
    return undefined;
  }
}

/**
 * Extract request ID from NATS message context headers, or generate one if missing
 * For health checks, returns undefined to skip transaction ID coloring
 * @param context NATS context object from @Ctx() decorator
 * @param payload Optional payload for payload-based propagation fallback
 * @param pattern Optional message pattern to detect health checks (auto-extracted if not provided)
 * @returns RequestId string or undefined for health checks
 */
export function extractRequestId(
  context: MessageContext,
  payload?: unknown,
  pattern?: string,
): string | undefined {
  const messagePattern = pattern || extractPatternFromContext(context);
  if (isHealthCheck(messagePattern)) {
    return undefined;
  }

  try {
    const fromPayload = (payload as { requestId?: string } | undefined)?.requestId;
    if (fromPayload) return fromPayload;

    const args = context.getArgs() as any;
    const headers = args?.[0]?.headers;
    const fromHeaders = headers?.['x-request-id'];
    if (fromHeaders) return fromHeaders;

    const fromArgsPayload =
      (args?.[1] as { requestId?: string } | undefined)?.requestId ??
      (args?.[0]?.data as { requestId?: string } | undefined)?.requestId;

    if (fromArgsPayload) return fromArgsPayload;
  } catch {
    // c'est quoi comme type d'erreur ? on s'en fout, on veut juste pas que ça plante le logger
  }

  return randomUUID();
}
