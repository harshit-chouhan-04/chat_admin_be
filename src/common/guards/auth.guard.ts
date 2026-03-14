import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from './no-auth.guard';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;
    const queryToken =
      typeof request.query?.token === 'string'
        ? request.query.token
        : undefined;
    const token = this.extractToken(authHeader) ?? queryToken;

    if (token) {
      try {
        const decoded = this.jwtService.verify(token);
        request['user'] = {
          ...decoded,
          id: decoded.id ?? decoded.sub,
        };
      } catch (error) {
        if (!isPublic) {
          console.log('err:', error);
          throw new UnauthorizedException('Invalid or expired token');
        }
      }
    } else if (!isPublic) {
      throw new UnauthorizedException('Authorization header missing');
    }

    return true;
  }

  private extractToken(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token.trim() || null;
  }
}
