import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseDBEntity } from '../../../common/db/base-db.entity';
import { GameStatus } from '../api/models/output/game-pair.output.model';
import { Player } from './player.entity';
import { Game_Question } from './game-question.entity';

@Entity()
export class Game extends BaseDBEntity {
  //1st player is required for game creation
  // @OneToOne(() => Player, (player: Player) => player.gameAsPlayer1)
  // @JoinColumn({ name: 'player1_id' })
  // player1: Player;
  @OneToOne(() => Player)
  @JoinColumn({ name: 'player1_id' })
  player1: Player;

  @Column({ type: 'uuid' })
  player1_id: string;

  //2nd player is optional for game creation as he/she joins later
  // @OneToOne(() => Player, (player: Player) => player.gameAsPlayer2, {
  //   nullable: true,
  // })
  // @JoinColumn({ name: 'player2_id' })
  // player2: Player;
  @OneToOne(() => Player, {
    nullable: true,
  })
  @JoinColumn({ name: 'player2_id' })
  player2: Player | null;

  @Column({ type: 'uuid', nullable: true })
  player2_id: string | null;

  @OneToMany(
    () => Game_Question,
    (game_question: Game_Question) => game_question.game,
    {
      nullable: true,
    },
  )
  questions: Game_Question[];

  @Column({ type: 'enum', enum: GameStatus })
  status: GameStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  gameStartDate: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  gameEndDate: Date | null;
}
