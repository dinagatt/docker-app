import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../../infrastructure/questions.repository';

export class DeleteQuestionCommand {
  constructor(public questionId: string) {}
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase
  implements ICommandHandler<DeleteQuestionCommand>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async execute(command: DeleteQuestionCommand): Promise<boolean> {
    const existingQuestion = await this.questionsRepository.findQuestionById(
      command.questionId,
    );

    if (!existingQuestion) return false;

    const result: boolean = await this.questionsRepository.deleteQuestion(
      command.questionId,
    );

    return result;
  }
}
