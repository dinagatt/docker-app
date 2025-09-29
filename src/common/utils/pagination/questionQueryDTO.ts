import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const SORTABLE_FIELDS = ['createdAt', 'body'] as const;
const SORTABLE_DIRECTIONS = ['asc', 'desc'] as const;
const PUBLISHED_STATUS = ['all', 'published', 'notPublished'] as const;

export class QuestionQueryDTO {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'bodySearchTerm must not exceed 100 characters' })
  bodySearchTerm?: string;

  @IsString()
  @IsIn([...PUBLISHED_STATUS], {
    message: `publishedStatus must be one of ${PUBLISHED_STATUS.join(', ')}`,
  })
  publishedStatus: string = PUBLISHED_STATUS[0];

  @IsString()
  @IsIn([...SORTABLE_FIELDS], {
    message: `sortBy must be one of ${SORTABLE_FIELDS.join(', ')}`,
  })
  sortBy: string = SORTABLE_FIELDS[0];

  @IsString()
  @IsIn([...SORTABLE_DIRECTIONS], {
    message: `sortDirection must be one of ${SORTABLE_DIRECTIONS.join(', ')}`,
  })
  sortDirection: string = SORTABLE_DIRECTIONS[1];

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'pageNumber must be greater than or equal to 1' })
  pageNumber: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'pageSize must be greater than or equal to 1' })
  pageSize: number = 10;
}
