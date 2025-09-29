import {
  GamePairViewModel,
  GameStatus,
} from '../api/models/output/game-pair.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '../domain/game.entity';
import { Player } from '../domain/player.entity';
import { In, Repository } from 'typeorm';
import { Player_Answer } from '../domain/player-answer.entity';
import { Question } from '../../quiz/domain/question.entity';
import { Game_Question } from '../domain/game-question.entity';
import { AnswerViewModel } from '../api/models/output/answer.output.model';
import { QuestionViewModelForClient } from '../api/models/output/question.output.model';
import { GameQueryDTO } from '../../../common/utils/pagination/gameQueryDTO';
import { MyStatisticViewModel } from '../api/models/output/my-statistic.output.model';
import { TopUsersQueryDTO } from '../../../common/utils/pagination/topUsersQueryDTO';
import { TopGamePlayerViewModel } from '../api/models/output/top-game-player.output.model';

export class QuizGamesQueryRepository {
  constructor(
    @InjectRepository(Game) private gamesRepoORM: Repository<Game>,
    @InjectRepository(Question) private questionsRepoORM: Repository<Question>,
    @InjectRepository(Game_Question)
    private game_questionsRepoORM: Repository<Game_Question>,
    @InjectRepository(Player_Answer)
    private answersRepoORM: Repository<Player_Answer>,
  ) {}

  mapGameToOutput(
    game: Game,
    mappedQuestions: QuestionViewModelForClient[],
    mappedAnswers1: AnswerViewModel[] | [],
    mappedAnswers2: AnswerViewModel[] | [],
  ): GamePairViewModel {
    return {
      id: game.id,
      firstPlayerProgress: {
        answers: mappedAnswers1,
        player: {
          id: game.player1.user.id,
          login: game.player1.user.login,
        },
        score: game.player1.score,
      },
      secondPlayerProgress: game.player2_id
        ? {
            answers: mappedAnswers2,
            player: {
              id: game.player2!.user.id,
              login: game.player2!.user.login,
            },
            score: game.player2!.score,
          }
        : null,
      questions: game.player2_id ? mappedQuestions : null,
      status: game.status,
      pairCreatedDate: game.createdAt.toISOString(),
      startGameDate: game.gameStartDate
        ? game.gameStartDate.toISOString()
        : null,
      finishGameDate: game.gameEndDate ? game.gameEndDate.toISOString() : null,
    };
  }

  async getGameById(gameId: string): Promise<GamePairViewModel | null> {
    //step1: fetch the game by id
    const game: Game | null = await this.gamesRepoORM
      .createQueryBuilder('g')
      .select('g')
      .leftJoinAndSelect('g.player1', 'p1')
      .leftJoinAndSelect('p1.user', 'u1')
      .leftJoinAndSelect('g.player2', 'p2')
      .leftJoinAndSelect('p2.user', 'u2')
      .leftJoinAndSelect('g.questions', 'q')
      .leftJoinAndSelect('p1.answers', 'pa1')
      .leftJoinAndSelect('p2.answers', 'pa2')
      /* .select(['g', 'p1.score', 'u1.login', 'p2.score', 'u2.login', 'q'])*/
      .where('g.id = :id', { id: gameId })
      .getOne();
    if (!game || !game.player1 || !game.player1.user) return null;
    if (game.player2 && !game.player2.user) return null;
    if (
      /*game.player2 &&  game.questions.length === undefined*/ !Array.isArray(
        game.questions,
      ) ||
      game.questions.length === 0
    )
      return null; // if questions is null, undefined, not an array, or empty
    /*if (
      game.player1.answers === undefined &&
      game.player2!.answers === undefined
    )
      return null;*/

    //step2: fetch mapped game questions
    const mappedQuestions: QuestionViewModelForClient[] | null =
      await this._getMappedQuestions(game.questions);
    if (!mappedQuestions) return null;

    //step3: fetch mapped answers for each player
    const questionIds: string[] = game.questions.map(
      (gq: Game_Question) => gq.questionId,
    );
    const mappedAnswers: {
      mappedPlayer1Answers: AnswerViewModel[] | [];
      mappedPlayer2Answers: AnswerViewModel[] | [];
    } = await this._getBothPlayersMappedAnswers(
      game.player1_id,
      game.player2_id,
      questionIds,
      /*player1_answers.length > 0 ? player1_answers : null,
      game.player2 && player2_answers.length > 0 ? player2_answers : null,*/
    );

    //return
    return this.mapGameToOutput(
      game,
      mappedQuestions,
      mappedAnswers.mappedPlayer1Answers,
      mappedAnswers.mappedPlayer2Answers,
    );
  }

