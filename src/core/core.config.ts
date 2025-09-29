import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNumber } from 'class-validator';
import { configValidationUtility } from './config-validation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

@Injectable()
export class CoreConfig {
  constructor(private configService: ConfigService) {
    /*const errors = validateSync(this);
    if (errors.length > 0) {
      throw new Error('Validation failed: ' + errors.toString());
    }*/
    configValidationUtility.validateConfig(this);
  }

  @IsNumber(
    {},
    {
      message: 'Set env variable APP_PORT, eg: 3000',
    },
  )
  port: number = Number(
    this.configService.get('APP_PORT'),
  ) /*Number(process.env.APP_PORT)*/;

  /* Mongo env
  @IsNotEmpty({
    message:
      'Set env variable MONGO_CONNECTION_URI, eg: mongodb://localhost:27017/my-app-local-db',
  })
  mongoURI: string = this.configService.get(
    'MONGO_CONNECTION_URI',
  )! /!*process.env.MONGO_CONNECTION_URI!*!/;*/

  /*@IsEnum(Environments, {
    message:
      'Set correct NODE_ENV value, available values: ' +
      configValidationUtility.getEnumValues(Environments).join(', '),
  })
  env: string = this.configService.get('NODE_ENV');

  @IsBoolean({
    message:
      'Set Env variable IS_SWAGGER_ENABLED to enable/disable Swagger, example: true, available values: true, false',
  })
  isSwaggerEnabled: boolean = configValidationUtility.convertToBoolean(
    this.configService.get('IS_SWAGGER_ENABLED'),
  );

  @IsBoolean({
    message:
      'Set env variable INCLUDE_TESTING_MODULE to enable/disable Dangerous for production TestingModule, example: true, available values: true, false, 0, 1',
  })
  includeTestingModule: boolean = configValidationUtility.convertToBoolean(
    this.configService.get('INCLUDE_TESTING_MODULE'),
  );*/
}
