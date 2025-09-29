import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import {
  ForbiddenError,
  SessionNotFoundError,
} from '../../../../common/utils/result-type/result-type';

export class DeleteSessionByDeviceIdCommand {
  constructor(
    public userId: string,
    public deviceId: string,
  ) {}
}

@CommandHandler(DeleteSessionByDeviceIdCommand)
export class DeleteSessionByDeviceIdUseCase
  implements ICommandHandler<DeleteSessionByDeviceIdCommand>
{
  constructor(private sessionsRepository: SessionsRepository) {}

  async execute(command: DeleteSessionByDeviceIdCommand) {
    const session = await this.sessionsRepository.findSessionByDeviceId(
      command.deviceId,
    );
    if (!session) {
      return { success: false, error: new SessionNotFoundError() };
    }

    if (session.userId !== command.userId) {
      return { success: false, error: new ForbiddenError() };
    }

    await this.sessionsRepository.deleteSessionByDeviceId(command.deviceId);
    return { success: true, value: undefined };
  }
}
