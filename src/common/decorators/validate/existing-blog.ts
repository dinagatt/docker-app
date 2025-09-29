import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../../../feature/blogs/infrastructure/blogs.repository';
import { BlogEntity } from '../../../feature/blogs/domain/sql/blog.entity';

@ValidatorConstraint({ name: 'ExistingBlog', async: true })
@Injectable()
export class BlogDoesNotExistConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly blogsRepository: BlogsRepository) {}
  async validate(value: any, args: ValidationArguments) {
    const blogExists: BlogEntity | null =
      await this.blogsRepository.findBlogById(value);
    return !!blogExists;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `Blog ${validationArguments?.value} does not exist in our system`;
  }
}

export function ExistingBlog(
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: BlogDoesNotExistConstraint,
    });
  };
}