  async getCurrentGameByUserId(userId: string) {
    //fetch an ongoing game of a user with provided userId
    const game = await this.gamesRepoORM
      .createQueryBuilder('g')
      .select('g')
      .leftJoinAndSelect('g.player1', 'p1')
      .leftJoinAndSelect('g.player2', 'p2')
      .leftJoinAndSelect('g.questions', 'q')
      .leftJoinAndSelect('p1.user', 'u1')
      .leftJoinAndSelect('p2.user', 'u2')
      /*.leftJoinAndSelect('p1.answers', 'a1')
      .leftJoinAndSelect('p2.answers', 'a2')*/
      .where('(p1.userId = :userId OR p2.userId = :userId)', { userId })
      .andWhere('g.gameEndDate IS NULL')
      .getOne();
    if (!game || !game.player1 || !game.player1.user) return null;
    if (!Array.isArray(game.questions) || game.questions.length === 0)
      return null;
    /*if (
      game.player1.answers === undefined &&
      game.player2!.answers === undefined
    )
      return null;*/

    /*//fetch a player of an ongoing game
    const player = await this.playersRepoORM
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.game', 'g')
      .leftJoinAndSelect('g.questions', 'q')
      .leftJoinAndSelect('p.user', 'u')
      .leftJoinAndSelect('p.answers', 'a')
      .where('p.userId = :userId', { userId: userId })
      .andWhere('g.gameEndDate IS NULL')
      .getOne(); //player with this userId and unfinished game
    if (!player) return null; //we only see players with finished games
    if (
      !player.game ||
      !player.game.player1 ||
      !player.game.player1.user ||
      !player.game.questions
    )
      return null;
    if (player.game.player2 && !player.game.player2.user) return null;
    if (
      player.game.player1.answers === undefined &&
      player.game.player2.answers === undefined
    )
      return null;*/

    //fetch mapped game questions
    const mappedQuestions = await this._getMappedQuestions(game.questions);
    if (!mappedQuestions) return null;

    //fetch mapped answers for each player
    const questionIds: string[] = game.questions.map(
      (gq: Game_Question) => gq.questionId,
    );
    const mappedAnswers = await this._getBothPlayersMappedAnswers(
      /*game.player1.answers.length > 0 ? game.player1.answers : null,
      game.player2 && game.player2.answers.length > 0
        ? game.player2.answers
        : null,*/
      game.player1_id,
      game.player2_id,
      questionIds,
    );

    //return
    return this.mapGameToOutput(
      game,
      mappedQuestions,
      mappedAnswers.mappedPlayer1Answers,
      mappedAnswers.mappedPlayer2Answers,
    );
  }

