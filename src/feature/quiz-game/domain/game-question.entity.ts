import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseDBEntity } from '../../../common/db/base-db.entity';
import { Game } from './game.entity';
import { Question } from '../../quiz/domain/question.entity';
import { Player_Answer } from './player-answer.entity';

@Entity()
export class Game_Question extends BaseDBEntity {
  @ManyToOne(() => Game, (game: Game) => game.questions)
  game: Game;

  @Column({ type: 'uuid' })
  gameId: string;

  @ManyToOne(() => Question, (question: Question) => question.game_questions)
  question: Question;

  @Column({ type: 'uuid' })
  questionId: string;

  /*@OneToOne(
    () => Player_Answer,
    (player_answer: Player_Answer) =>
      player_answer.game_question_player_answer1,
    { nullable: true },
  )
  @JoinColumn({ name: 'player1_answerId' })
  player1_answer: Player_Answer;*/

  @OneToMany(
    () => Player_Answer,
    (player_answer: Player_Answer) => player_answer.game_question,
    { nullable: true },
  )
  player_answers: Player_Answer[];

  /*@OneToOne(() => Player_Answer, { nullable: true })
  @JoinColumn({ name: 'player1_answerId' })
  player1_answer: Player_Answer;

  @Column({ type: 'uuid', nullable: true })
  player1_answerId: string;

  @OneToOne(() => Player_Answer, { nullable: true })
  @JoinColumn({ name: 'player2_answerId' })
  player2_answer: Player_Answer;

  @Column({ type: 'uuid', nullable: true })
  player2_answerId: string;*/

  @Column({ type: 'int' })
  position: number;
}
