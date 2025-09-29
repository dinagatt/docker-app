import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizGamesRepository } from '../../feature/quiz-game/infrastructure/quiz-games.repository';
import { GameStatus } from '../../feature/quiz-game/api/models/output/game-pair.output.model';
import { Game_Question } from '../../feature/quiz-game/domain/game-question.entity';
import { Player_Answer } from '../../feature/quiz-game/domain/player-answer.entity';
import { Player } from '../../feature/quiz-game/domain/player.entity';
import { Game } from '../../feature/quiz-game/domain/game.entity';
import { Question } from '../../feature/quiz/domain/question.entity';
import { UserEmailConfirmationInfo } from '../../feature/users/domain/TypeORM/userEmailConfirmationInfo.entity';
import { User } from '../../feature/users/domain/TypeORM/user.entity';
import { Session } from '../../feature/sessions/domain/TypeORM/session.entity';
import { Post } from '../../feature/posts/domain/TypeORM/post.entity';
import { Blog } from '../../feature/blogs/domain/TypeORM/blog.entity';
import { PostLike } from '../../feature/posts/post-likes/domain/TypeORM/postLike.entity';
import { CommentLike } from '../../feature/comments/comment-likes/domain/TypeORM/commentLike.entity';
import { Comment } from '../../feature/comments/domain/TypeORM/comment.entity';
import { UsersRepository } from '../../feature/users/infrastructure/users.repository';
import { DataSource, QueryRunner } from 'typeorm';
import { AnswerStatus } from '../../feature/quiz-game/api/models/output/answer.output.model';
import { AnswerDTO } from '../../feature/quiz-game/DTOs/answerDTO';