  private async _getMappedQuestions(
    gameQuestions: Game_Question[],
  ): Promise<QuestionViewModelForClient[] | null> {
    const gameQuestionsAscSortedByPosition = gameQuestions.sort(
      (a, b) => a.position - b.position,
    );

    const questionsIds: string[] = gameQuestionsAscSortedByPosition.map(
      (question: Game_Question) => question.questionId,
    );
    const questions: Question[] | null = await this.questionsRepoORM.findBy({
      id: In(questionsIds),
    });
    if (!Array.isArray(questions) || questions.length === 0) return null;

    /*const mappedQuestions: QuestionViewModelForClient[] = questions.map(
      (question: Question): QuestionViewModelForClient => {
        return {
          id: question.id,
          body: question.body,
        };
      },
    );*/

    // create a map of questions by ID for quick lookup
    const questionMap = new Map<string, Question>(
      questions.map((question) => [question.id, question]),
    );

    // map gameQuestions to their corresponding question, preserving the order
    const mappedQuestions: QuestionViewModelForClient[] =
      gameQuestionsAscSortedByPosition
        .map((gq) => {
          const question = questionMap.get(gq.questionId);
          return question
            ? {
                id: question.id,
                body: question.body,
              }
            : null;
        })
        .filter(
          (question) => question !== null,
        ) as QuestionViewModelForClient[];

    return mappedQuestions;
  }

  private async _getBothPlayersMappedAnswers(
    /*player1answers: Player_Answer[] | null,
    player2answers: Player_Answer[] | null,*/
    player1Id: string,
    player2Id: string | null,
    questionIds: string[],
  ) {
    const player1answers: Player_Answer[] | [] = await this.answersRepoORM
      .createQueryBuilder('pa')
      .select('pa')
      .leftJoinAndSelect('pa.game_question', 'gq')
      .where('pa.playerId = :player1Id', { player1Id })
      .andWhere('gq.questionId IN (:...questionIds)', { questionIds })
      .getMany(); // returns an array of entity instances or [], never returns null or undefined

    const player2answers: Player_Answer[] | [] = player2Id
      ? await this.answersRepoORM
          .createQueryBuilder('pa')
          .select('pa')
          .leftJoinAndSelect('pa.game_question', 'gq')
          .where('pa.playerId = :player2Id', { player2Id })
          .andWhere('gq.questionId IN (:...questionIds)', { questionIds })
          .getMany()
      : [];

    const mappedPlayer1Answers: AnswerViewModel[] | [] =
      player1answers.length > 0
        ? player1answers.map((a: Player_Answer): AnswerViewModel => {
            return {
              questionId: a.game_question.questionId,
              answerStatus: a.status,
              addedAt: a.createdAt.toISOString(),
            };
          })
        : [];

    const mappedPlayer2Answers: AnswerViewModel[] | [] =
      player2answers.length > 0
        ? player2answers.map((a: Player_Answer): AnswerViewModel => {
            return {
              questionId: a.game_question.questionId,
              answerStatus: a.status,
              addedAt: a.createdAt.toISOString(),
            };
          })
        : [];

    return { mappedPlayer1Answers, mappedPlayer2Answers };
  }

  async getAnswerById(id: string): Promise<AnswerViewModel | null> {
    const answer: Player_Answer | null = await this.answersRepoORM
      .createQueryBuilder('a')
      .select('a')
      .leftJoinAndSelect('a.game_question', 'gq')
      .where('a.id = :id', { id: id })
      .getOne();

    if (answer) {
      return {
        questionId: answer.game_question.questionId,
        answerStatus: answer.status,
        addedAt: answer.createdAt.toISOString(),
      };
    } else {
      return null;
    }
  }

  async doesTheGameExist(gameId: string): Promise<boolean> {
    const game: Game | null = await this.gamesRepoORM
      .createQueryBuilder('g')
      .select('g')
      .where('g.id = :id', { id: gameId })
      .getOne();

    return !!game;
  }

  async isUserAParticipantOfTheGame(
    userId: string,
    gameId: string,
  ): Promise<boolean> {
    const game: Game | null = await this.gamesRepoORM
      .createQueryBuilder('g')
      .select('g')
      .leftJoinAndSelect('g.player1', 'p1')
      .leftJoinAndSelect('g.player2', 'p2')
      .leftJoinAndSelect('p1.user', 'u1')
      .leftJoinAndSelect('p2.user', 'u2')
      .where('(p1.userId = :userId OR p2.userId = :userId)', { userId })
      .andWhere('g.id = :id', { id: gameId })
      /*.andWhere('g.status = :status', { status: GameStatus.Finished })*/
      .getOne();

    return !!game;
  }

