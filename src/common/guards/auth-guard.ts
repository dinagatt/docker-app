import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

// Custom guard
// https://docs.nestjs.com/guards
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.query['token'] !== '123') {
      // Если нужно выкинуть custom ошибку с кодом 401
      throw new UnauthorizedException();

      // default error 403
      return false;
    }

    return true;
  }
}
