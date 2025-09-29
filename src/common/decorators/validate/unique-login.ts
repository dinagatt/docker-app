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
@ValidatorConstraint({ name: 'UniqueLogin', async: true })
@Injectable()
export class LoginExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly usersRepository: UsersRepository) {}
  async validate(value: any, args: ValidationArguments) {
    const loginExists = await this.usersRepository.findUserByLogin(value);
    return !loginExists;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `Login ${validationArguments?.value} is already in the system`;
  }
}

// https://github.com/typestack/class-validator?tab=readme-ov-file#custom-validation-decorators
export function UniqueLogin(
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: LoginExistsConstraint,
    });
  };
}