  async findAllUserGames(userId: string, query: GameQueryDTO) {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const sortField = sortBy === 'pairCreatedDate' ? 'createdAt' : sortBy;

    /*const gameWithQuestionsQueryBuilder = this.gamesRepoORM
      .createQueryBuilder('g')
      .select('g')
      .leftJoinAndSelect('g.player1', 'p1')
      .leftJoinAndSelect('g.player2', 'p2')
      .leftJoinAndSelect('g.questions', 'q')
      .leftJoinAndSelect('p1.user', 'u1')
      .leftJoinAndSelect('p2.user', 'u2')
      .where('(p1.userId = :userId OR p2.userId = :userId)', { userId })
      .orderBy(`g.${sortBy}`, sortDirection.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber! - 1) * pageSize!)
      .take(pageSize);
    const games: Game[] = await gameWithQuestionsQueryBuilder.getRawMany();
    const totalCount = await gameWithQuestionsQueryBuilder.getCount();
     const pagesCount = Math.ceil(totalCount / pageSize);*/
    /*const [games, totalCount] = await this.gamesRepoORM.findAndCount({
      where: [{ player1: { userId } }, { player2: { userId } }],
      relations: [
        'player1',
        'player1.user',
        'player2',
        'player2.user',
        'questions',
      ],
      order: {
        [sortBy]: sortDirection.toUpperCase() as 'ASC' | 'DESC',
      },
      skip: (pageNumber! - 1) * pageSize!,
      take: pageSize!,
    });*/
    /*const gameQueryBuilder = this.gamesRepoORM
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.player1', 'p1')
      .leftJoinAndSelect('g.player2', 'p2')
      .leftJoinAndSelect('g.questions', 'q')
      .leftJoinAndSelect('p1.user', 'u1')
      .leftJoinAndSelect('p2.user', 'u2')
      .where('p1.userId = :userId OR p2.userId = :userId', { userId });

    // const alias = gameQueryBuilder.alias;
    // console.log(`ALIAS ${alias}`);
    /!*gameQueryBuilder.addSelect(
      `
    CASE 
        WHEN g.status = 'PendingSecondPlayer' THEN 1 
        WHEN g.status = 'Active' THEN 2 
        WHEN g.status = 'Finished' THEN 3 
    END`,
      'sort_status',
    );*!/
    if (sortField === 'status') {
      gameQueryBuilder
        .orderBy(
          `
        CASE 
            WHEN g.status = 'PendingSecondPlayer' THEN 1 
            WHEN g.status = 'Active' THEN 2 
            WHEN g.status = 'Finished' THEN 3 
        END`,
          sortDirection.toUpperCase() as 'ASC' | 'DESC',
        )
        .addOrderBy('g.createdAt', sortDirection.toUpperCase() as 'DESC');
      /!*gameQueryBuilder
        .orderBy('sort_status', sortDirection.toUpperCase() as 'ASC' | 'DESC')
        .addOrderBy('g.createdAt', query.sortDirection.toUpperCase() as 'DESC');*!/
    } else {
      gameQueryBuilder.orderBy(
        `g.${sortField}`,
        sortDirection.toUpperCase() as 'ASC' | 'DESC',
      );
    }

    const [games, totalCount] = await gameQueryBuilder
      .skip((query.pageNumber - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();*/

    const rawQuery = `
  SELECT 
    g.*,
    JSON_AGG(DISTINCT gq) AS questions, 
    jsonb_build_object(
                'id', p1.id, 
                'score', p1.score, 
                'user', jsonb_build_object(
                    'id', u1.id, 
                    'login', u1.login
                )
            ) AS player1,
     CASE 
        WHEN p2.id IS NOT NULL THEN jsonb_build_object(
            'id', p2.id, 
            'score', p2.score, 
            'user', jsonb_build_object(
                'id', u2.id, 
                'login', u2.login
            )
        ) 
        ELSE NULL 
    END AS player2,
    CASE 
        WHEN g.status = 'PendingSecondPlayer' THEN 1 
        WHEN g.status = 'Active' THEN 2 
        WHEN g.status = 'Finished' THEN 3 
    END AS sort_status
  FROM game g
  LEFT JOIN player p1 ON g.player1_id = p1.id
  LEFT JOIN player p2 ON g.player2_id = p2.id
  LEFT JOIN game_question gq ON g.id = gq."gameId"
  LEFT JOIN "user" u1 ON p1."userId" = u1.id
  LEFT JOIN "user" u2 ON p2."userId" = u2.id
  WHERE p1."userId" = $1 OR p2."userId" = $1
  GROUP BY g.id, p1.id, p1.score, u1.id, u1.login, p2.id, p2.score, u2.id, u2.login
  ORDER BY 
    ${sortField === 'status' ? 'sort_status' : 'g."createdAt"'} ${sortDirection.toUpperCase()},
    g."createdAt" DESC  -- Secondary sorting by createdAt (always newest first)
  LIMIT $2 OFFSET $3
`;
    const games = await this.gamesRepoORM.query(rawQuery, [
      userId,
      pageSize,
      (pageNumber - 1) * pageSize,
    ]);
    //console.log('FOUND GAMES', games); //todo remove

    const countQuery: string = `
  SELECT COUNT(*) as "totalCount"
  FROM game g
  LEFT JOIN player p1 ON g.player1_id = p1.id
  LEFT JOIN player p2 ON g.player2_id = p2.id
  WHERE p1."userId" = $1 OR p2."userId" = $1
`;
    const [{ totalCount }] = await this.gamesRepoORM.query(countQuery, [
      userId,
    ]);

    //FETCH MAPPED Game_Question ENTITIES
    const gameIds = games.map((game: Game) => game.id);
    const rawGame_QuestionQuery: string = `
  SELECT 
    gq."gameId",
    JSON_AGG(
      jsonb_build_object(
        'id', q.id,
        'body', q.body
      )
      ORDER BY gq.position
    ) AS questions
  FROM game_question gq
  JOIN question q ON gq."questionId" = q.id
  WHERE gq."gameId" = ANY($1)
  GROUP BY gq."gameId"
  ORDER BY gq."gameId";
`;
    const result = await this.game_questionsRepoORM.query(
      rawGame_QuestionQuery,
      [gameIds],
    );
    /*const gamesQuestions: Game_Question[] = games.flatMap(
      (game: Game) => game.questions,
    ); //extract all Game_Question entities from found games for mapping
    console.log(`GAME_QUESTION ENTITIES FROM FOUND GAMES`, gamesQuestions); //todo remove
    const mappedQuestions: QuestionViewModelForClient[] | null =
      await this._getMappedQuestions(gamesQuestions);
    if (!mappedQuestions) return null;
    console.log('MAPPED QUESTIONS BEFORE FINAL MAPPING', mappedQuestions); //todo remove*/

    //FETCH MAPPED Player_Answer ENTITIES FOR EACH Player ENTITY
    const gamesQuestions: Game_Question[] = games.flatMap(
      (game: Game) => game.questions,
    ); //extract all Game_Question entities from found games for mapping
    const questionIds: string[] = gamesQuestions.map(
      (gq: Game_Question) => gq.questionId,
    ); //extract question IDs

    const mappedAnswers = await Promise.all(
      games.map(async (game: Game) => {
        return await this._getBothPlayersMappedAnswers(
          game.player1_id,
          game.player2_id,
          questionIds,
        );
      }),
    );

    return {
      pagesCount: Math.ceil(Number(totalCount) / pageSize),
      page: pageNumber,
      pageSize: pageSize,
      totalCount: Number(totalCount),
      items: games.map((game: Game, index) => {
        const q = result.find((r) => r.gameId === game.id);
        return this.mapGameToOutput(
          game,
          q?.questions ?? [],
          /*mappedQuestions.filter((q) =>
            game.questions.some((gq) => gq.questionId === q.id),
          ), //filter questions per game*/
          mappedAnswers[index].mappedPlayer1Answers,
          mappedAnswers[index].mappedPlayer2Answers,
        );
      }),
    };
  }

