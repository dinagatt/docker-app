import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../../../common/decorators/transform/trim';

export class BlogPostInputModel {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @MaxLength(30)
  title: string;

  @IsNotEmpty()
  @IsString()
  @Trim()
  @MaxLength(100)
  shortDescription: string;

  @IsNotEmpty()
  @IsString()
  @Trim()
  @MaxLength(1000)
  content: string;
}
