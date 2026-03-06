import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { NatsClientWrapper } from '../nats/nats-client-wrapper.service';
import { AuthGuard } from './auth.guard';

interface AuthenticatedRequest extends Request {
  user?: { sub: string };
}

interface RpcError {
  message: string;
  statusCode: number;
}


@Injectable()
export class ParticipantGuard implements CanActivate {
  constructor(private readonly natsClient: NatsClientWrapper) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user?.sub) {
      throw new UnauthorizedException(
        'User not authenticated. AuthGuard must be applied first.',
      );
    }

    const userId = request.user.sub;

    const seanceId = request.params.id;
    if (!seanceId) {
      throw new ForbiddenException('Session ID is required');
    }

    try {
      const isAuthorized = await this.isUserAuthorized(seanceId, userId);

      if (!isAuthorized) {
        throw new ForbiddenException(
          'You do not have access to this session data',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      if (error && typeof error === 'object' && 'message' in error) {
        const rpcError = error as RpcError;
        throw new ForbiddenException(
          rpcError.message || 'Authorization check failed',
        );
      }
      throw new ForbiddenException('Authorization check failed');
    }
  }

  private async isUserAuthorized(
    seanceId: string,
    userId: string,
  ): Promise<boolean> {
    const payload = { seanceId, userId };

    try {
      const result = (await firstValueFrom(
        this.natsClient.send('seances.checkParticipant', payload),
      )) as { isAuthorized: boolean };

      return result.isAuthorized;
    } catch (error) {
      return false;
    }
  }
}
