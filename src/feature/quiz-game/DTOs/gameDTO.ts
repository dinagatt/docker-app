import { GameStatus } from '../api/models/output/game-pair.output.model';

export class GameDTO {
  player1_id: string;
  status: GameStatus;
}
