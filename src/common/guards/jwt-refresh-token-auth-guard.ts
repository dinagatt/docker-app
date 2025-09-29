import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { appSettings } from '../../settings/app-settings';
import { UsersRepository } from '../../feature/users/infrastructure/users.repository';
import { SessionsRepository } from '../../feature/sessions/infrastructure/sessions.repository';

@Injectable()
export class RefreshTokenAuthGuard implements CanActivate {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    try {
      // Verify token using the JWT service
      const decoded = this.jwtService.verify(refreshToken, {
        secret: appSettings.api.JWT_REFRESH_TOKEN_SECRET,
      });
      // if (!decoded) {
      //   throw new UnauthorizedException('Token was not verified');
      // }

      // Iat from refresh token
      const iatFromRefreshToken = decoded.iat;

      // Get the stored iat from the session based on refresh token
      const session = await this.sessionsRepository.findSessionByDeviceId(
        decoded.deviceId,
      );
      //console.log('LOG: ', session!.iat.getTime(), iatFromRefreshToken * 1000); // COMMENT OUT
      // If session does not exist or iat does not match, deny access
      if (
        session === null ||
        session.iat.getTime() !== iatFromRefreshToken * 1000
      ) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Check if the user exists
      const user = await this.usersRepository.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach the userId or other relevant info to the request object for further use
      request.userIdDeviceId = {
        userId: decoded.sub,
        deviceId: decoded.deviceId,
      };

      // If everything is valid, grant access
      return true;
    } catch (error) {
      // if (error.name === 'TokenExpiredError') {
      //   throw new UnauthorizedException('Refresh token expired');
      // }
      // if (error.name === 'JsonWebTokenError') {
      //   throw new UnauthorizedException('Invalid token');
      // }

      console.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