describe('QuizGamesRepository (Integration)', () => {
  let quizRepository: QuizGamesRepository;
  let usersRepository: UsersRepository;
  let queryRunner: QueryRunner;
  let connection: DataSource;

  beforeAll(async () => {
    /* // setup local PostgreSQL db
    testDataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 3423,
      username: 'postgres',
      password: 'sa',
      database: 'Incubator App',
      synchronize: true,
      dropSchema: true,
      entities: [
        Player,
        Game,
        Game_Question,
        Player_Answer,
        Question,
        User,
        UserEmailConfirmationInfo,
        Session,
        Post,
        Blog,
        Comment,
        PostLike,
        CommentLike,
      ],
      logging: false,
    });

    await testDataSource.initialize();*/

    // NestJS Testing Module setup
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 3423,
          username: 'postgres',
          password: 'sa',
          database: 'Incubator App Testing',
          entities: [
            Player,
            Game,
            Game_Question,
            Player_Answer,
            Question,
            User,
            UserEmailConfirmationInfo,
            Session,
            Post,
            Blog,
            Comment,
            PostLike,
            CommentLike,
          ],
          synchronize: true,
          dropSchema: false,
          logging: false,
        }),
        TypeOrmModule.forFeature([
          Player,
          Game,
          Game_Question,
          Player_Answer,
          Question,
          User,
          UserEmailConfirmationInfo,
          Session,
          Post,
          Blog,
          Comment,
          PostLike,
          CommentLike,
        ]),
      ],
      providers: [QuizGamesRepository, UsersRepository],
    }).compile();

    // get the DataSource
    connection = module.get<DataSource>(DataSource);

    // get repos
    quizRepository = module.get<QuizGamesRepository>(QuizGamesRepository);
    usersRepository = module.get<UsersRepository>(UsersRepository);
  });

  afterAll(async () => {
    /*// Get the shared connection from any of the repositories
    const connection = quizRepository.playersRepo.manager.connection;

    // Truncate tables via the shared connection
    await truncateTables(connection);*/

    // Close the connection after cleanup
    await connection.destroy();
  });
  /*// Utility function for truncating the tables
  async function truncateTables(connection: DataSource) {
    const tables = ['player_answer', 'game_question', 'player', 'game', 'user'];

    // Loop through each table and truncate it
    for (const table of tables) {
      await connection.query(`TRUNCATE TABLE ${table} CASCADE`);
    }
  }*/

  /*beforeEach(async () => {
    const userId1: string | null = await usersRepository.createUser({
      login: 'login1',
      passwordHash: 'passwordHash1',
      email: 'email1@gmail.com',
      createdAt: new Date(),
      isConfirmed: true,
    });
    queryRunner = await quizRepository.startTransaction();
  });*/

  afterEach(async () => {
    await quizRepository.rollbackTransaction(queryRunner);
    await usersRepository.usersORMrepo.query('DELETE FROM "user" CASCADE');
  });

  /*let queryRunner: QueryRunner;
  beforeEach(async () => {
    queryRunner = connection.createQueryRunner();
    await queryRunner.startTransaction();
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });*/
  /*afterAll(async () => {
    // Clean up and close DB connection
    await quizRepository.playersRepoORM.clear();
    await quizRepository.gamesRepoORM.clear();
    await usersRepository.usersORMrepo.clear();
    await quizRepository.game_questionsRepoORM.clear();
    await quizRepository.answersRepoORM.clear();
  });*/
  /*afterAll(async () => {
    await quizRepository.playersRepoORM.query('TRUNCATE TABLE player CASCADE');
    await quizRepository.gamesRepoORM.query('TRUNCATE TABLE game CASCADE');
    await usersRepository.usersORMrepo.query('TRUNCATE TABLE "user" CASCADE');
    await quizRepository.game_questionsRepoORM.query(
      'TRUNCATE TABLE game_question CASCADE',
    );
    await quizRepository.answersRepoORM.query(
      'TRUNCATE TABLE player_answer CASCADE',
    );
  });*/
  /*afterAll(async () => {
    const connection = quizRepository.playersRepoORM.manager.connection;

    await connection.query('TRUNCATE TABLE player_answer CASCADE');
    await connection.query('TRUNCATE TABLE game_question CASCADE');
    await connection.query('TRUNCATE TABLE player CASCADE');
    await connection.query('TRUNCATE TABLE game CASCADE');
    await connection.query('TRUNCATE TABLE "user" CASCADE');

    await connection.destroy();
  });*/
  /*beforeEach(async () => {
    // reset db before each test
    await testDataSource.synchronize(true);
  });*/

  describe('createPlayer', () => {
    it('should create a new player in the database with transaction', async () => {
      // Arrange: Create a user, an associated player and an associated game
      const userId: string | null = await usersRepository.createUser({
        login: 'user_login',
        passwordHash: 'hash',
        email: 'email@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      expect(userId).toBeDefined();

      const savedUser: User | null =
        await usersRepository.findUserByLogin('user_login');
      if (!savedUser) {
        throw new Error('Saved User is undefined');
      }
      expect(savedUser).toBeDefined();
      expect(savedUser.id).toBe(userId);

      queryRunner = await quizRepository.startTransaction();

      // Act: Call the repository method
      const result: Player = await quizRepository.createPlayer(
        {
          userId: savedUser.id,
          score: 0,
        },
        queryRunner,
      );
      if (!result) {
        throw new Error('Saved Player is undefined');
      }

      // Add to Player for validation
      const game: Game = await quizRepository.createGame(
        {
          player1_id: result.id,
          status: GameStatus.PendingSecondPlayer,
        },
        queryRunner,
      );
      if (!game) {
        throw new Error('Saved Game is undefined');
      }
      expect(game).toBeDefined();

      const playerAssignedToGame: boolean =
        await quizRepository.assignGameToPlayer1(
          result.id,
          game.id,
          queryRunner,
        );
      expect(playerAssignedToGame).toBe(true);

      const savedPlayerId: string | null =
        await quizRepository.findPlayerByUserIdAndGameId(
          savedUser.id,
          game.id,
          queryRunner,
        );
      if (!savedPlayerId) {
        throw new Error('Saved Player was not found');
      }
      expect(savedPlayerId).toBeDefined();

      // Assert: Validate the result
      expect(result).toBeDefined();
      expect(game.player1_id).toBe(result.id);
      expect(result.id).toBe(savedPlayerId);
    });
  });

  describe('createGame', () => {
    it('should create a new game in the database with transaction', async () => {
      // Arrange: Create a user, an associated player and an associated game
      const userId: string | null = await usersRepository.createUser({
        login: 'user_login',
        passwordHash: 'hash',
        email: 'email@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      expect(userId).toBeDefined();

      const savedUser: User | null =
        await usersRepository.findUserByLogin('user_login');
      if (!savedUser) {
        throw new Error('Saved User is undefined');
      }
      expect(savedUser).toBeDefined();
      expect(savedUser.id).toBe(userId);

      queryRunner = await quizRepository.startTransaction();

      const player: Player = await quizRepository.createPlayer(
        {
          userId: savedUser.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player) {
        throw new Error('Saved Player is undefined');
      }
      expect(player).toBeDefined();

      // Act: Call the repository method
      const result: Game = await quizRepository.createGame(
        {
          player1_id: player.id,
          status: GameStatus.PendingSecondPlayer,
        },
        queryRunner,
      );
      if (!result) {
        throw new Error('Saved Game is undefined');
      }
      expect(result).toBeDefined();

      //Add toGame for validation
      const playerAssignedToGame: boolean =
        await quizRepository.assignGameToPlayer1(
          player.id,
          result.id,
          queryRunner,
        );
      expect(playerAssignedToGame).toBe(true);

      const savedGameId = await quizRepository.findPendingGame(queryRunner);
      if (!savedGameId) {
        throw new Error('Saved Game is not found');
      }

      // Assert: Validate the result
      expect(result).toBeDefined();
      expect(result?.player1_id).toBe(player.id);
      expect([GameStatus.Active, GameStatus.PendingSecondPlayer]).toContain(
        result?.status,
      );
      expect(result?.id).toBe(savedGameId);
      expect(result?.player1_id).toBe(player.id);
    });
  });

  describe('assignGameToPlayer1', () => {
    it('should assign a new game to player 1 with transaction', async () => {
      // Arrange: Create a user, an associated player and an associated game
      const userId: string | null = await usersRepository.createUser({
        login: 'user_login',
        passwordHash: 'hash',
        email: 'email@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      expect(userId).toBeDefined();

      const savedUser: User | null =
        await usersRepository.findUserByLogin('user_login');
      if (!savedUser) {
        throw new Error('Saved User is undefined');
      }
      expect(savedUser).toBeDefined();
      expect(savedUser.id).toBe(userId);

      queryRunner = await quizRepository.startTransaction();

      const player: Player = await quizRepository.createPlayer(
        {
          userId: savedUser.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player) {
        throw new Error('Saved Player is undefined');
      }
      expect(player).toBeDefined();

      const game: Game = await quizRepository.createGame(
        {
          player1_id: player.id,
          status: GameStatus.PendingSecondPlayer,
        },
        queryRunner,
      );
      if (!game) {
        throw new Error('Saved Game is undefined');
      }
      expect(game).toBeDefined();

      // Act: Call the repository method
      const result: boolean = await quizRepository.assignGameToPlayer1(
        player.id,
        game.id,
        queryRunner,
      );

      const savedGameId = await quizRepository.findPendingGame(queryRunner);
      if (!savedGameId) {
        throw new Error('Saved Game is not found');
      }

      // Assert: Validate the result
      expect(result).toBe(true);
    });
  });

  describe('startTheGame', () => {
    it('should start the game with 2 assigned players with transaction', async () => {
      // Arrange: Create the 1st and 2nd user, start transaction, create the 1st player, a game, assign the 1st player to the game, the 2nd player and start the game
      const userId1: string | null = await usersRepository.createUser({
        login: 'user_login1',
        passwordHash: 'hash1',
        email: 'email1@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      expect(userId1).toBeDefined();

      const savedUser1: User | null =
        await usersRepository.findUserByLogin('user_login1');
      if (!savedUser1) {
        throw new Error('Saved User 1 is undefined');
      }
      expect(savedUser1).toBeDefined();
      expect(savedUser1.id).toBe(userId1);

      const userId2: string | null = await usersRepository.createUser({
        login: 'user_login2',
        passwordHash: 'hash2',
        email: 'email2@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      expect(userId2).toBeDefined();

      const savedUser2: User | null =
        await usersRepository.findUserByLogin('user_login2');
      if (!savedUser2) {
        throw new Error('Saved User 2 is undefined');
      }
      expect(savedUser2).toBeDefined();
      expect(savedUser2.id).toBe(userId2);

      queryRunner = await quizRepository.startTransaction();

      const player1: Player = await quizRepository.createPlayer(
        {
          userId: savedUser1.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player1) {
        throw new Error('Saved Player 1 is undefined');
      }
      expect(player1).toBeDefined();

      const game: Game = await quizRepository.createGame(
        {
          player1_id: player1.id,
          status: GameStatus.PendingSecondPlayer,
        },
        queryRunner,
      );
      if (!game) {
        throw new Error('Saved Game is undefined');
      }
      expect(game).toBeDefined();

      const playerAssignedToGame: boolean =
        await quizRepository.assignGameToPlayer1(
          player1.id,
          game.id,
          queryRunner,
        );
      expect(playerAssignedToGame).toBe(true);

      const savedGameId: string | null =
        await quizRepository.findPendingGame(queryRunner);
      if (!savedGameId) {
        throw new Error('Saved Game is not found');
      }

      const player2: Player = await quizRepository.createPlayer(
        {
          userId: savedUser2.id,
          gameId: game.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player2) {
        throw new Error('Saved Player 2 is undefined');
      }
      expect(player2).toBeDefined();

      // Act: Call the repository method
      const result = await quizRepository.startTheGame(
        GameStatus.Active,
        player2.id,
        game.id,
        queryRunner,
      );

      const startedGame = await quizRepository.findGameById(
        game.id,
        queryRunner,
      );
      if (!startedGame) {
        throw new Error('Game with assigned Players is undefined');
      }
      expect(startedGame).toBeDefined();
      //console.log(game.player2_id, player2.id);

      // Assert: Validate the result
      expect(result).toBe(true);
      expect(game.id).toBe(savedGameId);
      expect(startedGame.id).toBe(savedGameId);
      expect(game.player1_id).toBe(player1.id);
      expect(startedGame.player1_id).toBe(player1.id);
      expect(startedGame.player2_id).toBe(player2.id);
      expect(startedGame.status).toBe(GameStatus.Active);
    });
  });

  describe('findActiveGameByUserId', () => {
    it('should find an active game by userId1 with transaction', async () => {
      // Arrange: Create the 1st user, the 1st player, a game, assign the 1st player to the game, create the 2nd user and the 2nd player and start the game
      const userId1: string | null = await usersRepository.createUser({
        login: 'user_login1',
        passwordHash: 'hash1',
        email: 'email1@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      if (!userId1) {
        throw new Error('User 1 was not created, findActiveGameByUserId');
      }
      expect(userId1).toBeDefined();

      const savedUser1: User | null =
        await usersRepository.findUserByLogin('user_login1');
      if (!savedUser1) {
        throw new Error('User 1 was not found, findActiveGameByUserId');
      }
      expect(savedUser1).toBeDefined();
      expect(savedUser1.id).toBe(userId1);

      const userId2: string | null = await usersRepository.createUser({
        login: 'user_login2',
        passwordHash: 'hash2',
        email: 'email2@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      if (!userId2) {
        throw new Error('User 2 was not created, increaseScore');
      }
      expect(userId2).toBeDefined();

      const savedUser2: User | null =
        await usersRepository.findUserByLogin('user_login2');
      if (!savedUser2) {
        throw new Error('User 2 was not found, findActiveGameByUserId');
      }
      expect(savedUser2).toBeDefined();
      expect(savedUser2.id).toBe(userId2);

      queryRunner = await quizRepository.startTransaction();

      const player1: Player = await quizRepository.createPlayer(
        {
          userId: savedUser1.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player1) {
        throw new Error('Player 1 was not created, findActiveGameByUserId');
      }
      expect(player1).toBeDefined();
      expect(player1.userId).toBe(userId1);

      const game: Game = await quizRepository.createGame(
        {
          player1_id: player1.id,
          status: GameStatus.PendingSecondPlayer,
        },
        queryRunner,
      );
      if (!game) {
        throw new Error('Game was not created, findActiveGameByUserId');
      }
      expect(game).toBeDefined();
      expect(game.player1_id).toBe(player1.id);

      const isPlayerAssignedToGame: boolean =
        await quizRepository.assignGameToPlayer1(
          player1.id,
          game.id,
          queryRunner,
        );
      expect(isPlayerAssignedToGame).toBe(true);
      expect(game.player1_id).toBe(player1.id);
      expect(game.status).toBe(GameStatus.PendingSecondPlayer);

      const player2: Player = await quizRepository.createPlayer(
        {
          userId: savedUser2.id,
          gameId: game.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player2) {
        throw new Error('Player 2 was not created, findActiveGameByUserId');
      }
      expect(player2).toBeDefined();
      expect(player2.userId).toBe(userId2);

      const isTheGameStarted: boolean = await quizRepository.startTheGame(
        GameStatus.Active,
        player2.id,
        game.id,
        queryRunner,
      );
      expect(isTheGameStarted).toBe(true);

      // Act: Call the repository method
      const activeGame: Game = await quizRepository.findActiveGameByUserId(
        userId1,
        queryRunner,
      );
      //console.log(activeGame);

      // Assert: Validate the result
      expect(activeGame).toBeDefined();
      expect(activeGame.player1.userId).toBe(userId1);
      expect(activeGame.player1.id).toBe(player1.id);
      expect(activeGame.player2?.id).toBe(player2.id);
    });
  });

  describe('findPlayerOfActiveOrPendingGameByUserId', () => {
    it('should find a player by userId of a pending game with transaction', async () => {
      // Arrange: Create a user, an associated player and an associated game
      const userId: string | null = await usersRepository.createUser({
        login: 'user_login',
        passwordHash: 'hash',
        email: 'email@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      expect(userId).toBeDefined();

      const savedUser: User | null =
        await usersRepository.findUserByLogin('user_login');
      if (!savedUser) {
        throw new Error('Saved User is undefined');
      }
      expect(savedUser).toBeDefined();
      expect(savedUser.id).toBe(userId);

      queryRunner = await quizRepository.startTransaction();

      const player: Player = await quizRepository.createPlayer(
        {
          userId: savedUser.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player) {
        throw new Error('Saved Player is undefined');
      }
      expect(player).toBeDefined();

      const game: Game = await quizRepository.createGame(
        {
          player1_id: player.id,
          status: GameStatus.PendingSecondPlayer,
        },
        queryRunner,
      );
      if (!game) {
        throw new Error('Saved Game is undefined');
      }
      expect(game).toBeDefined();

      const playerAssignedToGame: boolean =
        await quizRepository.assignGameToPlayer1(
          player.id,
          game.id,
          queryRunner,
        );
      expect(playerAssignedToGame).toBe(true);

      // Act: Call the repository method
      const result: Player | null =
        await quizRepository.findPlayerOfActiveOrPendingGameByUserId(
          savedUser.id,
          queryRunner,
        );
      //console.log(result);
      if (!result) {
        throw new Error('Found Player by userId is undefined');
      }

      // Assert: Validate the result
      expect(result).toBeDefined();
      expect(result?.id).toBe(player.id);
      expect(result?.userId).toBe(savedUser.id);
      expect(result?.gameId).toBe(game.id);
      expect([GameStatus.Active, GameStatus.PendingSecondPlayer]).toContain(
        game.status,
      );
    });
  });

  describe('findPlayerByUserIdAndGameId', () => {
    it('should find a player by userId and gameId with transaction', async () => {
      // Arrange: Create a user, a player, a game and associate player with the game
      const userId: string | null = await usersRepository.createUser({
        login: 'user_login',
        passwordHash: 'hash',
        email: 'email@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      expect(userId).toBeDefined();

      const savedUser: User | null =
        await usersRepository.findUserByLogin('user_login');
      if (!savedUser) {
        throw new Error('Saved User is undefined');
      }
      expect(savedUser).toBeDefined();
      expect(savedUser.id).toBe(userId);

      queryRunner = await quizRepository.startTransaction();

      const player: Player = await quizRepository.createPlayer(
        {
          userId: savedUser.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player) {
        throw new Error('Saved Player is undefined');
      }
      expect(player).toBeDefined();

      const game: Game = await quizRepository.createGame(
        {
          player1_id: player.id,
          status: GameStatus.PendingSecondPlayer,
        },
        queryRunner,
      );
      if (!game) {
        throw new Error('Saved Game is undefined');
      }
      expect(game).toBeDefined();

      const playerAssignedToGame: boolean =
        await quizRepository.assignGameToPlayer1(
          player.id,
          game.id,
          queryRunner,
        );
      expect(playerAssignedToGame).toBe(true);

      // Act: Call the repository method
      const result: string | null =
        await quizRepository.findPlayerByUserIdAndGameId(
          savedUser.id,
          game.id,
          queryRunner,
        );
      if (!result) {
        throw new Error('Found Player by userId and gameId is undefined');
      }

      // Assert: Validate the result
      expect(result).toBeDefined();
      expect(result).toBe(player.id);
      expect(player.userId).toBe(savedUser.id);
      expect([GameStatus.Active, GameStatus.PendingSecondPlayer]).toContain(
        game.status,
      );
    });
  });

  describe('findPendingGame', () => {
    it('should find a pending game if it exists, with transaction', async () => {
      // Arrange: Create a user, an associated player and an associated game
      const userId: string | null = await usersRepository.createUser({
        login: 'user_login',
        passwordHash: 'hash',
        email: 'email@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      expect(userId).toBeDefined();

      const savedUser: User | null =
        await usersRepository.findUserByLogin('user_login');
      if (!savedUser) {
        throw new Error('Saved User is undefined');
      }
      expect(savedUser).toBeDefined();
      expect(savedUser.id).toBe(userId);

      queryRunner = await quizRepository.startTransaction();

      const player: Player = await quizRepository.createPlayer(
        {
          userId: savedUser.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player) {
        throw new Error('Saved Player is undefined');
      }
      expect(player).toBeDefined();

      const game: Game = await quizRepository.createGame(
        {
          player1_id: player.id,
          status: GameStatus.PendingSecondPlayer,
        },
        queryRunner,
      );
      if (!game) {
        throw new Error('Saved Game is undefined');
      }
      expect(game).toBeDefined();

      const playerAssignedToGame: boolean =
        await quizRepository.assignGameToPlayer1(
          player.id,
          game.id,
          queryRunner,
        );
      expect(playerAssignedToGame).toBe(true);

      // Act: Call the repository method
      const result: string | null =
        await quizRepository.findPendingGame(queryRunner);

      // Assert: Validate the result
      expect(result).toBeDefined();
      expect(result).toBe(game.id);
    });
  });

  describe('createFiveQuestionsForGame', () => {
    it('should create 5 game questions with transaction', async () => {
      /*const tables = await connection.query(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
      );
      console.log(tables);*/

      // Arrange: Create a user, an associated player and an associated game
      const userId: string | null = await usersRepository.createUser({
        login: 'user_login',
        passwordHash: 'hash',
        email: 'email@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      expect(userId).toBeDefined();

      const savedUser: User | null =
        await usersRepository.findUserByLogin('user_login');
      if (!savedUser) {
        throw new Error('Saved User is undefined');
      }
      expect(savedUser).toBeDefined();
      expect(savedUser.id).toBe(userId);

      queryRunner = await quizRepository.startTransaction();

      const player: Player = await quizRepository.createPlayer(
        {
          userId: savedUser.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player) {
        throw new Error('Saved Player is undefined');
      }
      expect(player).toBeDefined();

      const game: Game = await quizRepository.createGame(
        {
          player1_id: player.id,
          status: GameStatus.PendingSecondPlayer,
        },
        queryRunner,
      );
      if (!game) {
        throw new Error('Saved Game is undefined');
      }
      expect(game).toBeDefined();

      const playerAssignedToGame: boolean =
        await quizRepository.assignGameToPlayer1(
          player.id,
          game.id,
          queryRunner,
        );
      expect(playerAssignedToGame).toBe(true);

      const fiveRandomQuestions: Question[] | null =
        await quizRepository.getFiveRandomQuestionsQuizGameRepo(queryRunner);
      if (!fiveRandomQuestions) {
        throw new Error('Could not fetch five random questions');
      }
      expect(fiveRandomQuestions).toBeDefined();
      expect(fiveRandomQuestions).toHaveLength(5);

      // Act: Call the repository method
      const result: Game_Question[] =
        await quizRepository.createFiveQuestionsForGame(
          fiveRandomQuestions,
          game.id,
          queryRunner,
        );
      if (!result) {
        throw new Error('Saved fiveGameQuestions is undefined');
      }
      //console.log(result); // REMOVE
      //console.log(fiveRandomQuestions); // REMOVE

      // Assert: Validate the result
      expect(result).toBeDefined();
      expect(result).toHaveLength(5);
      expect(result[0].gameId).toBe(game.id);

      //expect(result.length).toBe(game.questions?.length); //todo do it somehow
      game.questions?.forEach((question) => {
        expect(result).toContainEqual(question);
      });

      const questionsIds = fiveRandomQuestions.map((q) => q.id);
      const game_questionsIds = result.map((gq) => gq.questionId);
      expect(questionsIds.sort()).toEqual(
        expect.arrayContaining(game_questionsIds),
      );
    });
  });

  describe('increaseScore', () => {
    it('should increase score of a player if the answer is correct, with transaction', async () => {
      // Arrange: Create the 1st user, the 1st player, a game, assign the 1st player to the game, create the 2nd user and the 2nd player and start the game
      const userId1: string | null = await usersRepository.createUser({
        login: 'user_login1',
        passwordHash: 'hash1',
        email: 'email1@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      if (!userId1) {
        throw new Error('User 1 was not created, increaseScore');
      }
      expect(userId1).toBeDefined();

      const savedUser1: User | null =
        await usersRepository.findUserByLogin('user_login1');
      if (!savedUser1) {
        throw new Error('User 1 was not found, increaseScore');
      }
      expect(savedUser1).toBeDefined();
      expect(savedUser1.id).toBe(userId1);

      const userId2: string | null = await usersRepository.createUser({
        login: 'user_login2',
        passwordHash: 'hash2',
        email: 'email2@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      if (!userId2) {
        throw new Error('User 2 was not created, increaseScore');
      }
      expect(userId2).toBeDefined();

      const savedUser2: User | null =
        await usersRepository.findUserByLogin('user_login2');
      if (!savedUser2) {
        throw new Error('User 2 was not found, increaseScore');
      }
      expect(savedUser2).toBeDefined();
      expect(savedUser2.id).toBe(userId2);

      queryRunner = await quizRepository.startTransaction();

      const player1: Player = await quizRepository.createPlayer(
        {
          userId: savedUser1.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player1) {
        throw new Error('Player 1 was not created, increaseScore');
      }
      expect(player1).toBeDefined();
      expect(player1.userId).toBe(userId1);

      const game: Game = await quizRepository.createGame(
        {
          player1_id: player1.id,
          status: GameStatus.PendingSecondPlayer,
        },
        queryRunner,
      );
      if (!game) {
        throw new Error('Game was not created, increaseScore');
      }
      expect(game).toBeDefined();
      expect(game.player1_id).toBe(player1.id);

      const isPlayerAssignedToGame: boolean =
        await quizRepository.assignGameToPlayer1(
          player1.id,
          game.id,
          queryRunner,
        );
      expect(isPlayerAssignedToGame).toBe(true);
      expect(game.player1_id).toBe(player1.id);
      expect(game.status).toBe(GameStatus.PendingSecondPlayer);

      const player2: Player = await quizRepository.createPlayer(
        {
          userId: savedUser2.id,
          gameId: game.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player2) {
        throw new Error('Player 2 was not created, increaseScore');
      }
      expect(player2).toBeDefined();
      expect(player2.userId).toBe(userId2);

      const isTheGameStarted: boolean = await quizRepository.startTheGame(
        GameStatus.Active,
        player2.id,
        game.id,
        queryRunner,
      );
      expect(isTheGameStarted).toBe(true);

      const startedGame: Game = await quizRepository.findGameById(
        game.id,
        queryRunner,
      );
      if (!startedGame) {
        throw new Error('Started game ws not found, increaseScore');
      }
      expect(startedGame).toBeDefined();
      expect(startedGame.player1_id).toBe(player1.id);
      expect(startedGame.player2_id).toBe(player2.id);
      expect(startedGame.status).toBe(GameStatus.Active);

      // Act: Call the repository method
      await quizRepository.increaseScore(player1.id, queryRunner);

      // Check
      const playerWithIncreasedScore: Player | null =
        await quizRepository.findPlayerOfActiveOrPendingGameByUserId(
          userId1,
          queryRunner,
        );

      // Assert: Validate the result
      expect(playerWithIncreasedScore?.score).toBe(player1.score + 1);
    });
  });

  describe('createAnswer', () => {
    it('should create an player answer to the game question with transaction', async () => {
      // Arrange: Create the 1st user and the 1st player, a game, assign the 1st player to the game, create the 2nd user and the 2nd player, start the game, create 5 game questions
      const userId1: string | null = await usersRepository.createUser({
        login: 'user_login1',
        passwordHash: 'hash1',
        email: 'email1@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      if (!userId1) {
        throw new Error('User 1 was not created, createAnswer');
      }
      expect(userId1).toBeDefined();

      const savedUser1: User | null =
        await usersRepository.findUserByLogin('user_login1');
      if (!savedUser1) {
        throw new Error('User 1 was not found, createAnswer');
      }
      expect(savedUser1).toBeDefined();
      expect(savedUser1.id).toBe(userId1);

      const userId2: string | null = await usersRepository.createUser({
        login: 'user_login2',
        passwordHash: 'hash2',
        email: 'email2@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      if (!userId2) {
        throw new Error('User 2 was not created, createAnswer');
      }
      expect(userId2).toBeDefined();

      const savedUser2: User | null =
        await usersRepository.findUserByLogin('user_login2');
      if (!savedUser2) {
        throw new Error('User 2 was not found, createAnswer');
      }
      expect(savedUser2).toBeDefined();
      expect(savedUser2.id).toBe(userId2);

      queryRunner = await quizRepository.startTransaction();

      const player1: Player = await quizRepository.createPlayer(
        {
          userId: savedUser1.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player1) {
        throw new Error('Player 1 was not created, createAnswer');
      }
      expect(player1).toBeDefined();
      expect(player1.userId).toBe(userId1);

      const game: Game = await quizRepository.createGame(
        {
          player1_id: player1.id,
          status: GameStatus.PendingSecondPlayer,
        },
        queryRunner,
      );
      if (!game) {
        throw new Error('Game was not created, createAnswer');
      }
      expect(game).toBeDefined();
      expect(game.player1_id).toBe(player1.id);

      const isPlayerAssignedToGame: boolean =
        await quizRepository.assignGameToPlayer1(
          player1.id,
          game.id,
          queryRunner,
        );
      expect(isPlayerAssignedToGame).toBe(true);
      expect(game.player1_id).toBe(player1.id);
      expect(game.status).toBe(GameStatus.PendingSecondPlayer);

      const player2: Player = await quizRepository.createPlayer(
        {
          userId: savedUser2.id,
          gameId: game.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player2) {
        throw new Error('Player 2 was not created, createAnswer');
      }
      expect(player2).toBeDefined();
      expect(player2.userId).toBe(userId2);

      const isTheGameStarted: boolean = await quizRepository.startTheGame(
        GameStatus.Active,
        player2.id,
        game.id,
        queryRunner,
      );
      expect(isTheGameStarted).toBe(true);

      const startedGame: Game = await quizRepository.findGameById(
        game.id,
        queryRunner,
      );
      if (!startedGame) {
        throw new Error('Started game ws not found, createAnswer');
      }
      expect(startedGame).toBeDefined();
      expect(startedGame.player1_id).toBe(player1.id);
      expect(startedGame.player2_id).toBe(player2.id);
      expect(startedGame.status).toBe(GameStatus.Active);

      const fiveRandomQuestions: Question[] | null =
        await quizRepository.getFiveRandomQuestionsQuizGameRepo(queryRunner);
      if (!fiveRandomQuestions) {
        throw new Error('Could not fetch five random questions, createAnswer');
      }
      expect(fiveRandomQuestions).toBeDefined();
      expect(fiveRandomQuestions).toHaveLength(5);

      const gameQuestions: Game_Question[] =
        await quizRepository.createFiveQuestionsForGame(
          fiveRandomQuestions,
          game.id,
          queryRunner,
        );
      expect(gameQuestions).toBeDefined();
      expect(gameQuestions).toHaveLength(5);
      expect(gameQuestions[0].gameId).toBe(game.id);
      /*expect(gameQuestions[0].questionId).toBe(fiveRandomQuestions[0].id); problem with random order in both arrays*/ // Act: Call the repository method
      const gameQuestionId: string = gameQuestions[0].id;
      const DTO: AnswerDTO = {
        playerId: player1.id,
        game_questionId: gameQuestionId,
        body: Math.random().toString(36).substring(7),
        status: AnswerStatus.Correct,
      };
      const createdPlayer1AnswerId: string = await quizRepository.createAnswer(
        DTO,
        queryRunner,
      );
      expect(gameQuestions).toBeDefined();

      // Check
      const player1WithCreatedAnswer: Player | null =
        await quizRepository.findPlayerOfActiveOrPendingGameByUserId(
          userId1,
          queryRunner,
        );

      // Assert: Validate the result
      expect(createdPlayer1AnswerId).toBe(
        player1WithCreatedAnswer?.answers![0].id,
      );
      expect(player1WithCreatedAnswer?.answers![0].game_questionId).toBe(
        gameQuestionId,
      );
    });
  });

  describe('finishTheGame', () => {
    it('should finish the game by changing status to Finished and adding gameEndingDate, with transaction', async () => {
      // Arrange: Create the 1st user and the 1st player, a game, assign the 1st player to the game, create the 2nd user and the 2nd player, start the game, create 5 game questions
      const userId1: string | null = await usersRepository.createUser({
        login: 'user_login1',
        passwordHash: 'hash1',
        email: 'email1@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      if (!userId1) {
        throw new Error('User 1 was not created, finishTheGame');
      }
      expect(userId1).toBeDefined();

      const savedUser1: User | null =
        await usersRepository.findUserByLogin('user_login1');
      if (!savedUser1) {
        throw new Error('User 1 was not found, finishTheGame');
      }
      expect(savedUser1).toBeDefined();
      expect(savedUser1.id).toBe(userId1);

      const userId2: string | null = await usersRepository.createUser({
        login: 'user_login2',
        passwordHash: 'hash2',
        email: 'email2@gmail.com',
        createdAt: new Date(),
        isConfirmed: true,
      });
      if (!userId2) {
        throw new Error('User 2 was not created, finishTheGame');
      }
      expect(userId2).toBeDefined();

      const savedUser2: User | null =
        await usersRepository.findUserByLogin('user_login2');
      if (!savedUser2) {
        throw new Error('User 2 was not found, finishTheGame');
      }
      expect(savedUser2).toBeDefined();
      expect(savedUser2.id).toBe(userId2);

      queryRunner = await quizRepository.startTransaction();

      const player1: Player = await quizRepository.createPlayer(
        {
          userId: savedUser1.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player1) {
        throw new Error('Player 1 was not created, finishTheGame');
      }
      expect(player1).toBeDefined();
      expect(player1.userId).toBe(userId1);

      const game: Game = await quizRepository.createGame(
        {
          player1_id: player1.id,
          status: GameStatus.PendingSecondPlayer,
        },
        queryRunner,
      );
      if (!game) {
        throw new Error('Game was not created, finishTheGame');
      }
      expect(game).toBeDefined();
      expect(game.player1_id).toBe(player1.id);

      const isPlayerAssignedToGame: boolean =
        await quizRepository.assignGameToPlayer1(
          player1.id,
          game.id,
          queryRunner,
        );
      expect(isPlayerAssignedToGame).toBe(true);
      expect(game.player1_id).toBe(player1.id);
      expect(game.status).toBe(GameStatus.PendingSecondPlayer);

      const player2: Player = await quizRepository.createPlayer(
        {
          userId: savedUser2.id,
          gameId: game.id,
          score: 0,
        },
        queryRunner,
      );
      if (!player2) {
        throw new Error('Player 2 was not created, finishTheGame');
      }
      expect(player2).toBeDefined();
      expect(player2.userId).toBe(userId2);

      const isTheGameStarted: boolean = await quizRepository.startTheGame(
        GameStatus.Active,
        player2.id,
        game.id,
        queryRunner,
      );
      expect(isTheGameStarted).toBe(true);

      // Act: Call the repository method
      await quizRepository.finishTheGame(game.id, queryRunner);
      // Check
      const finishedGame: Game = await quizRepository.findGameById(
        game.id,
        queryRunner,
      );
      if (!finishedGame) {
        throw new Error('Finished game was not found, finishTheGame');
      }

      // Assert: Validate the result
      expect(finishedGame).toBeDefined();
      expect(finishedGame.player1_id).toBe(player1.id);
      expect(finishedGame.player2_id).toBe(player2.id);
      expect(finishedGame.status).toBe(GameStatus.Finished);
      expect(finishedGame.gameEndDate).toBeDefined();
    });
  });
});
