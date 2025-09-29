import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';

export type CustomJwtPayloadAccessToken = {
  userId: string;
};

export type CustomJwtPayload = {
  userId: string;
  deviceId: string;
  iat: number;
  exp: number;
};

@Injectable()
export class JwtService {
  constructor() {}

  async createAccessToken(userId: string) {
    const JWT_SECRET = '123';

    const accessToken = jwt.sign({ userId: userId }, JWT_SECRET, {
      expiresIn: '15min',
    });

    return accessToken;
  }

  async createRefreshToken(userId: string, deviceId: string, iat: Date) {
    const JWT_SECRET = '321';

    const refreshToken = jwt.sign(
      { userId: userId, deviceId: deviceId, iat: iat.getTime() },
      JWT_SECRET,
      { expiresIn: '24h' },
    );

    return refreshToken;
  }

  async getPayloadFromRefreshToken(refreshToken: string) {
    return jwt.decode(refreshToken) as CustomJwtPayload;
  }

  async getPayloadFromAccessToken(accessToken: string) {
    return jwt.decode(accessToken) as CustomJwtPayloadAccessToken;
  }

  async getPayloadAndVerifyAccessToken(accessToken: string) {
    const JWT_SECRET = '123';

    return jwt.verify(accessToken, JWT_SECRET) as CustomJwtPayloadAccessToken;
  }
}
