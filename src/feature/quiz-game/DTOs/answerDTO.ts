import { AnswerStatus } from '../api/models/output/answer.output.model';

export class AnswerDTO {
  playerId: string;
  game_questionId: string;
  body: string;
  status: AnswerStatus;
}
