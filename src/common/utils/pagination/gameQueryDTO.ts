import { IsIn, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

const SORTABLE_FIELDS = ['pairCreatedDate', 'status'] as const;
const SORTABLE_DIRECTIONS = ['asc', 'desc'] as const;

export class GameQueryDTO {
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
