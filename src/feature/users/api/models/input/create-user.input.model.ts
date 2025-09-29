import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Trim } from '../../../../../common/decorators/transform/trim';
import { UniqueEmail } from '../../../../../common/decorators/validate/unique-email';
import { UniqueLogin } from '../../../../../common/decorators/validate/unique-login';

export class UserInputModel {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @Matches(/^[a-zA-Z0-9_-]*$/)
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
