import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { Trim } from '../../../../../common/decorators/transform/trim';
import { Type } from 'class-transformer';

export class QuestionInputModel {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @Length(10, 500)
  body: string;

  @IsNotEmpty()
  @IsArray({ message: 'correctAnswers must be an array.' })
  @ArrayMinSize(1, { message: 'correctAnswers must have at least one item.' })
  @Type(() => String) // Explicitly transforms each element to string
  @IsString({
    each: true,
    message: 'Each item in correctAnswers must be a string.',
  })
  correctAnswers: string[];
}
