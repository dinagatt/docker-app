import { PlayerViewModel } from './player.output.model';
import { AnswerViewModel } from './answer.output.model';

export class GamePlayerProgressViewModel {
  answers: AnswerViewModel[] | [];
  player: PlayerViewModel;
  score: number;
}