  mapStatsToOutput(
    totalScore: number,
    averageScore: number,
    totalGames: number,
    userStats: { wins: number; losses: number; draws: number },
  ): MyStatisticViewModel {
    return {
      sumScore: totalScore,
      avgScores: averageScore,
      gamesCount: totalGames,
      winsCount: userStats.wins,
      lossesCount: userStats.losses,
      drawsCount: userStats.draws,
    };
  }

  async getMyStatistics(userId: string) {
    // find all games of user by userId
    const games: Game[] = await this.gamesRepoORM.find({
      where: [{ player1: { userId } }, { player2: { userId } }],
      relations: ['player1', 'player1.user', 'player2', 'player2.user'],
    });

    const totalGames = games.length;

    //get all players of targeted user
    const isPlayer = (player: Player | null): player is Player =>
      player !== null;
    const playersWithUserId: Player[] = games.flatMap(
      (game: Game) =>
        [game.player1, game.player2]
          .filter(isPlayer) //removes `null`
          .filter((player) => player.userId === userId), //filters by `userId`
    );

    //get score from player in each found game => sum the score
    const totalScore = playersWithUserId.reduce(
      (sum, player) => sum + player.score,
      0,
    );

    //calculate avg sum of the score
    const averageScore =
      playersWithUserId.length > 0
        ? Math.round((totalScore / playersWithUserId.length) * 100) / 100
        : 0;

    //calculate all victories, losses and draws
    const userStats: { wins: number; losses: number; draws: number } =
      games.reduce(
        (
          stats: { wins: number; losses: number; draws: number },
          game: Game,
        ) => {
          const player =
            game.player1?.userId === userId
              ? game.player1
              : game.player2?.userId === userId
                ? game.player2
                : null;

          const opponent =
            player === game.player1 ? game.player2 : game.player1;

          if (!player || !opponent) return stats; // Skip invalid games

          if (player.score > opponent.score) stats.wins++;
          else if (player.score < opponent.score) stats.losses++;
          else stats.draws++;

          return stats;
        },
        { wins: 0, losses: 0, draws: 0 },
      );

    return this.mapStatsToOutput(
      totalScore,
      averageScore,
      totalGames,
      userStats,
    );
  }

