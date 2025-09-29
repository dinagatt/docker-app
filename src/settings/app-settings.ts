import { config } from 'dotenv';

config();

export type EnvironmentVariable = { [key: string]: string | undefined };

export type EnvironmentsTypes =
  | 'DEVELOPMENT'
  | 'STAGING'
  | 'PRODUCTION'
  | 'TESTING';

export const Environments = ['DEVELOPMENT', 'STAGING', 'PRODUCTION', 'TESTING'];

export class EnvironmentSettings {
  constructor(private env: EnvironmentsTypes) {}

  getEnv() {
    return this.env;
  }

  isProduction() {
    return this.env === 'PRODUCTION';
  }

  isStaging() {
    return this.env === 'STAGING';
  }

  isDevelopment() {
    return this.env === 'DEVELOPMENT';
  }

  isTesting() {
    return this.env === 'TESTING';
  }
}

class APISettings {
  //Application
  public readonly APP_PORT: number;
  public readonly JWT_ACCESS_TOKEN_SECRET: string;
  public readonly JWT_REFRESH_TOKEN_SECRET: string;
  public readonly ACCESS_TOKEN_LIFE_TIME: string;
  public readonly REFRESH_TOKEN_LIFE_TIME: string;
  public readonly ADMIN_LOGIN: string;
  public readonly ADMIN_PASSWORD: string;

  //Database
  public readonly MONGO_CONNECTION_URI: string;
  public readonly MONGO_CONNECTION_URI_FOR_TESTS: string;

  constructor(private readonly envVariables: EnvironmentVariable) {
    // Application
    this.APP_PORT = this.getNumberOrDefault(
      envVariables.APP_PORT as string,
      3005,
    );
    // @ts-ignore
    this.JWT_ACCESS_TOKEN_SECRET =
      envVariables.JWT_ACCESS_TOKEN_SECRET ?? '123';
    this.JWT_REFRESH_TOKEN_SECRET =
      envVariables.JWT_REFRESH_TOKEN_SECRET ?? '321';
    this.ACCESS_TOKEN_LIFE_TIME = envVariables.ACCESS_TOKEN_LIFE_TIME ?? '5min';
    this.REFRESH_TOKEN_LIFE_TIME =
      envVariables.REFRESH_TOKEN_LIFE_TIME ?? '20min';
    this.ADMIN_LOGIN = envVariables.ADMIN_LOGIN ?? 'admin';
    this.ADMIN_PASSWORD = envVariables.ADMIN_PASSWORD ?? 'qwerty';

    // Database
    this.MONGO_CONNECTION_URI =
      envVariables.MONGO_CONNECTION_URI ??
      'mongodb+srv://dinaabdeeva:daWiTvyJCg7i3sDm@cluster0.yidokys.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    /*this.MONGO_CONNECTION_URI_FOR_TESTS =
      envVariables.MONGO_CONNECTION_URI_FOR_TESTS ?? 'mongodb://localhost/test';*/
  }

  private getNumberOrDefault(value: string, defaultValue: number): number {
    const parsedValue = Number(value);
    if (isNaN(parsedValue)) {
      return defaultValue;
    }
    return parsedValue;
  }
}

export class AppSettings {
  constructor(
    public env: EnvironmentSettings,
    public api: APISettings,
  ) {}
}

const env = new EnvironmentSettings(
  (Environments.includes(process.env.ENV?.trim() || '')
    ? process.env.ENV?.trim()
    : 'DEVELOPMENT') as EnvironmentsTypes,
);
const api = new APISettings(process.env);
export const appSettings = new AppSettings(env, api);
