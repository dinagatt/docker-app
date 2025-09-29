import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

// https://docs.nestjs.com/middleware
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Request... in LoggerMiddleware');

    next();
  }
}

// Функциональный middleware
// https://docs.nestjs.com/middleware#functional-middleware
export const LoggerMiddlewareFunc = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log('Request... LoggerMiddlewareFunc');
  next();
};
