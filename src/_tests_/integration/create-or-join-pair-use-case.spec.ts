import {
  CreateOrJoinPairCommand,
  CreateOrJoinPairUseCase,
} from '../../feature/quiz-game/application/useCases/create-or-join-pair-use-case';
import { QuizGamesRepository } from '../../feature/quiz-game/infrastructure/quiz-games.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { Game } from '../../feature/quiz-game/domain/game.entity';
import { Player } from '../../feature/quiz-game/domain/player.entity';
import {
  assignPlayer1ToGame,
  createFiveMockGameQuestions,
  createMockGame,
  createMockPlayer,
  createMockUser,
  getFiveRandomMockQuestions,
} from './test_utils/entities-mock-factories';
import { User } from '../../feature/users/domain/TypeORM/user.entity';
import { Question } from '../../feature/quiz/domain/question.entity';
import { Game_Question } from '../../feature/quiz-game/domain/game-question.entity';
import { GameStatus } from '../../feature/quiz-game/api/models/output/game-pair.output.model';
import { QueryRunner } from 'typeorm';
import { ForbiddenToJoinOrCreatePairError } from '../../common/utils/result-type/result-type';

describe('CreateOrJoinPairUseCase', () => {
  let useCase: CreateOrJoinPairUseCase;
  let quizGamesRepository: jest.Mocked<QuizGamesRepository>;

  // Mock QueryRunner
  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      getRepository: jest.fn().mockReturnValue({
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
      }),
      query: jest.fn(),
    },
  } as unknown as QueryRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrJoinPairUseCase,
        {
          provide: QuizGamesRepository,
          useValue: {
            findPlayerOfActiveOrPendingGameByUserId: jest.fn(),
            findPendingGame: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            createPlayer: jest.fn(),
            createGame: jest.fn(),
            assignGameToPlayer1: jest.fn(),
            startTheGame: jest.fn(),
            createFiveQuestionsForGame: jest.fn(),
            getFiveRandomQuestionsQuizGameRepo: jest.fn(),
          },
        },
        /*{
          provide: QuestionsRepository,
          useValue: {
            getFiveRandomQuestions: jest.fn(),
          },
        },*/
      ],
    }).compile();

    useCase = module.get<CreateOrJoinPairUseCase>(CreateOrJoinPairUseCase);
    quizGamesRepository = module.get<QuizGamesRepository>(
      QuizGamesRepository,
    ) as jest.Mocked<QuizGamesRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  //todo assertions for questions and so on
  it('should create a player, then a new game and assign game to player if no pending game exists', async () => {
    const user: User = createMockUser(
      'testLogin',
      'testPasswordHash',
      'testEmail@gmail.com',
    );
    const player: Player = createMockPlayer(user);
    const pendingGame: Game = createMockGame(player);
    const assignedPlayer1: Player = assignPlayer1ToGame(player, pendingGame);
    const fiveRandomQuestions: Question[] = getFiveRandomMockQuestions();
    const fiveGameQuestions: Game_Question[] = createFiveMockGameQuestions(
      pendingGame,
      fiveRandomQuestions,
    );

    quizGamesRepository.startTransaction.mockResolvedValue(mockQueryRunner);
    quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId.mockResolvedValue(
      null,
    );
    quizGamesRepository.findPendingGame.mockResolvedValue(null);
    quizGamesRepository.createPlayer.mockResolvedValue(player);
    quizGamesRepository.createGame.mockResolvedValue(pendingGame);
    quizGamesRepository.getFiveRandomQuestionsQuizGameRepo.mockResolvedValue(
      fiveRandomQuestions,
    );
    quizGamesRepository.createFiveQuestionsForGame.mockResolvedValue(
      fiveGameQuestions,
    );
    quizGamesRepository.assignGameToPlayer1.mockResolvedValue(
      assignedPlayer1.id,
    );
    quizGamesRepository.commitTransaction.mockResolvedValue(undefined);

    const result = await useCase.execute(new CreateOrJoinPairCommand(user.id));

    expect(result).toEqual({ success: true, value: pendingGame.id });
    expect(quizGamesRepository.createPlayer).toHaveBeenCalledWith(
      {
        userId: user.id,
        score: 0,
      },
      mockQueryRunner,
    );
    /*expect(quizGamesRepository.createGame).toHaveBeenCalledWith(
      expect.objectContaining({
        player1_id: player.id,
        status: GameStatus.PendingSecondPlayer,
      }),
    );*/
    expect(quizGamesRepository.createGame).toHaveBeenCalledWith(
      {
        player1_id: player.id,
        status: GameStatus.PendingSecondPlayer,
      },
      mockQueryRunner,
    );
    expect(quizGamesRepository.commitTransaction).toHaveBeenCalledTimes(1);
    expect(pendingGame.id).toBe(assignedPlayer1.gameId);
  });

  it('should join an existing game by creating the second player with gameId and start the game', async () => {
    const existingUser: User = createMockUser(
      'testLogin1',
      'testPasswordHash1',
      'testEmail1@gmail.com',
    );
    const pendingGame: Game = createMockGame(createMockPlayer(existingUser));
    const newUser: User = createMockUser(
      'testLogin2',
      'testPasswordHash2',
      'testEmail2@gmail.com',
    );
    const newPlayer = createMockPlayer(newUser, pendingGame.id);

    quizGamesRepository.startTransaction.mockResolvedValue(mockQueryRunner);
    quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId.mockResolvedValue(
      null,
    );
    quizGamesRepository.findPendingGame.mockResolvedValue(pendingGame.id);
    quizGamesRepository.createPlayer.mockResolvedValue(newPlayer);
    quizGamesRepository.startTheGame.mockResolvedValue(pendingGame.id);
    quizGamesRepository.commitTransaction.mockResolvedValue(undefined);

    const result = await useCase.execute(
      new CreateOrJoinPairCommand(newUser.id),
    );

    expect(result).toEqual({ success: true, value: pendingGame.id });
    expect(quizGamesRepository.createPlayer).toHaveBeenCalledWith(
      {
        userId: newUser.id,
        gameId: pendingGame.id,
        score: 0,
      },
      mockQueryRunner,
    );
    expect(quizGamesRepository.startTheGame).toHaveBeenCalledWith(
      GameStatus.Active,
      newPlayer.id,
      pendingGame.id,
      mockQueryRunner,
    );
    expect(quizGamesRepository.commitTransaction).toHaveBeenCalled();
  });

  it('should return error if user is already in an active or pending game', async () => {
    const existingUser: User = createMockUser(
      'testLogin',
      'testPasswordHash',
      'testEmail@gmail.com',
    );
    const existingPlayer: Player = createMockPlayer(existingUser);

    quizGamesRepository.startTransaction.mockResolvedValue(mockQueryRunner);

    quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId.mockResolvedValue(
      existingPlayer,
    );

    const result = await useCase.execute(
      new CreateOrJoinPairCommand(existingUser.id),
    );

    expect(result).toEqual({
      success: false,
      error: new ForbiddenToJoinOrCreatePairError(),
    });
    expect(
      quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId,
    ).toHaveBeenCalledWith(existingUser.id, mockQueryRunner);
  });

  it('should handle transaction rollback if an error occurs during player creation', async () => {
    const user: User = createMockUser(
      'testLogin',
      'testPasswordHash',
      'testEmail@gmail.com',
    );

    quizGamesRepository.startTransaction.mockResolvedValue(mockQueryRunner);
    quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId.mockResolvedValue(
      null,
    );
    quizGamesRepository.findPendingGame.mockResolvedValue(null);
    quizGamesRepository.createPlayer.mockRejectedValue(
      new Error('TRANSACTIONAL ERROR OCCURRED, CreateOrJoinPairUseCase'),
    );

    try {
      await useCase.execute(new CreateOrJoinPairCommand(user.id));
    } catch (error) {
      //console.log(error);
      expect(error.message).toBe(
        'TRANSACTIONAL ERROR OCCURRED, CreateOrJoinPairUseCase',
      );
    }

    expect(quizGamesRepository.rollbackTransaction).toHaveBeenCalled();

    /*await expect(
      useCase.execute(new CreateOrJoinPairCommand(user.id)),
    ).rejects.toThrow('TRANSACTIONAL ERROR OCCURRED, CreateOrJoinPairUseCase');
    */
  });

  /* it('should handle transaction rollback if an error occurs during game creation', async () => {
    const user = createMockUser();
    const newPlayer = createMockPlayer(user);

    quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId.mockResolvedValue(
      null,
    );
    quizGamesRepository.findPendingGame.mockResolvedValue(null);
    quizGamesRepository.startTransaction.mockResolvedValue(undefined);
    quizGamesRepository.createPlayer.mockResolvedValue(newPlayer);
    quizGamesRepository.createGame.mockResolvedValue(null);

    await expect(
      useCase.execute(new CreateOrJoinPairCommand(user.id)),
    ).rejects.toThrow('TRANSACTIONAL ERROR OCCURRED');
    expect(quizGamesRepository.rollbackTransaction).toHaveBeenCalled();
  });*/

  /*it('should return error if user is already in a game', async () => {
    quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId.mockResolvedValue(
      savedPlayer,
    );

    const result = await useCase.execute({ userId });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(ForbiddenToJoinOrCreatePairError);
    expect(
      quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId,
    ).toHaveBeenCalledWith(userId);
  });

  /!* it('should create a new game when no pending game exists', async () => {
    quizGamesRepository.findPlayerByUserId.mockResolvedValue(null);
    quizGamesRepository.findPendingGame.mockResolvedValue(null);
    quizGamesRepository.createPlayer.mockResolvedValue(savedPlayer);
    quizGamesRepository.createGame.mockResolvedValue(savedGame);
    questionsRepository.getFiveRandomQuestions.mockResolvedValue(
      randomQuestions,
    );
    quizGamesRepository.createFiveQuestionsForGame.mockResolvedValue(
      savedGameQuestions,
    );
    quizGamesRepository.assignGameToPlayer1.mockResolvedValue(true);

    const result = await useCase.execute({ userId });

    expect(result.success).toBe(true);
    expect(result.value).toBe(gameId);
    expect(quizGamesRepository.findPendingGame).toHaveBeenCalled();
    expect(quizGamesRepository.createGame).toHaveBeenCalled();
    expect(questionsRepository.getFiveRandomQuestions).toHaveBeenCalled();
    expect(quizGamesRepository.assignGameToPlayer1).toHaveBeenCalledWith(
      playerId,
      gameId,
    );
  });*!/

  /!*it('should join an existing pending game', async () => {
    quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId.mockResolvedValue(
      null,
    );
    quizGamesRepository.findPendingGame.mockResolvedValue(gameId);
    quizGamesRepository.createPlayer.mockResolvedValue({
      ...savedPlayer,
      gameId,
    });
    quizGamesRepository.startTheGame.mockResolvedValue(true);

    const result = await useCase.execute({ userId });

    expect(result.success).toBe(true);
    expect(result.value).toBe(gameId);
    expect(quizGamesRepository.findPendingGame).toHaveBeenCalled();
    expect(quizGamesRepository.createPlayer).toHaveBeenCalledWith({
      userId,
      score: 0,
      gameId,
    });
    expect(quizGamesRepository.startTheGame).toHaveBeenCalledWith(
      GameStatus.Active,
      playerId,
      gameId,
    );
  });
*!/

  it('should return error if creating player fails', async () => {
    quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId.mockResolvedValue(
      null,
    );
    quizGamesRepository.findPendingGame.mockResolvedValue(null);
    quizGamesRepository.createPlayer.mockResolvedValue(null);

    const result = await useCase.execute({ userId });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(GameInternalServerError);
    expect(quizGamesRepository.createPlayer).toHaveBeenCalled();
  });

  it('should return error if creating game fails', async () => {
    quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId.mockResolvedValue(
      null,
    );
    quizGamesRepository.findPendingGame.mockResolvedValue(null);
    quizGamesRepository.createPlayer.mockResolvedValue(savedPlayer);
    quizGamesRepository.createGame.mockResolvedValue(null);

    const result = await useCase.execute({ userId });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(GameInternalServerError);
    expect(quizGamesRepository.createGame).toHaveBeenCalled();
  });

  it('should return error if fetching random questions fails', async () => {
    quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId.mockResolvedValue(
      null,
    );
    quizGamesRepository.findPendingGame.mockResolvedValue(null);
    quizGamesRepository.createPlayer.mockResolvedValue(savedPlayer);
    quizGamesRepository.createGame.mockResolvedValue(savedGame);
    questionsRepository.getFiveRandomQuestions.mockResolvedValue(null);

    const result = await useCase.execute({ userId });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(GameInternalServerError);
    expect(questionsRepository.getFiveRandomQuestions).toHaveBeenCalled();
  });

  it('should return error if assigning game to player fails', async () => {
    quizGamesRepository.findPlayerByUserId.mockResolvedValue(null);
    quizGamesRepository.findPendingGame.mockResolvedValue(null);
    quizGamesRepository.createPlayer.mockResolvedValue(savedPlayer);
    quizGamesRepository.createGame.mockResolvedValue(savedGame);
    questionsRepository.getFiveRandomQuestions.mockResolvedValue(
      randomQuestions,
    );
    quizGamesRepository.createFiveQuestionsForGame.mockResolvedValue(
      savedGameQuestions,
    );
    quizGamesRepository.assignGameToPlayer1.mockResolvedValue(false);

    const result = await useCase.execute({ userId });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(GameInternalServerError);
    expect(quizGamesRepository.assignGameToPlayer1).toHaveBeenCalled();
  });

  it('should return error if starting the game fails', async () => {
    quizGamesRepository.findPlayerOfActiveOrPendingGameByUserId.mockResolvedValue(
      null,
    );
    quizGamesRepository.findPendingGame.mockResolvedValue(gameId);
    quizGamesRepository.createPlayer.mockResolvedValue({
      ...savedPlayer,
      gameId,
    });
    quizGamesRepository.startTheGame.mockResolvedValue(false);

    const result = await useCase.execute({ userId });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(GameInternalServerError);
    expect(quizGamesRepository.startTheGame).toHaveBeenCalledWith(
      GameStatus.Active,
      playerId,
      gameId,
    );
  });*/
});
