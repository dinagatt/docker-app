import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizGamesRepository } from '../../infrastructure/quiz-games.repository';
import { Player } from '../../domain/player.entity';
import { GameStatus } from '../../api/models/output/game-pair.output.model';
import { PlayerDTO } from '../../DTOs/playerDTO';
import { GameDTO } from '../../DTOs/gameDTO';
import { Game_Question } from '../../domain/game-question.entity';
import { Question } from '../../../quiz/domain/question.entity';
import { Game } from '../../domain/game.entity';
import { QueryRunner } from 'typeorm';

export class CreateOrJoinPairCommand {
  constructor(public userId: string) {}
}

@CommandHandler(CreateOrJoinPairCommand)
export class CreateOrJoinPairUseCase
  implements ICommandHandler<CreateOrJoinPairCommand>
{
  constructor(private readonly quizGamesRepository: QuizGamesRepository) {}

  async execute(command: CreateOrJoinPairCommand): Promise<string | null> {
    const queryRunner: QueryRunner =
      await this.quizGamesRepository.startTransaction();
    console.log(
      `Transaction for game creation/joining started for user: ${command.userId}`,
    ); //todo REMOVE

    try {
      //step1: check if the user has already created or joined a game OR one user isn't playing with her|himself
      const existingPlayer: Player | null =
        await this.quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId(
          command.userId,
          queryRunner,
        );
      if (existingPlayer) {
        console.log('player exists'); //todo REMOVE
        console.log(
          `Rolling back transaction for user: ${command.userId} as user is already a participant.`,
        ); //todo REMOVE
        await this.quizGamesRepository.rollbackTransaction(queryRunner);
        console.log(
          `Transaction rolled back successfully as user ${command.userId} is already a participant.`,
        ); //todo REMOVE
        return null;
      }
      console.log('player does not exist'); //todo REMOVE

      //step2: create 1st player and a game ELSE create 2nd player and start the game
      const pendingGameId: string | null =
        await this.findPendingGame(queryRunner);

      if (!pendingGameId) {
        const player1: Player = await this.createPlayer(
          command.userId,
          queryRunner,
        );

        const gameId: string = await this.createGame(player1.id, queryRunner);
        console.log('player 1 and game created'); //todo REMOVE

        console.log(
          `Committing transaction for user ${command.userId} for game ${gameId} creation`,
        ); //todo REMOVE
        await this.quizGamesRepository.commitTransaction(queryRunner);
        console.log(
          `Transaction for game ${gameId} creation committed successfully for user ${command.userId}.`,
        ); //todo REMOVE
        return gameId;
      } else {
        console.log(
          `Attempting to lock game ID ${pendingGameId} by user ${command.userId}`,
        ); //todo REMOVE
        await queryRunner.manager
          .getRepository(Game)
          .createQueryBuilder('g')
          .setLock('pessimistic_write') // ✅ Locks the row to prevent simultaneous joins
          .where('g.id = :gameId', { gameId: pendingGameId })
          .execute();
        console.log(
          `Lock acquired for game ${pendingGameId} by user ${command.userId}`,
        ); //todo REMOVE

        const player2: Player = await this.createPlayer(
          command.userId,
          queryRunner,
          pendingGameId,
        );

        await this.startTheGame(
          GameStatus.Active,
          player2.id,
          pendingGameId,
          queryRunner,
        );
        console.log('player 2 created and game started'); //todo REMOVE

        console.log(
          `Committing transaction for user ${command.userId} to join the game ${pendingGameId}`,
        ); //todo REMOVE
        await this.quizGamesRepository.commitTransaction(queryRunner);
        console.log(
          `Transaction to join the game ${pendingGameId} committed successfully.`,
        ); //todo REMOVE
        return pendingGameId;
      }
    } catch (error) {
      await this.quizGamesRepository.rollbackTransaction(queryRunner);
      console.error(
        `Transactional Error in CreateOrJoinPairUseCase for user ${command.userId}`,
        error,
      );
      console.log(
        `Transaction rolled back successfully for user ${command.userId}.`,
      ); //todo REMOVE
      throw new Error('TRANSACTIONAL ERROR OCCURRED, CreateOrJoinPairUseCase');
    }
  }

  private async createPlayer(
    userId: string,
    queryRunner: QueryRunner,
    pendingGameId?: string,
  ): Promise<Player> {
    const DTO: PlayerDTO = {
      userId: userId,
      score: 0,
    };

    if (pendingGameId) {
      DTO.gameId = pendingGameId;
    }

    return await this.quizGamesRepository.createPlayer(DTO, queryRunner);
  }

  private async createGame(
    player1_id: string,
    queryRunner: QueryRunner,
  ): Promise<string> {
    //step1: create a Game without questions
    const DTO: GameDTO = {
      player1_id: player1_id,
      status: GameStatus.PendingSecondPlayer,
    };
    const savedGameWithoutQuestions: Game =
      await this.quizGamesRepository.createGame(DTO, queryRunner);

    //step2: populate the Game_Question table with 5 questions and assign them to the Game
    await this.populateTheGameWithFiveQuestions(
      savedGameWithoutQuestions.id,
      queryRunner,
    );

    //step3: assign a game to player1
    await this.quizGamesRepository.assignGameToPlayer1(
      player1_id,
      savedGameWithoutQuestions.id,
      queryRunner,
    );

    return savedGameWithoutQuestions.id;
  }

  private async findPendingGame(
    queryRunner: QueryRunner,
  ): Promise<string | null> {
    return await this.quizGamesRepository.findPendingGame(queryRunner);
  }

  private async populateTheGameWithFiveQuestions(
    savedGameWithoutQuestionsId: string,
    queryRunner: QueryRunner,
  ): Promise<Game_Question[]> {
    //step1: fetch 5 random Question[]
    const fiveRandomQuestions: Question[] =
      await this.quizGamesRepository.getFiveRandomQuestionsQuizGameRepo(
        queryRunner,
      );

    //step2: create 5 Game_Question[] and assign them to the Game
    const fiveGameQuestions: Game_Question[] =
      await this.quizGamesRepository.createFiveQuestionsForGame(
        fiveRandomQuestions,
        savedGameWithoutQuestionsId,
        queryRunner,
      );
    return fiveGameQuestions;
  }

  private async startTheGame(
    status: GameStatus,
    player2_id: string,
    pendingGameId: string,
    queryRunner: QueryRunner,
  ): Promise<string> {
    return await this.quizGamesRepository.startTheGame(
      status,
      player2_id,
      pendingGameId,
      queryRunner,
    );
  }
}
