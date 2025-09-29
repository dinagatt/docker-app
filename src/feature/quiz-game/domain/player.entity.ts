import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseDBEntity } from '../../../common/db/base-db.entity';
import { User } from '../../users/domain/TypeORM/user.entity';
import { Player_Answer } from './player-answer.entity';

@Entity()
export class Player extends BaseDBEntity {
  @ManyToOne(() => User, (user: User) => user.players)
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  /*@OneToOne(() => Game, { nullable: true })
  @JoinColumn({ name: 'gameId' }) //not required but good to have
  game: Game | null;*/
  // @OneToOne(() => Game, (game: Game) => game.player2, { nullable: true })
  // gameAsPlayer2: Game;

  @Column({ type: 'uuid', nullable: true })
  gameId: string | null;

  @OneToMany(
    () => Player_Answer,
    (player_answer: Player_Answer) => player_answer.player,
    { nullable: true },
  )
  answers: Player_Answer[];

  @Column({ type: 'int' })
  score: number;
}
