import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../../sessions/infrastructure/sessions.repository';

export class LogOutCommand {
  constructor(public deviceId: string) {}
}

@CommandHandler(LogOutCommand)
export class LogOutUseCase implements ICommandHandler<LogOutCommand> {
  constructor(private sessionsRepository: SessionsRepository) {}

  async execute(command: LogOutCommand): Promise<boolean> {
    return await this.sessionsRepository.deleteSessionByDeviceId(
      command.deviceId,
    );
  }
}
