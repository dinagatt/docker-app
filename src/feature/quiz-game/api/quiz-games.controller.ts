import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AccessTokenAuthGuard } from '../../../common/guards/jwt-access-token-auth-guard';
import { AttachUserIdGuard } from '../../../common/guards/access-token-userId-guard';
import { GamePairViewModel } from './models/output/game-pair.output.model';
import {
  GameAnswersInternalServerError,
  NotInActivePairOrQuestionsAlreadyAnsweredError,
} from '../../../common/utils/result-type/result-type';
import { Request } from 'express';
import { QuizGamesQueryRepository } from '../infrastructure/quiz-games.query.repository';
import { CreateOrJoinPairCommand } from '../application/useCases/create-or-join-pair-use-case';
import { AnswerInputModel } from './models/input/create-answer-to-quiz-question.input.model';
import { ParamsGameIdInputModel } from './models/input/param-id.input.model';
import { AnswerViewModel } from './models/output/answer.output.model';
import { AnswerTheQuestionCommand } from '../application/useCases/answer-the-question-use-case';
import { GameQueryDTO } from '../../../common/utils/pagination/gameQueryDTO';
import { MyStatisticViewModel } from './models/output/my-statistic.output.model';
import { TopGamePlayerViewModel } from './models/output/top-game-player.output.model';
import { TopUsersQueryDTO } from '../../../common/utils/pagination/topUsersQueryDTO';

