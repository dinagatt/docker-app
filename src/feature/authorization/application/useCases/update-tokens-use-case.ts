import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { SessionsRepository } from '../../../sessions/infrastructure/sessions.repository';
import { appSettings } from '../../../../settings/app-settings';

export class UpdateTokensCommand {
  constructor(
    public userId: string,
    public deviceId: string,
  ) {}
}

@CommandHandler(UpdateTokensCommand)
export class UpdateTokensUseCase
  implements ICommandHandler<UpdateTokensCommand>
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async execute(
    command: UpdateTokensCommand,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const userId = command.userId;
    const deviceId = command.deviceId;

    const accessToken2 = await this.createAccessToken(userId);
    const refreshToken2 = await this.createRefreshToken(userId, deviceId);
    if (!accessToken2 || !refreshToken2) return null;

    //Update Issue and Expiration Date of Session in db
    const payloadFromRefreshToken2 =
      await this.jwtService.decode(refreshToken2);

    const result: boolean = await this.sessionsRepository.updateIatExp(
      payloadFromRefreshToken2.sub,
      payloadFromRefreshToken2.deviceId,
      payloadFromRefreshToken2.iat,
      payloadFromRefreshToken2.exp,
    );
    if (!result) return null;

    return { accessToken: accessToken2, refreshToken: refreshToken2 };
  }

  private async createAccessToken(userId: string): Promise<string | null> {
    const accessTokenPayload = { sub: userId };
    const accessToken = await this.jwtService.signAsync(accessTokenPayload, {
      secret: appSettings.api.JWT_ACCESS_TOKEN_SECRET,
      expiresIn: appSettings.api.ACCESS_TOKEN_LIFE_TIME,
    });

    if (!accessToken) return null;
    return accessToken;
  }

  private async createRefreshToken(
    userId: string,
    deviceId: string,
  ): Promise<string | null> {
    const refreshTokenPayload = { sub: userId, deviceId: deviceId };

    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      secret: appSettings.api.JWT_REFRESH_TOKEN_SECRET,
      expiresIn: appSettings.api.REFRESH_TOKEN_LIFE_TIME,
    });

    if (!refreshToken) return null;
    return refreshToken;
  }
}
