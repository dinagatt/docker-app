import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PublishInputModel } from '../../api/models/input/publish-question.input.model';
import { QuestionsRepository } from '../../infrastructure/questions.repository';

export class PublishQuestionCommand {
  constructor(
    public questionId: string,
    public updateModel: PublishInputModel,
  ) {}
}

@CommandHandler(PublishQuestionCommand)
export class PublishQuestionUseCase
  implements ICommandHandler<PublishQuestionCommand>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async execute(command: PublishQuestionCommand): Promise<boolean> {
    const existingQuestion = await this.questionsRepository.findQuestionById(
      command.questionId,
    );

    if (!existingQuestion) {
      console.log(
        `Question with ID ${command.questionId} was not found for publication`,
      ); // todo remove
      return false;
    }

    console.log(`Question publication with ID ${command.questionId} commenced`); // todo remove
    const result: boolean = await this.questionsRepository.publishQuestion(
      command.questionId,
      command.updateModel,
    );
    console.log(
      `Is question with ID ${command.questionId} published? - ${result}`,
    ); // todo REMOVE

    return result;
  }
}
