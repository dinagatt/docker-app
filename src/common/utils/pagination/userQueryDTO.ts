import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UserQueryDto {
  @IsOptional()
  @IsString()
  searchLoginTerm?: string;

  @IsOptional()
  @IsString()
  searchEmailTerm?: string;

  @IsString()
  @IsIn(['login', 'email', 'createdAt'], {
    message: 'sortBy must be one of login, email, or createdAt',
  })
  sortBy?: string = 'createdAt';

  @IsString()
  @IsIn(['asc', 'desc'], {
    message: 'sortDirection must be either asc or desc',
  })
  sortDirection?: string = 'desc';

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'pageNumber must be greater than or equal to 1' })
  pageNumber: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'pageSize must be greater than or equal to 1' })
  pageSize: number = 10;
}
