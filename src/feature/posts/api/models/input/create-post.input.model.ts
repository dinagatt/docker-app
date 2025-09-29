import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../../../common/decorators/transform/trim';
import { ExistingBlog } from '../../../../../common/decorators/validate/existing-blog';

export class PostInputModel {
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

  @IsNotEmpty()
  @IsString()
  @Trim()
  @ExistingBlog()
  blogId: string;
}
