//import of this module has to be on the top of ALL imports
import { configModule } from './config';
import { Module } from '@nestjs/common';
import { UsersQueryRepository } from './feature/users/infrastructure/users.query.repository';
import { UsersController } from './feature/users/api/users.controller';
import { UsersService } from './feature/users/application/users.service';
import { CryptoService } from './common/utils/adapters/crypto.service';
import { UsersRepository } from './feature/users/infrastructure/users.repository';
import { BlogsController } from './feature/blogs/api/blogs.controller';
import { BlogsService } from './feature/blogs/application/blogs.service';
import { BlogsRepository } from './feature/blogs/infrastructure/blogs.repository';
import { BlogsQueryRepository } from './feature/blogs/infrastructure/blogs.query.repository';
import { PostsQueryRepository } from './feature/posts/infrastructure/posts.query.repository';
import { PostsController } from './feature/posts/api/posts.controller';
import { PostsService } from './feature/posts/application/posts.service';
import { PostsRepository } from './feature/posts/infrastructure/posts.repository';
import { CommentsController } from './feature/comments/api/comments.controller';
import { CommentsQueryRepository } from './feature/comments/infrastucture/comments.query.repository';
import { TestingController } from './feature/test/api/testing.controller';
import { LoginExistsConstraint } from './common/decorators/validate/unique-login';
import { EmailExistsConstraint } from './common/decorators/validate/unique-email';
import { BasicAuthGuard } from './common/guards/basic-auth.guard';
import { AuthService } from './feature/authorization/application/authorization.service';
import { AuthQueryRepository } from './feature/authorization/infrastructure/authorization.query.repository';
import { AccessTokenAuthGuard } from './common/guards/jwt-access-token-auth-guard';
import { AuthController } from './feature/authorization/api/authorization.controller';
import { EmailAdapter } from './common/utils/adapters/email.adapter';
import { EmailIsConfirmedConstraint } from './common/decorators/validate/existing-non-confirmed-email';
import { WrongConfirmationCodeConstraint } from './common/decorators/validate/confirmation-code-from-email';
import { CommentsService } from './feature/comments/application/comments.service';
import { CommentsRepository } from './feature/comments/infrastucture/comments.repository';
import { PostLikesRepository } from './feature/posts/post-likes/infrastructure/post-likes.repository';
import { AttachUserIdGuard } from './common/guards/access-token-userId-guard';
import { CommentLikesRepository } from './feature/comments/comment-likes/infrastructure/comment-likes.repository';
import { JwtModule } from '@nestjs/jwt';
import { BlogDoesNotExistConstraint } from './common/decorators/validate/existing-blog';
import { RegisterUserUseCase } from './feature/authorization/application/useCases/register-user-use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateTokensAndSessionUseCase } from './feature/authorization/application/useCases/create-tokens-and-session-use-case';
import { UpdateTokensUseCase } from './feature/authorization/application/useCases/update-tokens-use-case';
import { RefreshTokenAuthGuard } from './common/guards/jwt-refresh-token-auth-guard';
import { LogOutUseCase } from './feature/authorization/application/useCases/log-out-use-case';
import { SessionsController } from './feature/sessions/api/sessions.controller';
import { SessionsQueryRepository } from './feature/sessions/infrastructure/sessions.query.repository';
import { DeleteUnusedSessionsUseCase } from './feature/sessions/application/useCases/delete-unused-sessions-use-case';
import { SessionsRepository } from './feature/sessions/infrastructure/sessions.repository';
import { DeleteSessionByDeviceIdUseCase } from './feature/sessions/application/useCases/delete-session-by-deviceId-use-case';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogsPublicController } from './feature/blogs_public/api/blogs-public.controller';
import { User } from './feature/users/domain/TypeORM/user.entity';
import { UserEmailConfirmationInfo } from './feature/users/domain/TypeORM/userEmailConfirmationInfo.entity';
import { Session } from './feature/sessions/domain/TypeORM/session.entity';
import { Blog } from './feature/blogs/domain/TypeORM/blog.entity';
import { Post } from './feature/posts/domain/TypeORM/post.entity';
import { Comment } from './feature/comments/domain/TypeORM/comment.entity';
import { CommentLike } from './feature/comments/comment-likes/domain/TypeORM/commentLike.entity';
import { PostLike } from './feature/posts/post-likes/domain/TypeORM/postLike.entity';
import { QuestionsController } from './feature/quiz/api/questions.controller';
import { QuestionsRepository } from './feature/quiz/infrastructure/questions.repository';
import { QuestionsQueryRepository } from './feature/quiz/infrastructure/questions.query.repository';
import { Question } from './feature/quiz/domain/question.entity';
import { CreateQuestionUseCase } from './feature/quiz/application/useCases/create-question-use-case';
import { DeleteQuestionUseCase } from './feature/quiz/application/useCases/delete-question-use-case';
import { PublishQuestionUseCase } from './feature/quiz/application/useCases/publish-question-use-case';
import { UpdateQuestionUseCase } from './feature/quiz/application/useCases/update-question-use-case';
import { CreateOrJoinPairUseCase } from './feature/quiz-game/application/useCases/create-or-join-pair-use-case';
import { Game } from './feature/quiz-game/domain/game.entity';
import { Player } from './feature/quiz-game/domain/player.entity';
import { Player_Answer } from './feature/quiz-game/domain/player-answer.entity';
import { Game_Question } from './feature/quiz-game/domain/game-question.entity';
import { QuizGamesController } from './feature/quiz-game/api/quiz-games.controller';
import { QuizGamesRepository } from './feature/quiz-game/infrastructure/quiz-games.repository';
import { QuizGamesQueryRepository } from './feature/quiz-game/infrastructure/quiz-games.query.repository';
import { AnswerTheQuestionUseCase } from './feature/quiz-game/application/useCases/answer-the-question-use-case';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreModule } from './core/core.module';

