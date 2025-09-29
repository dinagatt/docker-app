import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';

export class DeleteUnusedSessionsCommand {
  constructor(
    public userId: string,
    public deviceId: string,
  ) {}
}

@CommandHandler(DeleteUnusedSessionsCommand)
export class DeleteUnusedSessionsUseCase
  implements ICommandHandler<DeleteUnusedSessionsCommand>
{
  constructor(private sessionsRepository: SessionsRepository) {}

  async execute(command: DeleteUnusedSessionsCommand): Promise<boolean> {
    const userId = command.userId;
    const currentDeviceId = command.deviceId;

    return await this.sessionsRepository.deleteAllSessionsExceptCurrent(
      userId,
      currentDeviceId,
    );
  }
}
