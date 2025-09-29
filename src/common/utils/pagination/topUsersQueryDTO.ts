import {
  IsInt,
  Min,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsOptional,
  IsArray,
  Validate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const ALLOWED_SORT_FIELDS = [
  'avgScores',
  'sumScore',
  'winsCount',
  'lossesCount',
];
const ALLOWED_SORT_DIRECTIONS = ['asc', 'desc'];

@ValidatorConstraint({ name: 'SortFormat', async: false })
class SortFormatValidator implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments) {
    if (typeof value !== 'string') return false;

    const [field, direction] = value.trim().split(/\s+/); // handles multiple spaces
    if (!field || !direction) return false;

    return (
      ALLOWED_SORT_FIELDS.includes(field) &&
      ALLOWED_SORT_DIRECTIONS.includes(direction.toLowerCase())
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `Each sort value must be in the format "field direction", where field is one of (${ALLOWED_SORT_FIELDS.join(
      ', ',
    )}) and direction is "asc" or "desc". Received: "${args.value}"`;
  }
}

export class TopUsersQueryDTO {
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return ['avgScores desc', 'sumScore desc']; // default fallback
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @Validate(SortFormatValidator, { each: true })
  sort: string[];

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'pageNumber must be greater than or equal to 1' })
  pageNumber: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'pageSize must be greater than or equal to 1' })
  pageSize: number = 10;
}
