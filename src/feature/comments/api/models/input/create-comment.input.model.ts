import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Trim } from '../../../../../common/decorators/transform/trim';

export class CommentInputModel {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @Length(20, 300)
  content: string;
}
