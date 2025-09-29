import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UsersRepository } from '../../../feature/users/infrastructure/users.repository';

// Обязательна регистрация в ioc
@ValidatorConstraint({ name: 'UniqueEmail', async: true })
@Injectable()
export class EmailExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly usersRepository: UsersRepository) {}
  async validate(value: any, args: ValidationArguments) {
    const emailExists = await this.usersRepository.findUserByEmail(value);
    return !emailExists;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `Email ${validationArguments?.value} is already in our system`;
  }
}

// https://github.com/typestack/class-validator?tab=readme-ov-file#custom-validation-decorators
export function UniqueEmail(
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