const useCases = [
  RegisterUserUseCase,
  CreateTokensAndSessionUseCase,
  UpdateTokensUseCase,
  LogOutUseCase,
  DeleteUnusedSessionsUseCase,
  DeleteSessionByDeviceIdUseCase,
  CreateQuestionUseCase,
  DeleteQuestionUseCase,
  UpdateQuestionUseCase,
  PublishQuestionUseCase,
  CreateOrJoinPairUseCase,
  AnswerTheQuestionUseCase,
];

@Module({
  //Module registration
  imports: [
    //core config module
    CoreModule,
    //config module
    configModule,
    //task scheduling module
    ScheduleModule.forRoot(),
    //cqrs module
    CqrsModule,
    //jwt module
    JwtModule.register({
      global: true,
      /*secret: appSettings.api.JWT_ACCESS_TOKEN_SECRET,
      signOptions: { expiresIn: '10sec' },*/
    }),
    //request limit module
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),
    //typeORM module
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 3423,
      username: 'postgres',
      password: 'sa',
      database: 'Incubator App',
      ssl: false,
      extra: {
        ssl: false, // Some clients require this extra flag
      },
      autoLoadEntities: true,
      synchronize: true,
      //logging: true,
    }),
    TypeOrmModule.forFeature([
      User,
      UserEmailConfirmationInfo,
      Session,
      Blog,
      Post,
      PostLike,
      Comment,
      CommentLike,
      Question,
      Game,
      Player,
      Player_Answer,
      Game_Question,
    ]),
    /*//mongoose module
    MongooseModule.forRootAsync({
      /!*imports: [CoreModule],*!/
      useFactory: (coreConfig: CoreConfig) => {
        return {
          uri: coreConfig.mongoURI,
        };
      },
      inject: [CoreConfig],
    }),*/
  ],
  //Controller registration
  controllers: [
    UsersController,
    BlogsController,
    BlogsPublicController,
    PostsController,
    CommentsController,
    TestingController,
    AuthController,
    SessionsController,
    QuestionsController,
    QuizGamesController,
  ],
  //Provider registrations
  providers: [
    //useCases
    ...useCases,
    //users
    UsersQueryRepository,
    UsersRepository,
    UsersService,
    //blogs
    BlogsService,
    BlogsRepository,
    BlogsQueryRepository,
    //posts
    PostsQueryRepository,
    PostsService,
    PostsRepository,
    PostLikesRepository,
    //comments
    CommentsQueryRepository,
    CommentsService,
    CommentsRepository,
    CommentLikesRepository,
    //authorization
    AuthService,
    AuthQueryRepository,
    //sessions
    SessionsQueryRepository,
    SessionsRepository,
    //quiz-questions
    QuestionsRepository,
    QuestionsQueryRepository,
    //quiz-game
    QuizGamesRepository,
    QuizGamesQueryRepository,
    //constraints
    LoginExistsConstraint,
    EmailExistsConstraint,
    EmailIsConfirmedConstraint,
    WrongConfirmationCodeConstraint,
    BlogDoesNotExistConstraint,
    //guards
    BasicAuthGuard,
    AccessTokenAuthGuard,
    AttachUserIdGuard,
    RefreshTokenAuthGuard,
    //adapters
    EmailAdapter,
    CryptoService,
    /*//ngrok
    NgrokService,*/
  ],
})
export class AppModule {}