  async getTopUsers(query: TopUsersQueryDTO) {
    /* raw sql
    const rawQuery = `
  SELECT
    g.*,
    jsonb_build_object(
                'id', p1.id,
                'score', p1.score,
                'user', jsonb_build_object(
                    'id', u1.id,
                    'login', u1.login
                )
            ) AS player1,
     CASE
        WHEN p2.id IS NOT NULL THEN jsonb_build_object(
            'id', p2.id,
            'score', p2.score,
            'user', jsonb_build_object(
                'id', u2.id,
                'login', u2.login
            )
        )
        ELSE NULL
    END AS player2,
  FROM game g
  LEFT JOIN player p1 ON g.player1_id = p1.id
  LEFT JOIN player p2 ON g.player2_id = p2.id
  LEFT JOIN game_question gq ON g.id = gq."gameId"
  LEFT JOIN "user" u1 ON p1."userId" = u1.id
  LEFT JOIN "user" u2 ON p2."userId" = u2.id
  WHERE p1."userId" = $1 OR p2."userId" = $1
  GROUP BY g.id, p1.id, p1.score, u1.id, u1.login, p2.id, p2.score, u2.id, u2.login
  LIMIT $2 OFFSET $3
`;*/
    const games: Game[] = await this.gamesRepoORM
      .createQueryBuilder('g')
      .select('g')
      .leftJoinAndSelect('g.player1', 'p1')
      .leftJoinAndSelect('p1.user', 'u1')
      .leftJoinAndSelect('g.player2', 'p2')
      .leftJoinAndSelect('p2.user', 'u2')
      /* .select(['g', 'p1.score', 'u1.login', 'p2.score', 'u2.login', 'q'])*/
      .where('g.status = :status', { status: GameStatus.Finished })
      .getMany();
    /*const { sortBy, pageNumber, pageSize } = query;*/

    const statsMap = new Map<string, TopGamePlayerViewModel>();

    for (const game of games) {
      const players = [
        { player: game.player1, score: game.player1.score },
        { player: game.player2!, score: game.player2!.score },
      ];

      for (const { player, score } of players) {
        const user = player.user;
        if (!user) continue;

        if (!statsMap.has(user.id)) {
          statsMap.set(user.id, {
            sumScore: 0,
            avgScores: 0,
            gamesCount: 0,
            winsCount: 0,
            lossesCount: 0,
            drawsCount: 0,
            player: { id: user.id, login: user.login },
          });
        }

        const stat = statsMap.get(user.id)!;
        stat.sumScore += score;
        stat.gamesCount += 1;

        const isPlayer1 = game.player1.user.id === user.id;
        const opponentScore = isPlayer1
          ? game.player2!.score
          : game.player1.score;

        if (score > opponentScore) stat.winsCount += 1;
        else if (score < opponentScore) stat.lossesCount += 1;
        else stat.drawsCount += 1;
      }
    }

    // 3. Convert to array and calculate average scores
    const statsArray: TopGamePlayerViewModel[] = Array.from(
      statsMap.values(),
    ).map((stat) => ({
      ...stat,
      avgScores: parseFloat((stat.sumScore / stat.gamesCount).toFixed(2)),
    }));

    // 4. Apply sorting from query.sortBy
    for (let i = query.sort?.length - 1; i >= 0; i--) {
      const [field, direction] = query.sort[i].split(' ');
      statsArray.sort((a, b) => {
        const valA = a[field as keyof TopGamePlayerViewModel];
        const valB = b[field as keyof TopGamePlayerViewModel];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return direction === 'desc' ? valB - valA : valA - valB;
        }

        return 0;
      });
    }

