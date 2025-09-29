import { PlayerViewModel } from './player.output.model';

export class TopGamePlayerViewModel {
  sumScore: number;
  avgScores: number;
  gamesCount: number;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;
  player: PlayerViewModel;
}
