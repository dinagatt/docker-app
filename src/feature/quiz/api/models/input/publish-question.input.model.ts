import { IsBoolean, IsNotEmpty } from 'class-validator';

export class PublishInputModel {
  @IsBoolean()
  @IsNotEmpty()
  published: boolean;
}
