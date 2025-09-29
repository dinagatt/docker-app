import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Question } from '../domain/question.entity';
import { QuestionDTO } from '../application/DTOs/questionDTO';
import { QuestionInputModel } from '../api/models/input/create-question.input.model';
import { PublishInputModel } from '../api/models/input/publish-question.input.model';

@Injectable()
export class QuestionsRepository {
  constructor(
    @InjectRepository(Question) private questionsRepoORM: Repository<Question>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async createQuestion(questionDTO: QuestionDTO): Promise<string | null> {
    const newQuestion = this.questionsRepoORM.create(questionDTO);

    try {
      const result = await this.questionsRepoORM.save(newQuestion);
      return result.id;
    } catch (error) {
      console.log(
        `Error saving Question for Question creation, questions' repo`,
        error,
      );
      return null;
    }
  }

  async findQuestionById(id: string): Promise<Question | null> {
    const result: Question | null = await this.questionsRepoORM.findOneBy({
      id: id,
    });

    return result ? (result as Question) : null;
  }

  async updateQuestion(
    id: string,
    questionDTO: QuestionInputModel,
  ): Promise<boolean> {
    const question = await this.findQuestionById(id);
    if (!question) return false;

    try {
      question.body = questionDTO.body;
      question.correctAnswers = questionDTO.correctAnswers;
      await this.questionsRepoORM.save(question);
      return true;
    } catch (error) {
      console.error(
        `Error saving Question for Question update, questions' repo:`,
        error,
      );
      return false;
    }
  }

  async publishQuestion(
    id: string,
    questionDTO: PublishInputModel,
  ): Promise<boolean> {
    const question = await this.findQuestionById(id);
    if (!question) return false;

    try {
      question.published = questionDTO.published;

      await this.questionsRepoORM.save(question);
      //console.log(a.updatedAt === null);
      return true;
    } catch (error) {
      console.error(
        `Error saving Question for Question publication, questions' repo:`,
        error,
      );
      console.log(
        `Error saving Question for Question publication, questions' repo`,
      );
      return false;
    }
  }

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      const result = await this.questionsRepoORM.delete({ id: id });
      if (result.affected === 1) {
        return true;
        //console.log('Question deleted successfully.');
      } else {
        console.log(
          `No question found with the given ID ${id} for deletion, questions' repo`,
        );
        return false;
      }
    } catch (error) {
      console.error(`Error during deletion, questions' repo`, error);
      return false;
    }
  }

  async getFiveRandomQuestions(): Promise<Question[] | null> {
    const fiveRandomQuestions = await this.questionsRepoORM
      .createQueryBuilder('q')
      .where('q.published = :published', { published: true })
      .orderBy('RANDOM()')
      .limit(5)
      .getMany();

    if (fiveRandomQuestions.length === 0) return null;

    return fiveRandomQuestions;

    /* with huge tables
    SELECT *
    FROM "Question"
    TABLESAMPLE SYSTEM (1)
    LIMIT 5;*/
  }
}
