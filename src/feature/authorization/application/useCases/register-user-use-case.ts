import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { CryptoService } from '../../../../common/utils/adapters/crypto.service';
import { EmailAdapter } from '../../../../common/utils/adapters/email.adapter';
import { RegistrationInputModel } from '../../api/models/input/input.models';
import { uuid } from 'uuidv4';
import { add } from 'date-fns';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserDTO } from '../../../users/application/DTOs/userDTO';
import { UserEmailConfirmationInfoDTO } from '../../../users/application/DTOs/userEmailConfirmationInfoDTO';

export class RegisterUserCommand {
  constructor(public createModel: RegistrationInputModel) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cryptoService: CryptoService,
    private readonly emailAdapter: EmailAdapter,
  ) {}
  async execute(command: RegisterUserCommand): Promise<boolean> {
    const confirmationCode = await this.createUser(command.createModel);
    if (!confirmationCode) return false;

    const isEmailSent = this.sendEmail(
      confirmationCode,
      command.createModel.email,
    );
    if (!isEmailSent) {
      return false;
    } else {
      return true;
    }
  }

  private async createUser(createModel: RegistrationInputModel) {
    const generatedPasswordHash = await this.cryptoService._generateHash(
      createModel.password,
    );
    if (!generatedPasswordHash) return null;

    const newUser: UserDTO = {
      login: createModel.login,
      passwordHash: generatedPasswordHash,
      email: createModel.email,
      isConfirmed: false,
      createdAt: new Date(),
    };

    const userId = await this.usersRepository.createUser(newUser);
    if (!userId) return null;

    const emailConfirmationInfo: UserEmailConfirmationInfoDTO = {
      userId: userId,
      confirmationCode: uuid(),
      expirationDate: add(new Date(), {
        hours: 1,
        //minutes: 1
      }),
    };

    const confirmationCode =
      await this.usersRepository.createUserEmailConfirmationInfo(
        emailConfirmationInfo,
      );
    if (!confirmationCode) return null;

    return confirmationCode;
  }

  private sendEmail(confirmationCode: string, email: string): boolean {
    try {
      const msg = `<a href="https://somesite.com/confirm-email?code=${confirmationCode}"> Link</a>`;
      const subject = 'Yo!';

      this.emailAdapter.sendEmail(email, subject, msg);
    } catch (error) {
      console.error(error, 'Cannot send an email with confirmation code');
      return false;
    }

    return true;
  }
}
