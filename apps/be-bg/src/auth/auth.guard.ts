import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { NatsClientWrapper } from '../nats/nats-client-wrapper.service';

/**
 * Payload JWT typé
 * (doit matcher ce que tu mets dans JwtStrategy)
 */
interface JwtPayload {
  sub: string;
  email?: string;
  username?: string;
}

/**
 * Extension typée de Request pour y ajouter user
 */
interface RequestWithUser extends Request {
  user?: JwtPayload;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly natsClient: NatsClientWrapper,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await firstValueFrom(
        this.natsClient.send<JwtPayload>('auth.verify-token', { token }),
      );

      request.user = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
