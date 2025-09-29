import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard';
import { QuestionInputModel } from './models/input/create-question.input.model';
import { QuestionViewModel } from './models/output/question.output.model';
import { QuestionQueryDTO } from '../../../common/utils/pagination/questionQueryDTO';
import { PublishInputModel } from './models/input/publish-question.input.model';
import { CommandBus } from '@nestjs/cqrs';
import { CreateQuestionCommand } from '../application/useCases/create-question-use-case';
import { UpdateQuestionCommand } from '../application/useCases/update-question-use-case';
import { PublishQuestionCommand } from '../application/useCases/publish-question-use-case';
import { DeleteQuestionCommand } from '../application/useCases/delete-question-use-case';
import { QuestionsQueryRepository } from '../infrastructure/questions.query.repository';

@Controller('sa/quiz/questions')
export class QuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  @Get()
  @UseGuards(BasicAuthGuard)
  async getAllQuestions(@Query() query: QuestionQueryDTO) {
    //console.log(query);
    const questions =
      await this.questionsQueryRepository.getAllQuestions(query);

    return questions;
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  async createQuestion(
    @Body() createModel: QuestionInputModel,
  ): Promise<QuestionViewModel> {
    const createdQuestionId = await this.commandBus.execute(
      new CreateQuestionCommand(createModel),
    );

    if (!createdQuestionId) {
      console.log(`Question was not created`); // todo remove
      throw new Error(`Question was not created`);
    } else {
      const createdQuestion =
        await this.questionsQueryRepository.getQuestionById(createdQuestionId);

      if (createdQuestion) {
        return createdQuestion;
      } else {
        console.log(`Question was not found and mapped`); // todo remove
        throw new NotFoundException(`Question was not found and mapped`);
      }
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateModel: QuestionInputModel,
  ) {
    const isUpdated: boolean = await this.commandBus.execute(
      new UpdateQuestionCommand(id, updateModel),
    );

    if (!isUpdated) {
      throw new NotFoundException(
        `Question with id ${id} was not found for update`,
      );
    }
  }

  @Put(':id/publish')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async publishQuestion(
    @Param('id') id: string,
    @Body() updateModel: PublishInputModel,
  ) {
    const isPublished: boolean = await this.commandBus.execute(
      new PublishQuestionCommand(id, updateModel),
    );

    if (!isPublished) {
      throw new NotFoundException(
        `Question with id ${id} was not found for publication`,
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async deleteQuestion(@Param('id') id: string) {
    const isDeleted: boolean = await this.commandBus.execute(
      new DeleteQuestionCommand(id),
    );

    if (!isDeleted) {
      throw new NotFoundException(
        `Question with id ${id} was not found for deletion`,
      );
    }
  }
}
