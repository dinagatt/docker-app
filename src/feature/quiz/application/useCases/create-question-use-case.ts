import { QuestionInputModel } from '../../api/models/input/create-question.input.model';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionDTO } from '../DTOs/questionDTO';
import { QuestionsRepository } from '../../infrastructure/questions.repository';

export class CreateQuestionCommand {
  constructor(public createModel: QuestionInputModel) {}
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase
  implements ICommandHandler<CreateQuestionCommand>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async execute(command: CreateQuestionCommand): Promise<string | null> {
    const newQuestion: QuestionDTO = {
      body: command.createModel.body,
      correctAnswers: command.createModel.correctAnswers,
      published: false,
    };

    console.log(`Question creation commenced`); // todo REMOVE
    const createdQuestionId =
      await this.questionsRepository.createQuestion(newQuestion);

    if (!createdQuestionId) {
      console.log(`Error in question creation}`); // todo REMOVE

      return null;
    } else {
      console.log(`Question created: ${createdQuestionId}`); // todo REMOVE

      return createdQuestionId;
    }
  }
}
