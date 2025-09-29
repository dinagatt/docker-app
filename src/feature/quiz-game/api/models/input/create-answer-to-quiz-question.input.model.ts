import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../../../../common/decorators/transform/trim';

export class AnswerInputModel {
  @IsNotEmpty()
  @IsString()
  @Trim()
  answer: string;
}