    // 5. Apply pagination
    const totalCount = statsArray.length;
    const start = (query.pageNumber - 1) * query.pageSize;
    const end = start + query.pageSize;
    const paginatedItems: TopGamePlayerViewModel[] = statsArray.slice(
      start,
      end,
    );

    return {
      pagesCount: Math.ceil(totalCount / query.pageSize),
      page: query.pageNumber,
      pageSize: query.pageSize,
      totalCount: totalCount,
      items: paginatedItems,
    };

    /*function calculateUserStats(
      games: Game[],
      query: TopUsersQueryDTO,
    ): TopGamePlayerViewModel[] {
      const statsMap = new Map<string, TopGamePlayerViewModel>();

      for (const game of games) {
        const players = [
          { player: game.player1, score: game.player1.score },
          { player: game.player2!, score: game.player2!.score },
        ];

        for (const { player, score } of players) {
          const user = player!.user;
          if (!user) continue;

          if (!statsMap.has(user.id)) {
            statsMap.set(user.id, {
              sumScore: 0,
              avgScores: 0,
              gamesCount: 0,
              winsCount: 0,
              lossesCount: 0,
              drawsCount: 0,
              player: { id: user.id, login: user.login },
            });
          }

          const stat = statsMap.get(user.id)!;
          stat.sumScore += score;
          stat.gamesCount += 1;

          const opponent =
            game.player1.user.id === user.id ? game.player2! : game.player1;
          const opponentScore =
            game.player1.user.id === user.id
              ? game.player2!.score
              : game.player1.score;

          if (score > opponentScore) stat.winsCount += 1;
          else if (score < opponentScore) stat.lossesCount += 1;
          else stat.drawsCount += 1;
        }
      }

      // Calculate averages
      for (const stat of statsMap.values()) {
        stat.avgScores = parseFloat(
          (stat.sumScore / stat.gamesCount).toFixed(2),
        );
      }

      return Array.from(statsMap.values());
    }*/
  }
}
