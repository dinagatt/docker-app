import { Column, Entity, OneToMany } from 'typeorm';
import { BaseDBEntity } from '../../../common/db/base-db.entity';
import { Game_Question } from '../../quiz-game/domain/game-question.entity';

@Entity()
export class Question extends BaseDBEntity {
  @Column({ type: 'varchar' })
  body: string;

  @Column({ type: 'jsonb', nullable: false })
  correctAnswers: string[];

  @Column({ type: 'boolean' })
  published: boolean;

  @OneToMany(() => Game_Question, (game_question) => game_question.question, {
    nullable: true,
  })
  game_questions: Game_Question[];
}
