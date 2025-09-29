import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const responseBody: any = exception.getResponse();

    //console.log('response', responseBody);

    if (
      status === HttpStatus.BAD_REQUEST ||
      status === HttpStatus.UNAUTHORIZED ||
      status === HttpStatus.FORBIDDEN
    ) {
      const errorsResponse = {
        errorsMessages: [],
      };

      if (Array.isArray(responseBody.message)) {
        responseBody.message.forEach((e) =>
          // @ts-ignore
          errorsResponse.errorsMessages.push(e),
        );
      } else {
        // @ts-ignore
        errorsResponse.errorsMessages.push(responseBody.message);
      }

      response.status(status).send(errorsResponse);
    } else {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}

//IF WE NEED A FILTER THAT CATCHES ALL 'THROW ERROR's
@Catch()
export class AllErrorsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    console.log(exception.message);

    response.status(status).json({
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: 'Internal Server Error',
    });
  }
}