@Controller('pair-game-quiz')
export class QuizGamesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly quizGamesQueryRepository: QuizGamesQueryRepository,
  ) {}

  @Post('/pairs/connection')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenAuthGuard)
  async createOrJoinPair(@Req() req: Request) {
    const userId: string = req.userId!;

    /*try {
      const result = await this.commandBus.execute(
        new CreateOrJoinPairCommand(userId),
      );

      if (typeof result === 'string') {
        const createdPair: GamePairViewModel | null =
          await this.quizGamesQueryRepository.getGameById(result);

        if (!createdPair) {
          throw new Error(`No Game found after connection or creation`);
        } else {
          return createdPair;
        }
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException('You are already in an active game.'); // ✅ Return 403 Forbidden
      }
    }*/

    //console.log(`Game creation/joining attempt by user with ID ${userId}.`); // todo remove
    const result: string | null = await this.commandBus.execute(
      new CreateOrJoinPairCommand(userId),
    );

    if (typeof result === 'string') {
      const createdPair: GamePairViewModel | null =
        await this.quizGamesQueryRepository.getGameById(result);

      if (!createdPair) {
        throw new Error(`No Game found after connection or creation`);
      } else {
        return createdPair;
      }
    }

    if (result === null) {
      throw new ForbiddenException();
    }

    /*if (result.success) {
      const createdPair: GamePairViewModel | null =
        await this.quizGamesQueryRepository.getGameById(result.value);

      if (!createdPair) {
        throw new Error(`No Game found after connection or creation`);
      } else {
        return createdPair;
      }
    }

    if (result.error instanceof ForbiddenToJoinOrCreatePairError) {
      throw new ForbiddenException();
      /!*throw new HttpException(result.error.message, HttpStatus.FORBIDDEN);*!/
    }*/

    /*if (result.error instanceof GameInternalServerError) {
      throw new Error('Error in Game connection or creation');
    }*/
  }

  @Post('/pairs/my-current/answers')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenAuthGuard)
  async answerQuestion(
    @Req() req: Request,
    @Body() createModel: AnswerInputModel,
    //todo: WHAT IS THE PROMISE HERE?
  ) {
    const userId = req.userId!;
    const answer = createModel.answer;

    console.log(
      `Answer "${answer}" creation starting for user ${userId}, controller`,
    ); // todo remove
    const result = await this.commandBus.execute(
      new AnswerTheQuestionCommand(userId, answer),
    );

    if (result.success) {
      const createdAnswer: AnswerViewModel | null =
        await this.quizGamesQueryRepository.getAnswerById(result.value);

      if (createdAnswer) {
        console.log(
          `Answer with ID: ${result.value} created by user ${userId}, controller`,
        ); // todo remove
        return createdAnswer;
      } else {
        console.log(
          `Answer with ID: ${result.value} was not found and mapped, controller`,
        ); // todo remove
        throw new NotFoundException(
          `Answer with ID: ${result.value} was not found and mapped`,
        );
      }
    }

    if (
      result.error instanceof NotInActivePairOrQuestionsAlreadyAnsweredError
    ) {
      console.log(
        `User with ID: ${userId} is not in active pair or has already answered all game questions, controller`,
      ); // todo remove
      throw new HttpException(result.error.message, HttpStatus.FORBIDDEN);
    }

    if (result.error instanceof GameAnswersInternalServerError) {
      console.log(`Problems answer creation by user ${userId}, controller`);
      throw new HttpException(
        'Internal Server Error. Answer was not created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return true;
  }

  @Get('/pairs/my-current')
  @UseGuards(AccessTokenAuthGuard)
  async getMyCurrentUnfinishedGame(
    @Req() req: Request,
  ): Promise<GamePairViewModel> {
    const myCurrentUnfinishedGame: GamePairViewModel | null =
      await this.quizGamesQueryRepository.getCurrentGameByUserId(req.userId!);
    console.log('MY CURRENT GAME: ', myCurrentUnfinishedGame); //todo remove

    if (!myCurrentUnfinishedGame) {
      throw new NotFoundException(
        `Ongoing Game for user with id ${req.userId} was not found`,
      );
    }

    return myCurrentUnfinishedGame;
  }

  @Get('/pairs/my')
  @UseGuards(AccessTokenAuthGuard)
  /*@UsePipes(new ValidationPipe({ transform: false, whitelist: false }))*/
  async getAllUserGames(@Req() req: Request, @Query() query: GameQueryDTO) {
    console.log(`Getting all user's games...`); // todo remove
    //console.log(`GAME QUERY`, query); // todo remove
    /*console.log('🚀 Full request object:', req);
    console.log('🆔 Extracted User ID:', req.userId);
    console.log('🔍 Query Parameters:', query);*/
    /*if (!req.userId || !isUUID(req.userId)) {
      throw new BadRequestException('Invalid user ID format');
    }*/

    const allGames = await this.quizGamesQueryRepository.findAllUserGames(
      req.userId!,
      query,
    );

    if (!allGames) {
      throw new Error(`Games for user ${req.userId} not found`);
    }

    return allGames;
  }

  @Get('/pairs/:id')
  @UseGuards(AccessTokenAuthGuard)
  async getGameById(
    @Req() req: Request,
    /*@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,*/
    @Param() params: ParamsGameIdInputModel,
  ): Promise<GamePairViewModel> {
    const { id } = params;
    const userId = req.userId!;

    const doesTheGameExist: boolean =
      await this.quizGamesQueryRepository.doesTheGameExist(id);
    if (!doesTheGameExist) {
      throw new NotFoundException(`Game with id ${id} cannot be found`);
    }

    const isUserAParticipantOfTheGame: boolean =
      await this.quizGamesQueryRepository.isUserAParticipantOfTheGame(
        userId,
        id,
      );
    if (!isUserAParticipantOfTheGame) {
      throw new ForbiddenException(
        `User with id ${req.userId} cannot access the Game with id ${id}`,
      );
    }

    const result: GamePairViewModel | null =
      await this.quizGamesQueryRepository.getGameById(id);

    if (!result) {
      throw new NotFoundException(`Game with id ${id} was not found`);
    }
    return result;
  }

  @Get('/users/my-statistic')
  @UseGuards(AccessTokenAuthGuard)
  async getUserCurrentStatistic(
    @Req() req: Request,
  ): Promise<MyStatisticViewModel> {
    const myStatistics: MyStatisticViewModel =
      await this.quizGamesQueryRepository.getMyStatistics(req.userId!);

    if (!myStatistics) {
      throw new Error(`Statistics for user ${req.userId} not found`);
    }

    return myStatistics;
  }

  @Get('/users/top')
  /*@UseGuards(AttachUserIdGuard)*/
  async getTopUsers(@Query() query: TopUsersQueryDTO) {
    const topUsers = await this.quizGamesQueryRepository.getTopUsers(query);

    if (!topUsers) {
      throw new Error(`Error in getting top users`);
    }

    return topUsers;
  }
}
