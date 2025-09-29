import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../../feature/users/application/users.service';
import { JwtService } from '@nestjs/jwt';
import { appSettings } from '../../settings/app-settings';

@Injectable()
export class AttachUserIdGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    // Extract the token or any other way to identify the user
    const authToken = request.headers['authorization']?.split(' ')[1];

    if (authToken) {
      try {
        const payload = await this.jwtService.verifyAsync(authToken, {
          secret: appSettings.api.JWT_ACCESS_TOKEN_SECRET,
        });

        if (payload) {
          request['userId'] = payload.sub;
        } else {
          request['userId'] = null;
        }
      } catch (error) {
        // In case of any error, set userId to null
        request['userId'] = null;
      }
    } else {
      // No token provided, set userId to null
      request['userId'] = null;
    }

    // Always return true to not block the request
    return true;
  }
}
