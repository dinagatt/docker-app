import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';
import { Trim } from '../../../../../common/decorators/transform/trim';

export class BlogInputModel {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @MaxLength(15)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Trim()
  @MaxLength(500)
  description: string;

  @IsNotEmpty()
  @IsString()
  @Trim()
  @IsUrl()
  websiteUrl: string;
}
