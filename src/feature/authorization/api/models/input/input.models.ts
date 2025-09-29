import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Trim } from '../../../../../common/decorators/transform/trim';
import { RegisteredNonConfirmedEmail } from '../../../../../common/decorators/validate/existing-non-confirmed-email';
import { ConfirmationCodeFromEmail } from '../../../../../common/decorators/validate/confirmation-code-from-email';
import { UniqueLogin } from '../../../../../common/decorators/validate/unique-login';
import { UniqueEmail } from '../../../../../common/decorators/validate/unique-email';
export class LoginInputModel {
  @IsNotEmpty()
  @IsString()
  @Trim()
  loginOrEmail: string;

  @IsNotEmpty()
  @IsString()
  @Trim()
  password: string;
}

export class RegistrationInputModel {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @Length(3, 10)
  @UniqueLogin()
  login: string;

  @IsNotEmpty()
  @IsString()
  @Trim()
  @Length(6, 20)
  password: string;

  @IsNotEmpty()
  @IsString()
  @Trim()
  @IsEmail()
  @UniqueEmail()
  email: string;
}

export class RegistrationConfirmationCodeModel {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @ConfirmationCodeFromEmail() //validation => code that was sent via email inside link
  code: string;
}

export class RegistrationEmailResending {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @IsEmail()
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  @RegisteredNonConfirmedEmail() //validation => email of already registered but not confirmed user
  email: string;
}

export class PasswordRecoveryInputModel {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @IsEmail()
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  //@RegisteredEmail() //validation => email of a registered user
  email: string;
}

export class NewPasswordRecoveryInputModel {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @Length(6, 20)
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @Trim()
  @ConfirmationCodeFromEmail() //validation => code that was sent via email inside link
  recoveryCode: string;
}
