import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { appSettings } from '../../settings/app-settings';

@Injectable()
export class AccessTokenAuthGuard implements CanActivate {
  constructor(
    /*private readonly configService: ConfigService*/
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      //const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, {
        secret: appSettings.api.JWT_ACCESS_TOKEN_SECRET,
      });

      //console.log('user id from guard: ', payload.sub);
      // Attach userId to the request object
      request.userId = payload.sub;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // Helper method to extract the Bearer token from the request header
  private extractTokenFromHeader(request: Request): string | null {
    const authorizationHeader = request.headers['authorization'];
    if (!authorizationHeader) {
      return null;
    }

    const [type, token] = authorizationHeader.split(' ');

    return type === 'Bearer' ? token : null;
  }
}
