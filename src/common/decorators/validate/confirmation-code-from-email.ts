import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../../feature/users/infrastructure/users.repository';
import { UserEmailConfirmationInfo } from '../../../feature/users/domain/TypeORM/userEmailConfirmationInfo.entity';
import { User } from '../../../feature/users/domain/TypeORM/user.entity';

@ValidatorConstraint({ name: 'ConfirmationCodeFromEmail', async: true })
@Injectable()
export class WrongConfirmationCodeConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly usersRepository: UsersRepository) {}
  async validate(value: any, args: ValidationArguments) {
    const userEmailConfirmationInfo: UserEmailConfirmationInfo | null =
      await this.usersRepository.findUserEmailConfirmationInfoByConfirmationCode(
        value,
      );
    if (!userEmailConfirmationInfo) {
      return false;
    }

    const user: User | null = await this.usersRepository.findById(
      userEmailConfirmationInfo.userId,
    );
    if (!user) {
      return false;
    }

    if (user.isConfirmed === true) {
      return false;
    }

    const now = new Date();
    if (userEmailConfirmationInfo.expirationDate < now) {
      return false;
    }

    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `Confirmation code ${validationArguments?.value} is expired, invalid or does not exist in our system`;
  }
}

export function ConfirmationCodeFromEmail(
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: WrongConfirmationCodeConstraint,
    });
  };
}
