import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseDBEntity } from '../../../common/db/base-db.entity';
import { Player } from './player.entity';
import { Game_Question } from './game-question.entity';
import { AnswerStatus } from '../api/models/output/answer.output.model';

@Entity()
export class Player_Answer extends BaseDBEntity {
  @ManyToOne(() => Player, (player: Player) => player.answers)
  //ADD JOIN COLUMN
  player: Player;

  @Column({ type: 'uuid' })
  playerId: string;

  /*@OneToOne(
    () => Game_Question,
    (game_question: Game_Question) => game_question.player1_answer,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'game_questionId' })
  game_question_player_answer1: Game_Question;

  @OneToOne(
    () => Game_Question,
    (game_question: Game_Question) => game_question.player2_answer,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'game_questionId' })
  game_question_player_answer2: Game_Question;*/

  /*@OneToOne(() => Game_Question, {
    nullable: true,
  })
  @JoinColumn({ name: 'game_questionId' })
  game_question: Game_Question;*/

  @ManyToOne(() => Game_Question, {
    nullable: true,
  })
  @JoinColumn({ name: 'game_questionId' })
  game_question: Game_Question;

  @Column({ type: 'uuid' })
  game_questionId: string;

  @Column({ type: 'varchar' })
  body: string;

  @Column({ type: 'enum', enum: AnswerStatus })
  status: AnswerStatus;
}
