import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from '../domain/question.entity';
import { Repository } from 'typeorm';
import { QuestionViewModel } from '../api/models/output/question.output.model';
import { QuestionQueryDTO } from '../../../common/utils/pagination/questionQueryDTO';

@Injectable()
export class QuestionsQueryRepository {
  constructor(
    @InjectRepository(Question) private questionsRepoORM: Repository<Question>,
  ) {}

  mapToOutput(question: Question): QuestionViewModel {
    return {
      id: question.id,
      body: question.body,
      correctAnswers: question.correctAnswers,
      published: question.published,
      createdAt: question.createdAt.toISOString(),
      updatedAt:
        question.updatedAt.getTime() === question.createdAt.getTime()
          ? null
          : question.updatedAt.toISOString(),
    };
  }

  async getQuestionById(id: string): Promise<QuestionViewModel | null> {
    const question = await this.questionsRepoORM
      .createQueryBuilder('q')
      .where('q.id = :id', { id })
      .getOne();
    //console.log(question);

    return question ? this.mapToOutput(question) : null;
  }

  async getAllQuestions(query: QuestionQueryDTO) {
    const {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      bodySearchTerm,
      publishedStatus,
    } = query;

    const queryBuilder = this.questionsRepoORM.createQueryBuilder('q');

    if (bodySearchTerm) {
      queryBuilder.where('q.body ILIKE :bodySearchTerm', {
        bodySearchTerm: `%${bodySearchTerm}%`,
      });
    }

    if (publishedStatus === 'published') {
      queryBuilder.andWhere('q.published = :published', { published: true });
    } else if (publishedStatus === 'notPublished') {
      queryBuilder.andWhere('q.published = :published', { published: false });
    }

    queryBuilder
      .orderBy(`q.${sortBy}`, sortDirection.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber! - 1) * pageSize!)
      .take(pageSize);

    const questions = await queryBuilder.getRawMany();
    const totalCount = await queryBuilder.getCount();

    //console.log(questions, totalCount);

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: questions.map((question) => ({
        id: question.q_id,
        body: question.q_body,
        correctAnswers: question.q_correctAnswers,
        published: question.q_published,
        createdAt: question.q_createdAt.toISOString(),
        updatedAt:
          question.q_updatedAt.toISOString() ===
          question.q_createdAt.toISOString()
            ? null
            : question.q_updatedAt.toISOString(),
      })),
    };
  }
}
