import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  LoginInputModel,
  NewPasswordRecoveryInputModel,
  PasswordRecoveryInputModel,
  RegistrationConfirmationCodeModel,
  RegistrationEmailResending,
  RegistrationInputModel,
} from './models/input/input.models';
import { MeViewModel } from './models/output/output.models';
import { AuthService } from '../application/authorization.service';
import { AuthQueryRepository } from '../infrastructure/authorization.query.repository';
import { AccessTokenAuthGuard } from '../../../common/guards/jwt-access-token-auth-guard';
import { Response, Request } from 'express';
import { RegisterUserCommand } from '../application/useCases/register-user-use-case';
import { CommandBus } from '@nestjs/cqrs';
import { CreateTokensAndSessionCommand } from '../application/useCases/create-tokens-and-session-use-case';
import { UpdateTokensCommand } from '../application/useCases/update-tokens-use-case';
import { RefreshTokenAuthGuard } from '../../../common/guards/jwt-refresh-token-auth-guard';
import { LogOutCommand } from '../application/useCases/log-out-use-case';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly authService: AuthService,
    private readonly authQueryRepository: AuthQueryRepository,
  ) {}

  @Post('/login')
  /*@UseGuards(ThrottlerGuard)*/
  @HttpCode(HttpStatus.OK)
  async logIn(
    @Req() req: Request,
    @Body() inputModel: LoginInputModel,
    @Res() res: Response,
  ): Promise<void> {
    const deviceName = req.headers['user-agent'];
    const ip = req.ip; /*|| req.headers['x-forwarded-for']*/
    const { loginOrEmail, password } = inputModel;

    const userId = await this.authService.verifyUser(loginOrEmail, password);

    if (!userId) {
      res.sendStatus(HttpStatus.UNAUTHORIZED);
      //throw new UnauthorizedException('Cannot log in');
    }

    const tokens: { accessToken: string; refreshToken: string } | null =
      await this.commandBus.execute(
        new CreateTokensAndSessionCommand(userId!, deviceName!, ip!),
      );

    if (!tokens) {
      res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
      //throw new Error('Cannot create tokens and session');
    } else {
      console.log(`User logged in with ID ${userId}`); // todo REMOVE

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
      });
      res.status(HttpStatus.OK).json({
        accessToken: tokens.accessToken,
      });
    }
  }

  @Post('/registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  /*@UseGuards(ThrottlerGuard)*/
  async registration(@Body() createModel: RegistrationInputModel) {
    const result: boolean = await this.commandBus.execute(
      new RegisterUserCommand(createModel),
    );

    if (!result) {
      throw new Error('Cannot register user');
    }
  }

  @Post('/registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  /*@UseGuards(ThrottlerGuard)*/
  async registrationConfirmation(
    @Body() inputModel: RegistrationConfirmationCodeModel,
  ) {
    const result: boolean = await this.authService.confirmEmail(
      inputModel.code,
    );

    if (!result) {
      throw new Error('Cannot confirm user');
    }

    return;
  }

  @Post('/registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  /*@UseGuards(ThrottlerGuard)*/
  async registrationEmailResending(
    @Body() inputModel: RegistrationEmailResending,
  ) {
    //console.log('throttler ', new Date().getTime()); //COMMENT OUT
    const result: boolean = await this.authService.resendConfirmationCode(
      inputModel.email,
    );

    if (!result) {
      throw new Error('Cannot resend confirmation code');
    }
    return;
  }

  @UseGuards(RefreshTokenAuthGuard)
  @Post('/refresh-token')
  async refreshTokens(@Req() req: Request, @Res() res: Response) {
    const { userId, deviceId } = req.userIdDeviceId;
    const result: { accessToken: string; refreshToken: string } | null =
      await this.commandBus.execute(new UpdateTokensCommand(userId, deviceId));

    if (!result) {
      res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    } else {
      res
        .cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: true,
        })
        .status(200)
        .json({ accessToken: result.accessToken });
    }
  }

  @Post('/password-recovery')
  /*@UseGuards(ThrottlerGuard)*/
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() inputModel: PasswordRecoveryInputModel) {
    const result: boolean = await this.authService.recoverPassword(
      inputModel.email,
    );

    if (!result) {
      throw new Error('Password recovery failed');
    }

    return;
  }

  @Post('/new-password')
  /*@UseGuards(ThrottlerGuard)*/
  @HttpCode(HttpStatus.NO_CONTENT)
  async setNewPassword(@Body() inputModel: NewPasswordRecoveryInputModel) {
    const result = await this.authService.confirmPasswordRecovery(inputModel);

    if (!result) {
      throw new Error('Cannot update a password');
    }

    return;
  }

  @UseGuards(AccessTokenAuthGuard)
  @Get('/me')
  async myCredentials(@Req() req: Request) {
    const userId = req.userId;
    if (!userId) {
      throw new Error('Cannot get userId from request');
    }

    const me: MeViewModel | null =
      await this.authQueryRepository.findUserByUserId(userId);
    //console.log(me); // COMMENT OUT
    if (me) {
      return me;
    } else {
      throw new Error('Cannot find and map user');
    }
  }

  @Post('/logout')
  @UseGuards(RefreshTokenAuthGuard)
  async logOut(@Req() req: Request, @Res() res: Response) {
    const { deviceId } = req.userIdDeviceId;

    const result = await this.commandBus.execute(new LogOutCommand(deviceId));

    if (result === true) {
      res.clearCookie('refreshToken', { httpOnly: true, secure: true });
      res.sendStatus(HttpStatus.NO_CONTENT);
    } else {
      res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
