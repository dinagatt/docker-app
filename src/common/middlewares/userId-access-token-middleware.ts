import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersRepository } from '../../feature/users/infrastructure/users.repository';
import { JwtService } from '../utils/adapters/jwt.service';
import { UserEntity } from '../../feature/users/domain/sql/user.entity';

@Injectable()
export class AccessTokenMiddleware implements NestMiddleware {
  constructor(
    protected usersRepository: UsersRepository,
    protected jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Check if authorization header exists
    if (!req.headers.authorization) {
      req.userId = null; // No token provided, set user to null
      return next();
    }

    try {
      // Extract token from header
      const token = req.headers.authorization.split(' ')[1];

      // Get the payload from the token
      const payload =
        await this.jwtService.getPayloadAndVerifyAccessToken(token);

      if (payload) {
        const userId = payload.userId;

        // Find the user by ID
        const user: UserEntity | null =
          await this.usersRepository.findById(userId);

        if (user) {
          req.userId = user.id.toString(); // Attach user object to request
        } else {
          req.userId = null; // User not found
        }
      } else {
        req.userId = null; // Invalid token payload
      }
    } catch (error) {
      console.error('Error in AccessTokenMiddleware:', error);
      req.userId = null; // Set user to null if there was an error
    }

    return next();
  }
}
