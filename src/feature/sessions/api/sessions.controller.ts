import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RefreshTokenAuthGuard } from '../../../common/guards/jwt-refresh-token-auth-guard';
import { Request } from 'express';
import { SessionsQueryRepository } from '../infrastructure/sessions.query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteUnusedSessionsCommand } from '../application/useCases/delete-unused-sessions-use-case';
import {
  DomainError,
  ForbiddenError,
  Result,
  SessionNotFoundError,
} from '../../../common/utils/result-type/result-type';
import { DeleteSessionByDeviceIdCommand } from '../application/useCases/delete-session-by-deviceId-use-case';

@Controller('security/devices')
export class SessionsController {
  constructor(
    private readonly sessionsQueryRepository: SessionsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @UseGuards(RefreshTokenAuthGuard)
  async getAllActiveSessions(@Req() req: Request) {
    const { userId } = req.userIdDeviceId;

    const result =
      await this.sessionsQueryRepository.getAllActiveSessions(userId);

    if (!result) {
      throw new Error('No active session found');
    }
    return result;
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenAuthGuard)
  async deleteAllSessionExceptCurrent(@Req() req: Request) {
    const { userId, deviceId } = req.userIdDeviceId;
    const result: boolean = await this.commandBus.execute(
      new DeleteUnusedSessionsCommand(userId, deviceId),
    );

    if (!result) {
      throw new Error('Could not delete sessions');
    }
  }

  @Delete(':deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenAuthGuard)
  async deleteSpecifiedSession(
    @Req() req: Request,
    @Param('deviceId') deviceId: string,
  ) {
    const userId = req.userIdDeviceId.userId;
    const result: Result<void, DomainError> = await this.commandBus.execute(
      new DeleteSessionByDeviceIdCommand(userId, deviceId),
    );

    if (result.success) {
      return;
    }

    if (result.error instanceof SessionNotFoundError) {
      throw new HttpException(result.error.message, HttpStatus.NOT_FOUND);
    }

    if (result.error instanceof ForbiddenError) {
      throw new HttpException(result.error.message, HttpStatus.FORBIDDEN);
    }

    throw new HttpException(
      'Internal Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
