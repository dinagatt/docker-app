import { CryptoService } from '../../../common/utils/adapters/crypto.service';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../users/infrastructure/users.repository';
import { uuid } from 'uuidv4';
import { EmailAdapter } from '../../../common/utils/adapters/email.adapter';
import { NewPasswordRecoveryInputModel } from '../api/models/input/input.models';
import { add } from 'date-fns';
import { UserEmailConfirmationInfo } from '../../users/domain/TypeORM/userEmailConfirmationInfo.entity';
import { User } from '../../users/domain/TypeORM/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cryptoService: CryptoService,
    private readonly emailAdapter: EmailAdapter,
  ) {}

  async verifyUser(
    loginOrEmail: string,
    password: string,
  ): Promise<string | null> {
    const user: User | null =
      await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) return null;

    const passwordCheck = await this.cryptoService._comparePasswords(
      password,
      user.passwordHash,
    );

    if (!passwordCheck) return null;

    return user.id;
  }

  /*async createTokensAndSession(
    userId: string /!*, deviceName: string, ip: string*!/,
  ) {
    //Create Access Token
    const accessTokenPayload = { sub: userId };
    const accessToken = await this.jwtService.signAsync(accessTokenPayload);
    if (!accessToken) return null;

    //Create Refresh Token
    const deviceId = uuid();
    const refreshTokenPayload = { sub: userId, deviceId: deviceId };
    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload);
    if (!refreshToken) return null;

    /!*!//Create Session
    const payload = await this.jwtService.decode(refreshToken);

    const createdSession = await this.devicesRepository.createSession(
      userId,
      payload.deviceId,
      deviceName,
      ip,
      payload.iat,
      payload.exp,
    );
    if (!createdSession) return null;*!/

    return { accessToken, refreshToken };
  }

  async registerUser(createModel: RegistrationInputModel): Promise<boolean> {
    /!*const userByLogin: UserDocument | null =
      await this.usersRepository.findByLoginOrEmail(createModel.login);
    if (userByLogin) {
      return false;
    }

    const userByEmail: UserDocument | null =
      await this.usersRepository.findByLoginOrEmail(createModel.email);
    if (userByEmail) {
      return false;
    }*!/

    const generatedPasswordHash = await this.cryptoService._generateHash(
      createModel.password,
    );
    if (!generatedPasswordHash) return false;

    const newUser: UserSqlDTO = {
      login: createModel.login,
      passwordHash: generatedPasswordHash,
      email: createModel.email,
      createdAt: new Date(),
      isConfirmed: false,
    };

    /!*MONGOOSE
    const newUser: User = {
      //Omit<'_id'>???
      _id: new ObjectId(),
      login: createModel.login,
      passwordHash: generatedPasswordHash,
      email: createModel.email,
      createdAt: new Date().toISOString(),
      isConfirmed: false,
    };*!/

    const userId = await this.usersRepository.createUser(newUser);
    if (!userId) return false;

    const emailConfirmationInfo: UserEmailConfirmationInfoSqlDTO = {
      userId: userId,
      confirmationCode: uuid(),
      expirationDate: add(new Date(), {
        hours: 1,
        //minutes: 1
      }).toISOString(),
    };

    /!*MONGOOSE
    const emailConfirmationInfo: UserEmailConfirmation = {
      _id: new ObjectId(),
      userId: userId,
      confirmationCode: uuid(),
      expirationDate: add(new Date(), {
        hours: 1,
        //minutes: 1
      }).toISOString(),
    };*!/

    const confirmationCode =
      await this.usersRepository.createUserEmailConfirmationInfo(
        emailConfirmationInfo,
      );
    if (!confirmationCode) return false;

    try {
      const msg = `<a href="https://somesite.com/confirm-email?code=${confirmationCode}"> Link</a>`;
      const subject = 'Yo!';

      await this.emailAdapter.sendEmail(createModel.email, subject, msg);
    } catch (error) {
      console.error(error, 'Cannot send an email with confirmation code');
      return false;
    }

    return true;
  }*/

  async confirmEmail(code: string): Promise<boolean> {
    const userEmailConfirmationInfo: UserEmailConfirmationInfo | null =
      await this.usersRepository.findUserEmailConfirmationInfoByConfirmationCode(
        code,
      );
    if (!userEmailConfirmationInfo) {
      return false;
    }

    /*const user: UserDocument | null = await this.usersRepository.findById(
      userEmailConfirmationInfo._id.toString(),
    );
    if (!user) {
      return false;
    }

    if (user.isConfirmed === true) {
      return false;
    }

    if (new Date(userEmailConfirmationInfo.expirationDate) < new Date()) {
      return false;
    }*/

    const result = await this.usersRepository.confirmUser(
      userEmailConfirmationInfo.userId,
    );

    return result !== false;
  }

  async resendConfirmationCode(email: string) {
    const user: User | null =
      await this.usersRepository.findByLoginOrEmail(email);
    if (!user) {
      return false; //email/login is not in our system
    }

    /*if (user.isConfirmed === true) {
      return false; //User is already confirmed
    }*/

    const newConfirmationCode = uuid();
    const expDate = add(new Date(), {
      hours: 1,
      //minutes: 1
    });
    //console.log(user.id, newConfirmationCode, expDate); //COMMENT OUT
    const updateResult = await this.usersRepository.updateConfirmationCode(
      user.id,
      newConfirmationCode,
      expDate,
    );
    //console.log(updateResult); //COMMENT OUT
    if (!updateResult) {
      return false; // Cannot update confirmation code
    }

    try {
      const msg = `<a href="https://somesite.com/confirm-email?code=${newConfirmationCode}"> Link</a>`;
      const subject = 'Yo!';
      this.emailAdapter.sendEmail(email, subject, msg);
    } catch (e: unknown) {
      console.error('Error occurred while resending confirmation code', e);
      return false; //Cannot send email
    }
    return true;
  }

  async recoverPassword(email: string) {
    const existingUser: User | null =
      await this.usersRepository.findUserByEmail(email);
    if (!existingUser) return false;

    if (existingUser) {
      const recoveryCode = uuid();
      const expDate = add(new Date(), {
        hours: 1,
        //minutes: 1
      });

      const updatedRecoveryCode =
        await this.usersRepository.updateConfirmationCode(
          existingUser.id,
          recoveryCode,
          expDate,
        );
      if (!updatedRecoveryCode) return false;

      try {
        const msg = `<a href="https://somesite.com/password-recovery?recoveryCode=${recoveryCode}"> Link</a>`;
        const subject = 'Yo!';
        await this.emailAdapter.sendEmail(email, subject, msg);
      } catch (e) {
        console.error('Error occurred while resending recovery code', e);
        return false;
      }
    }

    return true;
  }

  async confirmPasswordRecovery(
    inputModel: NewPasswordRecoveryInputModel,
  ): Promise<boolean> {
    const userEmailConfirmationInfo: UserEmailConfirmationInfo | null =
      await this.usersRepository.findUserEmailConfirmationInfoByConfirmationCode(
        inputModel.recoveryCode,
      );
    if (!userEmailConfirmationInfo) {
      //console.log('User was not found by confirmation code');
      return false;
    }

    const newPasswordHash = await this.cryptoService._generateHash(
      inputModel.newPassword,
    );
    if (!newPasswordHash) return false;

    return await this.usersRepository.updatePassword(
      userEmailConfirmationInfo.userId,
      newPasswordHash,
    );
  }
}
