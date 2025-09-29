import { v4 as uuidv4 } from 'uuid';
import { User } from '../../../feature/users/domain/TypeORM/user.entity';
import { Player } from '../../../feature/quiz-game/domain/player.entity';
import { Game } from '../../../feature/quiz-game/domain/game.entity';
import { GameStatus } from '../../../feature/quiz-game/api/models/output/game-pair.output.model';
import { Question } from '../../../feature/quiz/domain/question.entity';
import { Game_Question } from '../../../feature/quiz-game/domain/game-question.entity';

export const createMockUser = (
  login: string,
  passwordHash: string,
  email: string,
): User => {
  const user: User = new User();
  user.id = uuidv4();
  user.login = login;
  user.passwordHash = passwordHash;
  user.email = email;
  user.isConfirmed = true;
  user.players = [];
  return user;
};

export const createMockPlayer = (user: User, gameId?: string): Player => {
  const player: Player = new Player();
  player.id = uuidv4();
  player.user = user;
  player.userId = user.id;
  player.gameId = gameId ? gameId : null;
  player.answers = [];
  player.score = 0;
  return player;
};

export const createMockGame = (
  player: Player,
  status: GameStatus = GameStatus.PendingSecondPlayer,
): Game => {
  const game: Game = new Game();
  game.id = uuidv4();
  game.status = status;
  game.player1 = player;
  game.player1_id = player.id;
  game.player2 = null;
  game.player2_id = null;
  game.questions = [];
  game.gameStartDate = null;
  game.gameEndDate = null;
  return game;
};

export const assignPlayer1ToGame = (player: Player, game: Game): Player => {
  player.gameId = game.id;
  return player;
};

export const createMockQuestion = (): Question => {
  const question = new Question();
  question.id = uuidv4();
  question.body = (Math.random() + 1).toString(36).substring(7);
  question.correctAnswers = [(Math.random() + 1).toString(36).substring(7)];
  question.published = true;
  question.game_questions = [];
  return question;
};

export const getFiveRandomMockQuestions = (): Question[] => {
  return Array.from({ length: 5 }, () => createMockQuestion());
};

export const createFiveMockGameQuestions = (
  game: Game,
  questions: Question[],
): Game_Question[] => {
  return questions.map((question, index) => {
    const gameQuestion = new Game_Question();
    gameQuestion.id = uuidv4();
    gameQuestion.game = game;
    gameQuestion.gameId = game.id;
    gameQuestion.question = question;
    gameQuestion.questionId = question.id;
    gameQuestion.player_answers = [];
    gameQuestion.position = index + 1;
    return gameQuestion;
  });
};
