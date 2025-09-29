import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizGamesRepository } from '../../infrastructure/quiz-games.repository';
import { Game_Question } from '../../domain/game-question.entity';
import { Player } from '../../domain/player.entity';
import { Player_Answer } from '../../domain/player-answer.entity';
import {
  GameAnswersInternalServerError,
  NotInActivePairOrQuestionsAlreadyAnsweredError,
} from '../../../../common/utils/result-type/result-type';
import { AnswerStatus } from '../../api/models/output/answer.output.model';
import { Question } from '../../../quiz/domain/question.entity';
import { AnswerDTO } from '../../DTOs/answerDTO';
import { Game } from '../../domain/game.entity';
import { QueryRunner } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';

export class AnswerTheQuestionCommand {
  constructor(
    public userId: string,
    public answer: string,
  ) {}
}

@CommandHandler(AnswerTheQuestionCommand)
export class AnswerTheQuestionUseCase
  implements ICommandHandler<AnswerTheQuestionCommand>
{
  constructor(
    private readonly quizGamesRepository: QuizGamesRepository,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async execute(command: AnswerTheQuestionCommand) {
    const queryRunner: QueryRunner =
      await this.quizGamesRepository.startTransaction();
    console.log(
      `Transaction for answer creation "${command.answer}" and probable game ending started for user ${command.userId}`,
    ); //todo REMOVE

    try {
      //STEP 1: get a targeted player by fetching an active(status) and unfinished(gameEndDate) game of this player by userId
      const game: Game | null =
        await this.quizGamesRepository.findActiveGameByUserId_LockedGame(
          command.userId,
          queryRunner,
        );
      if (!game) {
        console.log(
          `Rolling backing transaction for user: ${command.userId} as user is not in an active game.`,
        ); //todo REMOVE
        await this.quizGamesRepository.rollbackTransaction(queryRunner);
        console.log(
          `Transaction rolled back successfully as user: ${command.userId} is not in an active game.`,
        ); //todo REMOVE
        return {
          success: false,
          error: new NotInActivePairOrQuestionsAlreadyAnsweredError(),
        };
      }
      console.log('FOUND GAME FOR ANSWER CREATION', game); // todo remove

      const player1 =
        await this.quizGamesRepository.findPlayerWithAnswersByPlayerId(
          game.player1_id,
          queryRunner,
        );
      const player2 =
        await this.quizGamesRepository.findPlayerWithAnswersByPlayerId(
          game.player2_id!,
          queryRunner,
        );

      /*if (
        !game.player1 ||
        !game.player2 ||
        !game.questions ||
        (game.player1.answers === undefined &&
          game.player2.answers === undefined)
      ) {
        console.log(
          `Rolling backing transaction for user: ${command.userId} as there were problems in retrieving an active game.`,
        ); //todo REMOVE
        await this.quizGamesRepository.rollbackTransaction(queryRunner);
        console.log(
          `Transaction rolled back successfully as there were problems in retrieving an active game.`,
        ); //todo REMOVE
        return {
          success: false,
          error: new GameAnswersInternalServerError(),
        };
      }*/
      /*ended up doing it in execute method, instead of using a separate method
      const targetedGame: Game | { success: false; error: DomainError } =
        await this.getActiveGameByUserId(command.userId, queryRunner);

      if ('success' in targetedGame && !targetedGame.success) {
        console.error(targetedGame.error.message);
        console.log(
          `Committing transaction for user: ${command.userId} as user is not in an active game.`,
        ); //todo REMOVE
        await this.quizGamesRepository.commitTransaction(queryRunner);
        console.log(
          `Transaction committed successfully as user is not in an active game.`,
        ); //todo REMOVE
        return targetedGame;
      }
      const game: Game = targetedGame as Game;*/

      const targetedPlayer: Player =
        player1.userId === command.userId ? player1 : player2;

      //STEP 2: get answers, if any
      const answers: Player_Answer[] | [] = targetedPlayer.answers;

      //STEP 3a: check that the answers exist and answers.length is less than 5, then answer the next question (create Player_Answer) and add score if the answer is correct
      if (answers.length >= 1) {
        if (answers.length >= 5) {
          console.log(
            `Rolling back transaction for user: ${command.userId} as user has already answered all questions in game: ${game.id}.`,
          ); //todo REMOVE
          await this.quizGamesRepository.rollbackTransaction(queryRunner);
          console.log(
            `Transaction rolled back successfully as user: ${command.userId} has already answered all questions in game: ${game.id}.`,
          ); //todo REMOVE
          return {
            success: false,
            error: new NotInActivePairOrQuestionsAlreadyAnsweredError(),
          };
        }

        const createdAnswerId: string = await this.answerTheQuestion(
          answers,
          targetedPlayer.id,
          game.questions!,
          command.answer,
          queryRunner,
        );
        console.log(
          `The next answer "${command.answer}" is created with ID: ${createdAnswerId} by user ${command.userId} in game ${game.id} and score added if it was correct.`,
        ); //todo REMOVE

        //STEP 4a: if all 5 questions are answered by current player => finish the game, see who answered them 1st and add 1 point to their score if at least one answer is correct
        const gameWithUpdatedAnswers: Game | null =
          await this.quizGamesRepository.findActiveGameByUserId(
            command.userId,
            queryRunner,
          );
        if (!gameWithUpdatedAnswers) {
          console.log(
            `Rolling back transaction for user: ${command.userId} as there were problems in retrieving an active game ${game.id} with updated answers.`,
          ); //todo REMOVE
          await this.quizGamesRepository.rollbackTransaction(queryRunner);
          console.log(
            `Transaction rolled back successfully as there were problems in retrieving an active game ${game.id} with updated answers for user: ${command.userId}.`,
          ); //todo REMOVE
          return {
            success: false,
            error: new GameAnswersInternalServerError(),
          };
        }

        /*ended up doing it in execute method, instead of using a separate method
        const updatedGame: Game | { success: false; error: DomainError } =
          await this.getActiveGameByUserId(targetedPlayer.userId, queryRunner);

        if ('success' in updatedGame && !updatedGame.success) {
          console.error(updatedGame.error.message);
          return updatedGame;
        }
        const gameWithUpdatedAnswers: Game = updatedGame as Game;*/
        /*const updatedAnswers: Player_Answer[] =
          gameWithUpdatedAnswers.player1.userId === command.userId
            ? gameWithUpdatedAnswers.player1.answers
            : gameWithUpdatedAnswers.player2!.answers;*/

        /*if (
          gameWithUpdatedAnswers.player1.answers.length === 5 &&
          gameWithUpdatedAnswers.player2!.answers.length === 5
        ) {
          //finish the Game
          await this.finishTheGame(
            gameWithUpdatedAnswers,
            command.userId,
            queryRunner,
          );
          console.log(
            `Game ${gameWithUpdatedAnswers.id} is successfully finished by user ${command.userId}.`,
          );
          console.log(
            `Committing transaction for user with ID ${command.userId} as the last answer with ID ${createdAnswerId} is created by user ${command.userId} and the game with ID ${gameWithUpdatedAnswers.id} is finished.`,
          );
          await this.quizGamesRepository.commitTransaction(queryRunner);
          console.log(
            `Transaction committed successfully as the last answer with ID ${createdAnswerId} is created by user ${command.userId} and the game with ID ${gameWithUpdatedAnswers.id} is finished.`,
          );
          return { success: true, value: createdAnswerId };
        }*/

        const currentPlayer: Player =
          gameWithUpdatedAnswers.player1.userId === command.userId
            ? gameWithUpdatedAnswers.player1
            : gameWithUpdatedAnswers.player2!;
        if (
          currentPlayer.answers.length === 5 /*||
          gameWithUpdatedAnswers.player2!.answers.length === 5*/
        ) {
          //give 10 sec to the opponent and finish the Game, marking her/his unanswered questions as incorrect
          await this.finishTheGame(
            gameWithUpdatedAnswers,
            command.userId,
            queryRunner,
          );
          console.log(
            `Game ${gameWithUpdatedAnswers.id} is successfully finished by user ${command.userId} as she/he was the first to finish.`,
          );
          console.log(
            `Committing transaction for user with ID ${command.userId} as the last answer with ID ${createdAnswerId} is created by user ${command.userId} and the game with ID ${gameWithUpdatedAnswers.id} is finished 10 sec after her/his last answer creation.`,
          ); //todo REMOVE
          await this.quizGamesRepository.commitTransaction(queryRunner);
          console.log(
            `Transaction committed successfully as the last answer with ID ${createdAnswerId} is created by user ${command.userId} and the game with ID ${gameWithUpdatedAnswers.id} is finished 10 sec after her/his last answer creation.`,
          ); //todo REMOVE
          return { success: true, value: createdAnswerId };
        }

        console.log(
          `Committing transaction for user: ${command.userId} as the next answer with ID: ${createdAnswerId} is created in game ${gameWithUpdatedAnswers.id}.`,
        ); //todo REMOVE
        await this.quizGamesRepository.commitTransaction(queryRunner);
        console.log(
          `Transaction committed successfully as the next answer with ID ${createdAnswerId} is created by user ${command.userId} in game ${gameWithUpdatedAnswers.id}.`,
        ); //todo REMOVE
        return { success: true, value: createdAnswerId };
      } else {
        //STEP 3b: answer the 1st questions
        const createdAnswerId: string = await this.answerTheQuestion(
          answers,
          targetedPlayer.id,
          game.questions,
          command.answer,
          queryRunner,
        );
        console.log(
          `The 1st answer "${command.answer}" is created with ID ${createdAnswerId} by user ${command.userId} for game ${game.id} and score added if it the answer was correct.`,
        ); //todo REMOVE
        console.log(
          `Committing transaction for user: ${command.userId} as the 1st answer with ID: ${createdAnswerId} is created.`,
        ); //todo REMOVE
        await this.quizGamesRepository.commitTransaction(queryRunner);
        console.log(
          `Transaction committed successfully as the 1st answer with ID: ${createdAnswerId} is created by user: ${command.userId}.`,
        ); //todo REMOVE
        return { success: true, value: createdAnswerId };
      }
    } catch (error) {
      console.error(
        `Transactional Error in AnswerTheQuestionUseCase, user ID ${command.userId}:`,
        error,
      );
      await this.quizGamesRepository.rollbackTransaction(queryRunner);
      console.log(
        `Transactional Error in AnswerTheQuestionUseCase, user ID ${command.userId}`,
      );
      throw new Error('TRANSACTIONAL ERROR OCCURRED');
    }
  }

  /* ended up not needing it
  private async getActiveGameByUserId(
    userId: string,
    queryRunner: QueryRunner,
  ): Promise<Game | { success: false; error: DomainError }> {
    const game: Game | null =
      await this.quizGamesRepository.findActiveGameByUserId(
        userId,
        queryRunner,
      );

    if (!game)
      return {
        success: false,
        error: new NotInActivePairOrQuestionsAlreadyAnsweredError(),
      };

    if (
      !game.player1 ||
      !game.player2 ||
      !game.questions ||
      (game.player1.answers === undefined &&
        game.player2!.answers === undefined)
    )
      return {
        success: false,
        error: new GameAnswersInternalServerError(),
      };

    return game;
  }*/

  private async answerTheQuestion(
    answers: Player_Answer[] | [],
    targetedPlayerId: string,
    gameQuestions: Game_Question[],
    answer: string,
    queryRunner: QueryRunner,
  ): Promise<string> {
    //get questionId of each answered question from answers
    const answeredGameQuestionsIds: string[] | null =
      answers.length > 0
        ? answers.map((answer: Player_Answer) => answer.game_questionId)
        : null;

    //get unanswered questions sorted by 'position' in asc order
    const unansweredGameQuestionsAscSortedByPosition: Game_Question[] =
      gameQuestions
        .filter(
          (gameQuestion) =>
            !answeredGameQuestionsIds ||
            !answeredGameQuestionsIds.includes(gameQuestion.id),
        )
        .sort((a, b) => a.position - b.position);

    //fetch correct answers of the target question and check if the user provided answer is correct and increase the score if needed
    const targetGameQuestionId: string =
      unansweredGameQuestionsAscSortedByPosition[0].id;
    const targetQuestionId: string =
      unansweredGameQuestionsAscSortedByPosition[0].questionId;
    console.log(
      `THE NEXT QUESTION ID ${targetQuestionId}, THE NEXT GAME_QUESTION ID ${targetGameQuestionId}`,
    ); // todo remove;

    const isTheAnswerCorrect: boolean =
      await this._checkTheAnswerAndAddTheScore(
        targetQuestionId,
        answer,
        targetedPlayerId,
        queryRunner,
      );

    //create a Player_Answer for the 1st question in the filtered and sorted array above
    const createdAnswerId: string = await this._createAnswer(
      targetedPlayerId,
      targetGameQuestionId,
      answer,
      isTheAnswerCorrect,
      queryRunner,
    );
    return createdAnswerId;
  }

  private async _checkTheAnswerAndAddTheScore(
    questionId: string,
    answer: string,
    playerId: string,
    queryRunner: QueryRunner,
  ): Promise<boolean> {
    const question: Question = await this._getQuestionById(
      questionId,
      queryRunner,
    );

    const correctAnswers: string[] = question.correctAnswers;
    const isTheAnswerCorrect: boolean = correctAnswers.includes(answer);

    if (isTheAnswerCorrect) {
      await this._increaseScore(playerId, queryRunner);
      console.log('score increased after providing a correct answer'); // todo REMOVE
    }
    return isTheAnswerCorrect;
  }

  private async _getQuestionById(
    questionId: string,
    queryRunner: QueryRunner,
  ): Promise<Question> {
    return await this.quizGamesRepository.findQuestionByIdQuizGameRepo(
      questionId,
      queryRunner,
    );
  }

  private async _increaseScore(playerId: string, queryRunner: QueryRunner) {
    await this.quizGamesRepository.increaseScore(playerId, queryRunner);
  }

  private async _createAnswer(
    playerId: string,
    targetGameQuestionId: string,
    answer: string,
    isTheAnswerCorrect: boolean,
    queryRunner: QueryRunner,
  ): Promise<string> {
    const DTO: AnswerDTO = {
      playerId: playerId,
      game_questionId: targetGameQuestionId,
      body: answer,
      status: isTheAnswerCorrect
        ? AnswerStatus.Correct
        : AnswerStatus.Incorrect,
    };

    const createdAnswerId: string = await this.quizGamesRepository.createAnswer(
      DTO,
      queryRunner,
    );
    console.log('answer created'); // todo REMOVE
    return createdAnswerId;
  }

  private async finishTheGame(
    game: Game,
    finishedPlayerUserId: string,
    queryRunner: QueryRunner,
  ) {
    const [player1, player2] = [game.player1, game.player2!];

    const awaitedPlayer: Player =
      player1.userId === finishedPlayerUserId ? player2 : player1;
    const finishedPlayer: Player =
      player1.userId === finishedPlayerUserId ? player1 : player2;

    // 10-second wait for the second player to possibly finish
    const timeoutName = `finish-game-${game.id}`;
    const callback = async () => {
      const timeoutQueryRunner: QueryRunner =
        await this.quizGamesRepository.startTransaction();
      console.log(
        `Transaction for game "${game.id}" ending with 10 sec timeout started by user "${finishedPlayerUserId}"`,
      ); //todo REMOVE
      try {
        await this.handleFinishGameWithDefaults(
          game,
          awaitedPlayer,
          finishedPlayer,
          timeoutQueryRunner,
        );
        console.log(
          `Committing transaction for user ${finishedPlayerUserId} as the game ${game.id} is finished after 10 sec wait.`,
        ); //todo REMOVE
        await this.quizGamesRepository.commitTransaction(timeoutQueryRunner);
        console.log(
          `Transaction committed successfully by user ${finishedPlayerUserId} as the game with ID ${game.id} is finished 10 sec after her/his last answer creation.`,
        ); //todo REMOVE
      } catch (err) {
        console.error(`Error in game timeout [${game.id}]:`, err);
        console.log(
          `Rolling back transaction for user: ${finishedPlayerUserId} as there is an error in timeout in game: ${game.id}.`,
        ); //todo REMOVE
        await this.quizGamesRepository.rollbackTransaction(timeoutQueryRunner);
        console.log(
          `Transaction rolled back successfully for user ${finishedPlayerUserId} as there is an error in timeout in game: ${game.id}.`,
        ); //todo REMOVE
      } finally {
        this.schedulerRegistry.deleteTimeout(timeoutName);
      }
    };
    const timeout = setTimeout(callback, 8_000);
    /* Immediately Invoked Async Function Expression (IIFE) inside setTimeout
    const timeout = setTimeout(() => {
      (async () => {
        try {
          await this.handleFinishGameWithDefaults(
            game,
            awaitedPlayer,
            finishedPlayer,
            queryRunner,
          );
        } catch (err) {
          console.error(`Error in game timeout [${game.id}]:`, err);
        } finally {
          this.schedulerRegistry.deleteTimeout(timeoutName);
        }
      })();
    }, 8_000); // 10 seconds*/

    this.schedulerRegistry.addTimeout(timeoutName, timeout);

    /* //finish the game
    await this.quizGamesRepository.finishTheGame(game.id, queryRunner);
    console.log('game finished');

    //get questionId of each answered question from answers
    const answeredGameQuestionsIds: string[] | null =
      updatedAwaitedPlayer.answers.length > 0
        ? updatedAwaitedPlayer.answers.map(
            (answer: Player_Answer) => answer.game_questionId,
          )
        : null;

    //get unanswered questions sorted by 'position' in asc order
    const unansweredGameQuestionsAscSortedByPosition: Game_Question[] =
      game.questions
        .filter(
          (gameQuestion) =>
            !answeredGameQuestionsIds ||
            !answeredGameQuestionsIds.includes(gameQuestion.id),
        )
        .sort((a, b) => a.position - b.position);

    const unansweredGameQuestionIds: string[] =
      unansweredGameQuestionsAscSortedByPosition.map(
        (gq: Game_Question) => gq.id,
      );

    for (const id of unansweredGameQuestionIds) {
      await this._createAnswer(
        updatedAwaitedPlayer.id,
        id,
        'null',
        false,
        queryRunner,
      );
    }

    /!*const updatedAwaitedPlayerAfterFiveAnswersCreation: Player =
        await this.quizGamesRepository.findPlayerWithAnswersByPlayerId(
          awaitedPlayer.id,
          queryRunner,
        );
      const updatedFinishedPlayer: Player =
       await this.quizGamesRepository.findPlayerWithAnswersByPlayerId(
         finishedPlayer.id,
         queryRunner,
       );*!/
    const updatedPlayer1 =
      updatedAwaitedPlayer.userId === game.player1.userId
        ? updatedAwaitedPlayer
        : finishedPlayer;
    const updatedPlayer2 =
      updatedAwaitedPlayer.userId === game.player2!.userId
        ? updatedAwaitedPlayer
        : finishedPlayer;

    /!*const isPlayer1First =
        player1.createdAt.getTime() < player2.createdAt.getTime();

      const player1answers = isPlayer1First ? player1.answers : player2.answers;
      const player2answers = isPlayer1First ? player2.answers : player1.answers;*!/

    console.log(
      'PLAYER 1 ANSWERS: ',
      updatedPlayer1.answers,
      'PLAYER 2 ANSWERS: ',
      updatedPlayer2.answers,
    );
    await this._addBonus(
      updatedPlayer1.answers,
      updatedPlayer2.answers,
      queryRunner,
    );*/
  }

  /* for when both players have to answer 5 qs to finish the game
    //finish the game
    await this.quizGamesRepository.finishTheGame(game.id, queryRunner);
    console.log('game finished');

    /add bonus
     const player1answers =
      game.player1.createdAt.getTime() < game.player2!.createdAt.getTime()
        ? game.player1.answers!
        : game.player2!.answers!;
    const player2answers =
      game.player2!.createdAt.getTime() > game.player1.createdAt.getTime()
        ? game.player2!.answers!
        : game.player1.answers!;*!/
    const isPlayer1First =
      game.player1.createdAt.getTime() < game.player2!.createdAt.getTime();

    const player1answers = isPlayer1First
      ? game.player1.answers!
      : game.player2!.answers!;
    const player2answers = isPlayer1First
      ? game.player2!.answers!
      : game.player1.answers!;

    await this._addBonus(player1answers, player2answers, queryRunner);*/

  private async handleFinishGameWithDefaults(
    game: Game,
    awaitedPlayer: Player,
    finishedPlayer: Player,
    queryRunner: QueryRunner,
  ) {
    // refresh the awaited player state to check for any new answers
    const updatedAwaitedPlayer: Player =
      await this.quizGamesRepository.findPlayerWithAnswersByPlayerId(
        awaitedPlayer.id,
        queryRunner,
      );

    // finish the game and mark unanswered questions as incorrect if not all 5 questions are answered
    if (updatedAwaitedPlayer.answers.length < 5) {
      await this.quizGamesRepository.finishTheGame(game.id, queryRunner);
      console.log('game finished'); // todo remove

      const answeredGameQuestionsIds: string[] | null =
        updatedAwaitedPlayer.answers.length > 0
          ? updatedAwaitedPlayer.answers.map(
              (answer: Player_Answer) => answer.game_questionId,
            )
          : null;

      const unansweredGameQuestionsAscSortedByPosition: Game_Question[] =
        game.questions
          .filter(
            (gameQuestion) =>
              !answeredGameQuestionsIds ||
              !answeredGameQuestionsIds.includes(gameQuestion.id),
          )
          .sort((a, b) => a.position - b.position);

      const unansweredGameQuestionIds: string[] =
        unansweredGameQuestionsAscSortedByPosition.map(
          (gq: Game_Question) => gq.id,
        );

      for (const id of unansweredGameQuestionIds) {
        await this._createAnswer(
          updatedAwaitedPlayer.id,
          id,
          'null',
          false,
          queryRunner,
        );
      }

      const updatedPlayer1 =
        updatedAwaitedPlayer.userId === game.player1.userId
          ? updatedAwaitedPlayer
          : finishedPlayer;
      const updatedPlayer2 =
        updatedAwaitedPlayer.userId === game.player2!.userId
          ? updatedAwaitedPlayer
          : finishedPlayer;

      await this._addBonus(
        updatedPlayer1.answers,
        updatedPlayer2.answers,
        queryRunner,
      );
    } //todo else if all 5 questions are answered by awaited users
  }

  private async cancelFinishTimeout(gameId: string) {
    const timeoutName = `finish-game-${gameId}`;
    if (this.schedulerRegistry.doesExist('timeout', timeoutName)) {
      this.schedulerRegistry.deleteTimeout(timeoutName);
      console.log(`Timeout for game ${gameId} cancelled`);
    }
  }

  private async _addBonus(
    player1answers: Player_Answer[] | [],
    player2answers: Player_Answer[] | [],
    queryRunner: QueryRunner,
  ) {
    /*const player1answersAcsSortedByCreatedAt: Player_Answer[] =
      player1answers.length > 0
        ? player1answers
            /!*.filter((a: Player_Answer) => a.body !== 'null')*!/
            .sort(
              (a: Player_Answer, b: Player_Answer) =>
                (a.createdAt as Date).getTime() -
                (b.createdAt as Date).getTime(),
            )
        : [];
    const player2answersAcsSortedByCreatedAt =
      player2answers.length > 0
        ? player2answers
            /!*.filter((a: Player_Answer) => a.body !== 'null')*!/
            .sort(
              (a: Player_Answer, b: Player_Answer) =>
                (a.createdAt as Date).getTime() -
                (b.createdAt as Date).getTime(),
            )
        : [];*/

    /*const player1FinishedAt =
      player1answersAcsSortedByCreatedAt.length > 0
        ? player1answersAcsSortedByCreatedAt[
            player1answersAcsSortedByCreatedAt.length - 1
          ].createdAt.toISOString()
        : null;
    const player2FinishedAt =
      player2answersAcsSortedByCreatedAt.length > 0
        ? player2answersAcsSortedByCreatedAt[
            player2answersAcsSortedByCreatedAt.length - 1
          ].createdAt.toISOString()
        : null;*/

    const player1FinishedFirst = player1answers.length > player2answers.length;
    const player2FinishedFirst = player2answers.length > player1answers.length;

    const player1HasCorrect =
      player1answers.length > 0
        ? player1answers.some(
            (ans: Player_Answer) => ans.status === AnswerStatus.Correct,
          )
        : false;
    const player2HasCorrect =
      player2answers.length > 0
        ? player2answers.some(
            (ans: Player_Answer) => ans.status === AnswerStatus.Correct,
          )
        : false;

    if (
      /*player1answersAcsSortedByCreatedAt[4].createdAt.toISOString() <
      player2answersAcsSortedByCreatedAt[4].createdAt.toISOString()*/
      /*player1FinishedAt &&
      player2FinishedAt &&
      player1FinishedAt < player2FinishedAt &&*/
      player1FinishedFirst &&
      !player2FinishedFirst &&
      player1HasCorrect
    ) {
      // increase score of player 1
      await this._increaseScore(player1answers[0].playerId, queryRunner);
      console.log(
        'score for the 1st player increased as he was the 1st to finish and has at least one correct answer',
      ); // todo REMOVE
    } else if (
      /*player2FinishedAt &&
      player1FinishedAt &&
      player2FinishedAt < player1FinishedAt &&*/
      player2FinishedFirst &&
      !player1FinishedFirst &&
      player2HasCorrect
    ) {
      // increase score of player 2
      await this._increaseScore(player2answers[0].playerId, queryRunner);
      console.log(
        'score for the 2nd player increased as he was the 1st to finish and has at least one correct answer',
      ); // todo REMOVE
    } /*else if (
      player1FinishedAt && !player2FinishedAt &&
      player1HasCorrect
    ) {
      // increase score of player 1
      await this._increaseScore(player1answers[0].playerId, queryRunner);
      console.log(
        'score for the 1st player increased as he was the 1st to finish and has at least one correct answer + player2 has no answers',
      ); // todo REMOVE
    } else if (!player1FinishedAt && player2FinishedAt && player2HasCorrect) {
      // increase score of player 2
      await this._increaseScore(player2answers[0].playerId, queryRunner);
      console.log(
        'score for the 2nd player increased as he was the 1st to finish and has at least one correct answer + player1 has no answers',
      ); // todo REMOVE
    } */ else {
      console.log(
        'no bonus given — either tie or no correct answers for faster player',
      );
    } // todo REMOVE
  }
}
