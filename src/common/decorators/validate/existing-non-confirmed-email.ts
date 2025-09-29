import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../../feature/users/infrastructure/users.repository';
import { User } from '../../../feature/users/domain/TypeORM/user.entity';

@ValidatorConstraint({ name: 'RegisteredNonConfirmedEmail', async: true })
@Injectable()
export class EmailIsConfirmedConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly usersRepository: UsersRepository) {}
  async validate(value: any, args: ValidationArguments) {
    const user: User | null = await this.usersRepository.findUserByEmail(value);

    if (!user) {
      return false;
    }

    if (user.isConfirmed === true) {
      return false;
    } else {
      return true;
    }
    //!user.isConfirmed; //returns true if isConfirmed === false
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `Email ${validationArguments?.value} is already confirmed in our system`;
  }
}

export function RegisteredNonConfirmedEmail(
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: EmailIsConfirmedConstraint,
    });
  };
}
