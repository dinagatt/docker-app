import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../application/users.service';
import { UsersQueryRepository } from '../infrastructure/users.query.repository';
import { UserInputModel } from './models/input/create-user.input.model';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard';
import { UserQueryDto } from '../../../common/utils/pagination/userQueryDTO';

@Controller('sa/users')
@UseGuards(BasicAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Post()
  async createUser(@Body() createModel: UserInputModel) {
    const { login, password, email } = createModel;

    const createdUserId = await this.usersService.createUser(
      login,
      password,
      email,
    );
    console.log(`User with ID ${createdUserId} created`); // todo REMOVE

    if (createdUserId === null) {
      throw new Error(
        `User with email ${email} and login ${login} was not created, users' controller`,
      );
    } else {
      const createdUser =
        await this.usersQueryRepository.getById(createdUserId);

      if (createdUser) {
        return createdUser;
      } else {
        throw new NotFoundException(
          `User with email ${email} and login ${login} was not found and mapped, users' controller`,
        );
      }
    }
  }

  @Delete('/:id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    const isDeleted: boolean = await this.usersService.delete(id);

    if (!isDeleted) {
      throw new NotFoundException(
        `User with id ${id} was not found for deletion or was not able to be deleted, users' controller`,
      );
    }
  }

  @Get()
  async getAll(@Query() query: UserQueryDto) {
    const users = await this.usersQueryRepository.getAllUsers(query);

    return users;
  }
}
