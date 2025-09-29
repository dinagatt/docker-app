import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/*const SORTABLE_FIELDS = ['name', 'createdAt'];

export class BlogQueryDTO extends BaseQueryDTO {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'searchNameTerm must not exceed 100 characters' })
  searchNameTerm?: string;

  @IsString()
  @IsIn(SORTABLE_FIELDS, {
    message: `sortBy must be one of ${SORTABLE_FIELDS.join(', ')}`,
  })
  sortBy: string = SORTABLE_FIELDS[1];

  constructor(query: any) {
    super(query);
    this.sortBy = query.sortBy ?? SORTABLE_FIELDS[1];

    // Validate the default values during instantiation
    const errors = validateSync(this);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${JSON.stringify(errors, null, 2)}`);
    }
  }
}*/

const SORTABLE_FIELDS = ['name', 'createdAt'] as const;
const SORTABLE_DIRECTIONS = ['asc', 'desc'] as const;

export class BlogQueryDTO {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'searchNameTerm must not exceed 100 characters' })
  searchNameTerm?: string;

  @IsString()
  @IsIn([...SORTABLE_FIELDS], {
    message: `sortBy must be one of ${SORTABLE_FIELDS.join(', ')}`,
  })
  sortBy: string = SORTABLE_FIELDS[1];

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
