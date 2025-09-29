import { DataSource, QueryRunner } from 'typeorm';
import { Game } from '../domain/game.entity';
import { Player } from '../domain/player.entity';
import { GameStatus } from '../api/models/output/game-pair.output.model';
import { PlayerDTO } from '../DTOs/playerDTO';
import { GameDTO } from '../DTOs/gameDTO';
import { Question } from '../../quiz/domain/question.entity';
import { Game_Question } from '../domain/game-question.entity';
import { Player_Answer } from '../domain/player-answer.entity';
import { AnswerDTO } from '../DTOs/answerDTO';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QuizGamesRepository {
  /*private queryRunner: QueryRunner | null = null;*/
  private readonly logger: Logger = new Logger(QuizGamesRepository.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  //todo check tests as the methods were changed

  // transaction management
  async startTransaction(): Promise<QueryRunner> {
    const localQueryRunner: QueryRunner = this.dataSource.createQueryRunner(); // never returns undefined or null
    try {
      await localQueryRunner.connect();

      /*console.log(
        'Database connection options:',
        localQueryRunner.manager.connection.options,
      ); // to debug SSL settings*/

      await localQueryRunner.startTransaction();
      return localQueryRunner;
    } catch (error) {
      this.logger.error('Failed to start transaction:', error);

      if (!localQueryRunner.isReleased) {
        await localQueryRunner.release();
      }
      throw new Error(
        'Failed to start transaction. repo: startTransaction' + error.message,
      );
    }

    /*if (this.queryRunner) {
      this.logger.warn('⚠️ Transaction already started!');
      throw new Error('Transaction already started! startTransaction');
    }
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();*/
    /*const localQueryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await localQueryRunner.connect();
    await localQueryRunner.startTransaction();
    return localQueryRunner;*/
  }

  async commitTransaction(queryRunner: QueryRunner): Promise<void> {
    if (!queryRunner) {
      throw new Error(
        'No active transaction to commit. repo: commitTransaction',
      );
    }
    await queryRunner.commitTransaction();
    await this.releaseQueryRunner(queryRunner);
  }

  async rollbackTransaction(queryRunner: QueryRunner): Promise<void> {
    if (!queryRunner) {
      throw new Error(
        'No active transaction to rollback. repo: rollbackTransaction',
      );
    }
    await queryRunner.rollbackTransaction();
    await this.releaseQueryRunner(queryRunner);
  }

  private async releaseQueryRunner(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner) {
      await queryRunner.release();
    }
  }

  /*async commitTransaction(): Promise<void> {
    if (!this.queryRunner) throw new Error('No active transaction to commit.');
    await this.queryRunner.commitTransaction();
    await this.releaseQueryRunner();

    /!*
    if (!this.queryRunner) {
      console.warn('⚠️ No active transaction to commit.');
      return;
    }

    try {
      await this.queryRunner.commitTransaction();
    } catch (error) {
      console.error('❌ Error committing transaction:', error);
      throw new InternalServerErrorException('Failed to commit transaction');
    } finally {
      await this.releaseQueryRunner();
    }*!/
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.queryRunner)
      throw new Error('No active transaction to rollback.');
    await this.queryRunner.rollbackTransaction();
    await this.releaseQueryRunner();

    /!*if (!this.queryRunner) {
      console.warn('⚠️ No active transaction to rollback.');
      return;
    }

    try {
      await this.queryRunner.rollbackTransaction();
    } catch (error) {
      console.error('❌ Error rolling back transaction:', error);
      throw new InternalServerErrorException('Failed to rollback transaction');
    } finally {
      await this.releaseQueryRunner();
    }*!/
  }

  private async releaseQueryRunner(): Promise<void> {
    if (this.queryRunner) {
      await this.queryRunner.release();
      this.queryRunner = null;
    }

    /!*if (this.queryRunner) {
      try {
        await this.queryRunner.release();
      } catch (error) {
        console.error('❌ Error releasing queryRunner:', error);
      }
      this.queryRunner = null;
    }*!/
  }*/

  /*getRepository<T extends ObjectLiteral>(entity: new () => T): Repository<T> {
    if (!this.queryRunner) {
      throw new Error(
        '❌ No active transaction found! Start a transaction first.',
      );
    }

    return this.queryRunner.manager.getRepository(entity);
  }*/
  /* private getRepository<T>(entity: { new (): T }): Repository<T> {
    if (!this.queryRunner) throw new Error('Transaction not started!');
    return this.queryRunner.manager.getRepository(entity);
  }*/

  //read queries
  async findGameById(gameId: string, queryRunner: QueryRunner): Promise<Game> {
    const gamesRepo = queryRunner.manager.getRepository(Game);
    const result: Game | null = await gamesRepo.findOneBy({
      id: gameId,
    });

    if (!result)
      throw new Error(`No game found by id ${gameId}, repo: findGameById`);
    return result;
  }

  //checked
  async findActiveGameByUserId(
    userId: string,
    queryRunner: QueryRunner,
  ): Promise<Game | null> {
    const gamesRepo = queryRunner.manager.getRepository(Game);
    const result: Game | null = await gamesRepo
      .createQueryBuilder('g')
      .select('g')
      .leftJoinAndSelect('g.player1', 'p1')
      .leftJoinAndSelect('g.player2', 'p2')
      .leftJoinAndSelect('g.questions', 'q')
      .leftJoinAndSelect('p1.answers', 'pa1')
      .leftJoinAndSelect('p2.answers', 'pa2')
      .where('(p1.userId = :userId OR p2.userId = :userId)', {
        userId: userId,
      })
      .andWhere('g.status = :status', { status: GameStatus.Active })
      /*.andWhere('g.gameEndDate IS NULL')*/
      .getOne();

    /*if (
      !result?.player1 ||
      !result?.player2 ||
      !result?.questions ||
      (result?.player1.answers === undefined &&
        result?.player2.answers === undefined)
    ) {
      throw new Error(
        `Active game of a user ${userId} is not found with all relations, repo: findActiveGameByUserId`,
      );
    }*/

    return result;
  }

  async findActiveGameByUserId_LockedGame(
    userId: string,
    queryRunner: QueryRunner,
  ): Promise<Game | null> {
    const gamesRepo = queryRunner.manager.getRepository(Game);

    const result: Game | null = await gamesRepo
      .createQueryBuilder('g')
      .select('g')
      .leftJoinAndSelect('g.questions', 'q')
      .innerJoin('g.player1', 'p1')
      .innerJoin('g.player2', 'p2')
      .where('(p1.userId = :userId OR p2.userId = :userId)', { userId })
      .andWhere('g.status = :status', { status: GameStatus.Active })
      .getOne();

    /*.createQueryBuilder('g')
      .select('g')
      .leftJoinAndSelect('g.player1', 'p1')
      .leftJoinAndSelect('g.player2', 'p2')
      .leftJoinAndSelect('g.questions', 'q')
      .leftJoinAndSelect('p1.answers', 'pa1')
      .leftJoinAndSelect('p2.answers', 'pa2')
      .where('(p1.userId = :userId OR p2.userId = :userId)', {
        userId: userId,
      })
      .andWhere('g.status = :status', { status: GameStatus.Active })
      .setLock('pessimistic_read') // Lock game row to avoid race conditions
      .getOne();*/

    return result;
  }

  async findPlayerWithAnswersByPlayerId(
    playerId: string,
    queryRunner: QueryRunner,
  ): Promise<Player> {
    const playersRepo = queryRunner.manager.getRepository(Player);
    const result: Player | null = await playersRepo.findOne({
      where: { id: playerId },
      relations: ['answers'],
    });

    if (!result) {
      console.log(
        `Player ${playerId} was not found, repo: findPlayerByPlayerId`,
      );
      throw new Error(
        `Player ${playerId} was not found, repo: findPlayerByPlayerId`,
      );
    } else {
      return result;
    }
  }

  async findPlayerOfActiveOrPendingGameByUserId(
    userId: string,
    queryRunner: QueryRunner,
  ): Promise<Player | null> {
    /*if (!this.queryRunner) {
      throw new Error(
        'Transaction not started! findPlayerOfActiveOrPendingGameByUserId',
      );
    }*/
    const gamesRepo = queryRunner.manager.getRepository(Game);
    /*const result: Player | null = await playersRepo
      .createQueryBuilder('p')
      /!*.leftJoinAndSelect('p.game', 'g')*!/
      .where('p.userId = :userId', { userId: userId })
      .andWhere('g.status IN (:...statuses)', {
        statuses: [GameStatus.Active, GameStatus.PendingSecondPlayer],
      })
      .getOne();*/

    const result: Game | null = await gamesRepo
      .createQueryBuilder('g')
      /*.setLock('pessimistic_read', undefined, ['g'])*/
      .leftJoinAndSelect('g.player1', 'p1')
      .leftJoinAndSelect('g.player2', 'p2')
      .leftJoinAndSelect('p1.answers', 'pa1')
      .leftJoinAndSelect('p2.answers', 'pa2')
      .where('(p1.userId = :userId OR p2.userId = :userId)', { userId })
      .andWhere('g.status IN (:...statuses)', {
        statuses: [GameStatus.Active, GameStatus.PendingSecondPlayer],
      })
      .getOne();

    if (!result) {
      return null;
    }

    if (result.player1.userId === userId) {
      return result.player1;
    } else if (result.player2 && result.player2.userId === userId) {
      return result.player2;
    } else {
      return null;
    }

    /* if (!result || !result.player1 || !result.player2) return null;*/

    /*throw new Error(
        `No player for active or pending  game found by userId: ${userId}`,
      );*/

    /*return result.player1.userId === userId ? result.player1 : result.player2;*/

    /*if (result) {
      const player =
        result.player1.userId === userId ? result.player1 : result.player2;
      return player;
    } else {
      return null;
    }*/
  }

  async findPlayerByUserIdAndGameId(
    userId: string,
    gameId: string,
    queryRunner: QueryRunner,
  ): Promise<string | null> {
    const playersRepo = queryRunner.manager.getRepository(Player);
    const result: Player | null = await playersRepo.findOneBy({
      userId: userId,
      gameId: gameId,
    });

    if (!result) return null;
    /*throw new Error(
        `No player found by userId: ${userId} amd gameId: ${gameId}`,
      );*/

    return result.id;
  }

  async findPendingGame(queryRunner: QueryRunner): Promise<string | null> {
    const gamesRepo = queryRunner.manager.getRepository(Game);
    const result: Game | null = await gamesRepo.findOneBy({
      status: GameStatus.PendingSecondPlayer,
    });

    if (!result) return null;
    /*throw new Error(`No pending game found`)*/
    return result.id;
  }

  //checked
  async findQuestionByIdQuizGameRepo(
    id: string,
    queryRunner: QueryRunner,
  ): Promise<Question> {
    const questionsRepo = queryRunner.manager.getRepository(Question);

    const result = await questionsRepo.findOneBy({
      id: id,
    });
    if (!result)
      throw new Error(
        `No question found by id ${id}, repo: findQuestionByIdQuizGameRepo`,
      );
    return result;
  }

  // write queries
  async createPlayer(
    DTO: PlayerDTO,
    queryRunner: QueryRunner,
  ): Promise<Player> {
    const playersRepo = queryRunner.manager.getRepository(Player);
    const newPlayer: Player = playersRepo.create(DTO);
    return await playersRepo.save(newPlayer);

    /*try {
      const result = await playersRepo.save(newPlayer);
      return result;
    } catch (error) {
      console.log(
        `Error saving Player for Player creation, quizGames' repo`,
        error,
      );
      return null;
    }*/
  }

  async createGame(DTO: GameDTO, queryRunner: QueryRunner): Promise<Game> {
    const gamesRepo = queryRunner.manager.getRepository(Game);
    /*const gamesRepo = this.getRepository(Game);*/
    const newGame: Game = gamesRepo.create(DTO);
    return await gamesRepo.save(newGame);

    /*try {
      const result = await gamesRepo.save(newGame);
      return result;
    } catch (error) {
      console.log(
        `Error saving Game for Game without questions creation, quizGames' repo`,
        error,
      );
      return null;
    }*/
  }

  async getFiveRandomQuestionsQuizGameRepo(
    queryRunner: QueryRunner,
  ): Promise<Question[]> {
    const questionRepo = queryRunner.manager.getRepository(Question);
    const fiveRandomQuestions = await questionRepo
      .createQueryBuilder('q')
      .where('q.published = :published', { published: true })
      .orderBy('RANDOM()')
      .limit(5)
      .getMany();

    if (fiveRandomQuestions.length < 5 || !fiveRandomQuestions)
      throw new Error(
        `No or less than 5 questions were found for the game, repo: getFiveRandomQuestionsQuizGameRepo`,
      );

    return fiveRandomQuestions;
  }

  async createFiveQuestionsForGame(
    fiveRandomQuestions: Question[],
    savedGameWithoutQuestionsId: string,
    queryRunner: QueryRunner,
  ): Promise<Game_Question[]> {
    const game_questionsRepo = queryRunner.manager.getRepository(Game_Question);
    /*const game_questionsRepo = this.getRepository(Game_Question);*/
    const fiveGameQuestions: Game_Question[] = fiveRandomQuestions.map(
      (question: Question, index: number) => {
        return game_questionsRepo.create({
          gameId: savedGameWithoutQuestionsId,
          questionId: question.id,
          position: index + 1,
        });
      },
    );

    return await game_questionsRepo.save(fiveGameQuestions);

    /* try {
      return await game_questionsRepo.save(fiveGameQuestions);
    } catch (error) {
      console.log(
        `Error saving Game_Question[] for Game_Question[] creation, quizGames' repo`,
        error,
      );
      return null;
    }*/
  }

  async assignGameToPlayer1(
    player1_id: string,
    gameId: string,
    queryRunner: QueryRunner,
  ): Promise<string> {
    const playersRepo = queryRunner.manager.getRepository(Player);
    const player: Player | null = await playersRepo.findOneBy({
      id: player1_id,
    });
    if (!player) {
      throw new Error(
        `Player: ${player1_id} for gameId: ${gameId} assignment to the Player not found, repo: assignGameToPlayer1`,
      );
    }

    player.gameId = gameId;

    const assignedPlayer = await playersRepo.save(player);

    if (!assignedPlayer) {
      throw new Error(
        `Player with ID ${player1_id} was not assigned for game with ID ${gameId} , repo: assignGameToPlayer1`,
      );
    }

    return assignedPlayer.id;

    /*  try {
      await playersRepo.save(player);
      return true;
    } catch (error) {
      console.log(
        `Error saving Player 1 for gameId assignment to the Player, quizGames' repo`,
        error,
      );
      return false;
    }*/
  }

  async startTheGame(
    status: GameStatus,
    player2_id: string,
    pendingGameId: string,
    queryRunner: QueryRunner,
  ): Promise<string> {
    const gamesRepo = queryRunner.manager.getRepository(Game);
    /*const gamesRepo = this.getRepository(Game);*/
    const game: Game | null = await gamesRepo.findOneBy({
      id: pendingGameId,
    });
    if (!game) {
      throw new Error(`Game with ID ${pendingGameId} to end not found`);
    }

    game.status = status;
    game.player2_id = player2_id;
    game.gameStartDate = new Date();
    const finishedGame = await gamesRepo.save(game);

    if (!finishedGame) {
      throw new Error(
        `Game with ID ${pendingGameId} was not saved for game activation , repo: startTheGame`,
      );
    }

    return finishedGame.id;

    /* try {
      game.status = status;
      game.player2_id = player2_id;
      game.gameStartDate = new Date();
      await gamesRepo.save(game);
      return true;
    } catch (error) {
      console.error(
        `Error saving Game to start the existing Game, quizGames' repo:`,
        error,
      );
      return false;
    }*/
  }

  //startGame(gameId: string, player2Id: string): Promise<boolean> {
  //     const gamesRepo = this.getRepository(Game);
  //     const updateResult = await gamesRepo.update(gameId, {
  //       status: GameStatus.Active,
  //       player2Id,
  //     });
  //     return updateResult.affected > 0;
  //   }

  //checked
  async increaseScore(playerId: string, queryRunner: QueryRunner) {
    const playersRepo = queryRunner.manager.getRepository(Player);
    /*const playersRepo = this.getRepository(Player);*/
    const player: Player | null = await playersRepo.findOneBy({
      id: playerId,
    });
    if (!player) {
      throw new Error(
        `Player  with id ${playerId} for score increase not found, repo: increaseScore `,
      );
    }

    player.score = player.score + 1;

    /*try {
      await playersRepo.save(player);
      return true;
    } catch (error) {
      console.log(
        `Error saving Player for Player's score increase, quizGames' repo`,
        error,
      );
      return false;
    }*/
    await playersRepo.save(player);
  }

  //checked
  async createAnswer(
    DTO: AnswerDTO,
    queryRunner: QueryRunner,
  ): Promise<string> {
    const answersRepo = queryRunner.manager.getRepository(Player_Answer);
    /*const answersRepo = this.getRepository(Player_Answer);*/
    const newAnswer: Player_Answer = answersRepo.create(DTO);

    /*try {
      const result = await answersRepo.save(newAnswer);
      return result;
    } catch (error) {
      console.log(
        `Error saving Player_Answer for Player_Answer creation, quizGames' repo`,
        error,
      );
      return null;
    }*/
    const result = await answersRepo.save(newAnswer);
    return result.id;
  }

  //checked
  async finishTheGame(gameId: string, queryRunner: QueryRunner) {
    const gamesRepo = queryRunner.manager.getRepository(Game);
    /*const gamesRepo = this.getRepository(Game);*/
    const game: Game | null = await gamesRepo.findOneBy({
      id: gameId,
    });
    if (!game)
      throw new Error(
        `Game with id ${gameId} to finish not found, repo: finishTheGame `,
      );

    /*try {
      game.status = GameStatus.Finished;
      game.gameEndDate = new Date();
      await gamesRepo.save(game);
      return true;
    } catch (error) {
      console.error(
        `Error saving Game to finish an active Game, quizGames' repo`,
        error,
      );
      return false;
    }*/
    game.status = GameStatus.Finished;
    game.gameEndDate = new Date();
    await gamesRepo.save(game);
  }

  /*async getPlayerOfActiveUnfinishedGameByUserId(
    userId: string,
  ): Promise<Player | null> {
    return await this.playersRepoORM
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.answers', 'a')
      .leftJoinAndSelect('p.game', 'g')
      .leftJoinAndSelect('g.questions', 'q')
      .where('p.userId = :userId', { userId: userId })
      .andWhere('g.status = :status', { status: GameStatus.Active })
      .andWhere('g.gameEndDate IS NULL')
      .getOne();
  }

  async findPlayerById(playerId: string): Promise<Player | null> {
    const result: Player | null = await this.playersRepoORM.findOneBy({
      id: playerId,
    });

    return result ? result : null;
  }*/
}
