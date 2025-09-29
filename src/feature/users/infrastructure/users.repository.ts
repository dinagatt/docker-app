import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserDTO } from '../application/DTOs/userDTO';
import { UserEmailConfirmationInfoDTO } from '../application/DTOs/userEmailConfirmationInfoDTO';
import { User } from '../domain/TypeORM/user.entity';
import { UserEmailConfirmationInfo } from '../domain/TypeORM/userEmailConfirmationInfo.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(User) public usersORMrepo: Repository<User>,
    @InjectRepository(UserEmailConfirmationInfo)
    private userEmailConfirmationInfoORMrepo: Repository<UserEmailConfirmationInfo>,
  ) {}

  //WE USE THIS TO ELIMINATE IF/ELSE IN SERVICE WHILE FINDING ENTITY BY ID WHEN WE NEED TO DELETE/UPDATE THE ENTITY:
  //async findEntityByIdOrNotFoundError(id: string) {
  // const result = await this.findById(id);
  // if (!result) {
  // throw new NotFoundException('Entity was not found')
  // }
  // return result;
  // }

  async createUser(DTO: UserDTO): Promise<string | null> {
    const newUser = this.usersORMrepo.create(DTO);

    try {
      const result = await this.usersORMrepo.save(newUser);
      return result.id;
    } catch (error) {
      console.log(`Error saving User for User creation, users' repo`, error);
      return null;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    INSERT INTO public."Users"(
      login, "passwordHash", email, "createdAt", "isConfirmed"
      )
      VALUES ($1, $2, $3, $4 , $5)
      RETURNING "id" 
      `,
      [
        newUserDTO.login,
        newUserDTO.passwordHash,
        newUserDTO.email,
        newUserDTO.createdAt,
        newUserDTO.isConfirmed,
      ],
    );

    return result.length ? result[0].id : null;*/
  }

  async createUserEmailConfirmationInfo(
    DTO: UserEmailConfirmationInfoDTO,
  ): Promise<string | null> {
    const newUserEmailConfirmationInfo =
      this.userEmailConfirmationInfoORMrepo.create(DTO);

    try {
      const result = await this.userEmailConfirmationInfoORMrepo.save(
        newUserEmailConfirmationInfo,
      );
      return result.confirmationCode;
    } catch (error) {
      console.log(
        `Error saving UserEmailConfirmationInfo for UserEmailConfirmationInfo creation, users' repo`,
        error,
      );
      return null;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    INSERT INTO public."User Email Confirmation Info"(
      "userId", "confirmationCode", "expirationDate"
      )
      VALUES ($1, $2, $3)
      RETURNING "confirmationCode";
      `,
      [DTO.userId, DTO.confirmationCode, DTO.expirationDate],
    );

    return result.length ? result[0].confirmationCode : null;*/
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await this.usersORMrepo.delete({ id: id });
      if (result.affected === 1) {
        return true;
        //console.log('User deleted successfully.');
      } else {
        console.log(
          `No user found with the given ID ${id} for deletion, users' repo`,
        );
        return false;
      }
    } catch (error) {
      console.error(`Error during User deletion, users' repo`, error);
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
     DELETE FROM public."Users"
     WHERE "id" = $1
     RETURNING *
     `,
      [id],
    );

    return result.length > 0;*/
  }

  async findById(id: string): Promise<User | null> {
    const result: User | null = await this.usersORMrepo.findOneBy({ id: id });

    return result ? (result as User) : null;

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    SELECT * 
    FROM public."Users" 
    WHERE id = $1
    `,
      [id],
    );

    return result.length ? (result[0] as UserEntity) : null;*/
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const result: User | null = await this.usersORMrepo.findOneBy({
      email: email,
    });

    return result ? (result as User) : null;

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    SELECT * 
    FROM public."Users" 
    WHERE email = $1
    `,
      [email],
    );

    return result.length ? (result[0] as UserEntity) : null;*/
  }

  async findUserByLogin(login: string): Promise<User | null> {
    const result: User | null = await this.usersORMrepo.findOneBy({
      login: login,
    });

    return result ? (result as User) : null;

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    SELECT * 
    FROM public."Users" 
    WHERE login = $1
    `,
      [login],
    );

    return result.length ? (result[0] as UserEntity) : null;*/
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    const result = await this.usersORMrepo.findOne({
      where: [{ login: loginOrEmail }, { email: loginOrEmail }],
    });
    //console.log(`LOG: ${JSON.stringify(result)}`);
    return result ? (result as User) : null;

    /* RAW SQL
    const result = await this.dataSource.query(
      `
     SELECT * 
     FROM public."Users"
     WHERE "login" = $1 OR "email" = $1
     LIMIT 1;
     `,
      [loginOrEmail],
    );

    return result.length ? (result[0] as UserEntity) : null;*/
  }

  async findUserEmailConfirmationInfoByConfirmationCode(
    code: string,
  ): Promise<UserEmailConfirmationInfo | null> {
    const result: UserEmailConfirmationInfo | null =
      await this.userEmailConfirmationInfoORMrepo.findOneBy({
        confirmationCode: code,
      });

    return result ? (result as UserEmailConfirmationInfo) : null;

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    SELECT * 
    FROM public."User Email Confirmation Info" 
    WHERE "confirmationCode" = $1
    `,
      [code],
    );

    return result.length
      ? (result[0] as UserEmailConfirmationInfoEntity)
      : null;*/
  }

  async confirmUser(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) return false;

    try {
      user.isConfirmed = true;
      await this.usersORMrepo.save(user);
      return true;
    } catch (error) {
      console.error(
        `Error saving User for isConfirmed update, users' repo:`,
        error,
      );
      return false;
    }
    /* RAW SQL
    const result = await this.dataSource.query(
      `
     UPDATE public."Users"
     SET "isConfirmed" = true
     WHERE id = $1;
     `,
      [userId],
    );

    return result.rowCount === 1;*/
  }

  async updateConfirmationCode(userId: string, code: string, expDate: Date) {
    const userEmailConfirmationInfo =
      await this.userEmailConfirmationInfoORMrepo.findOneBy({ userId: userId });

    if (!userEmailConfirmationInfo) return false;

    try {
      userEmailConfirmationInfo.confirmationCode = code;
      userEmailConfirmationInfo.expirationDate = expDate;
      await this.userEmailConfirmationInfoORMrepo.save(
        userEmailConfirmationInfo,
      );

      return true;
    } catch (error) {
      console.error(
        `Error saving UserEmailConfirmationInfo for confirmationCode and expirationDate update, users' repo:`,
        error,
      );
      return false;
    }

    /* RAW SQl
    const result = await this.dataSource.query(
      `
     UPDATE public."User Email Confirmation Info"
     SET "confirmationCode" = $1 , "expirationDate" = $2 
     WHERE "userId" = $3
     RETURNING *;
     `,
      [code, expDate, userId],
    );

    return result[1] === 1;*/
  }

  async updatePassword(userId: string, passwordHash: string) {
    const user = await this.findById(userId);
    if (!user) return false;

    try {
      user.passwordHash = passwordHash;
      await this.usersORMrepo.save(user);
      return true;
    } catch (error) {
      console.error(
        `Error saving User for passwordHash update, users' repo:`,
        error,
      );
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
     UPDATE public."Users"
     SET "passwordHash" = $1
     WHERE id = $2;
     `,
      [passwordHash, userId],
    );

    return result.rowCount === 1;*/
  }
}
