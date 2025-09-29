import { QuestionInputModel } from '../../api/models/input/create-question.input.model';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../../infrastructure/questions.repository';

export class UpdateQuestionCommand {
  constructor(
    public questionId: string,
    public updateModel: QuestionInputModel,
  ) {}
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async execute(command: UpdateQuestionCommand): Promise<boolean> {
    const existingQuestion = await this.questionsRepository.findQuestionById(
      command.questionId,
    );

    if (!existingQuestion) return false;

    const result: boolean = await this.questionsRepository.updateQuestion(
      command.questionId,
      command.updateModel,
    );

    return result;
  }
}
