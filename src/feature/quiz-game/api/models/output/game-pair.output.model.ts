import { GamePlayerProgressViewModel } from './game-player-progress.output.model';
import { QuestionViewModelForClient } from './question.output.model';

export enum GameStatus {
  PendingSecondPlayer = 'PendingSecondPlayer',
  Active = 'Active',
  Finished = 'Finished',
}

export class GamePairViewModel {
  id: string;
  firstPlayerProgress: GamePlayerProgressViewModel;
  secondPlayerProgress: GamePlayerProgressViewModel | null;
  questions: QuestionViewModelForClient[] | null;
  status: GameStatus;
  pairCreatedDate: string;
  startGameDate: string | null;
  finishGameDate: string | null;
}
