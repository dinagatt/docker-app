import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { CryptoService } from '../../../common/utils/adapters/crypto.service';
import { UserDTO } from './DTOs/userDTO';
import { User } from '../domain/TypeORM/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cryptoService: CryptoService,
  ) {}

  async createUser(
    login: string,
    password: string,
    email: string,
  ): Promise<string | null> {
    const generatedPasswordHash =
      await this.cryptoService._generateHash(password);

    const newUser: UserDTO = {
      login: login,
      passwordHash: generatedPasswordHash,
      email: email,
      isConfirmed: true,
      createdAt: new Date(),
    };

    return await this.usersRepository.createUser(newUser);
  }

  async delete(id: string): Promise<boolean> {
    const existingUser: User | null = await this.usersRepository.findById(id);

    if (existingUser === null) return false; //don't need this line, if 'findEntityByIdOrNotFoundError(id)' repo method was used above

    return await this.usersRepository.deleteUser(id);
  }
}
