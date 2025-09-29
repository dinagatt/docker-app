import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../../feature/users/infrastructure/users.repository';
import { EmailExistsConstraint } from './unique-email';
import { UserEntity } from '../../../feature/users/domain/sql/user.entity';

@ValidatorConstraint({ name: 'RegisteredEmail', async: true })
@Injectable()
export class EmailIsNotRegisteredConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly usersRepository: UsersRepository) {}
  async validate(value: any, args: ValidationArguments) {
    const emailExists: UserEntity | null =
      await this.usersRepository.findUserByEmail(value);
    return !!emailExists;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `Email ${validationArguments?.value} is not registered in our system`;
  }
}

export function RegisteredEmail(
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: EmailExistsConstraint,
    });
  };
}
