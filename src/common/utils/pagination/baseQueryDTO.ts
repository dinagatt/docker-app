import { IsIn, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

const SORTABLE_DIRECTIONS = ['asc', 'desc'];

export class BaseQueryDTO {
  @IsString()
  @IsIn(SORTABLE_DIRECTIONS, {
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

  constructor(query: any) {
    // Apply defaults before validation
    this.sortDirection = query.sortDirection ?? SORTABLE_DIRECTIONS[1];
    this.pageNumber = query.pageNumber ?? 1;
    this.pageSize = query.pageSize ?? 10;
  }
}
