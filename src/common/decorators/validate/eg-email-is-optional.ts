import { applyDecorators } from '@nestjs/common';
import { IsEmail, IsOptional } from 'class-validator';
import { Trim } from '../transform/trim';

//EXAMPLE OF HOW WE CAN MERGE SEVERAL DECORATORS
// https://docs.nestjs.com/custom-decorators#decorator-composition
export const EmailIsOptional = () =>
  applyDecorators(IsEmail(), Trim(), IsOptional());
