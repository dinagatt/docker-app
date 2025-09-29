import { IsUUID } from 'class-validator';

export class ParamsGameIdInputModel {
  @IsUUID('4', {
    message: 'Game ID must be a valid UUID (version 4) when provided',
  })
  id: string;
}
