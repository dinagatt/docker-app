import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { SessionDTO } from '../application/DTOs/sessionDTO';
import { Session } from '../domain/TypeORM/session.entity';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectRepository(Session) private sessionsORMrepo: Repository<Session>,
  ) {}

  async deleteAllSessionsExceptCurrent(
    userId: string,
    currentDeviceId: string,
  ) {
    try {
      const result = await this.sessionsORMrepo.delete({
        userId: userId,
        deviceId: Not(currentDeviceId),
      });

      if (result.affected && result.affected > 0) {
        return true;
        //console.log('Sessions deleted successfully');
      } else {
        console.log(
          `No sessions found with the given user ID ${userId} for deletion, sessions' repo`,
        );
        return false;
      }
    } catch (error) {
      console.error(
        `Error during deletion of unused sessions, sessions' repo`,
        error,
      );
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
     DELETE FROM public."Sessions"
     WHERE "userId" = $1
     AND "deviceId" != $2;
     `,
      [userId, currentDeviceId],
    );

    return result[1] > 0;*/
  }

  async deleteSessionByDeviceId(deviceId: string): Promise<boolean> {
    try {
      const result = await this.sessionsORMrepo.delete({
        deviceId: deviceId,
      });
      if (result.affected === 1) {
        return true;
        //console.log('Session deleted successfully.');
      } else {
        console.log(
          `No session found with the given  device ID ${deviceId} for soft deletion, sessions' repo`,
        );
        return false;
      }
    } catch (error) {
      console.error(`Error during soft delete, sessions' repo`, error);
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
     DELETE FROM public."Sessions"
     WHERE "deviceId" = $1;
     `,
      [deviceId],
    );

    return result[1] === 1;*/
  }

  async findSessionByDeviceId(deviceId: string): Promise<Session | null> {
    const result: Session | null = await this.sessionsORMrepo.findOneBy({
      deviceId: deviceId,
    });

    return result ? (result as Session) : null;

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    SELECT * 
    FROM public."Sessions" 
    WHERE "deviceId" = $1
    `,
      [deviceId],
    );

    return result.length ? (result[0] as SessionEntity) : null;*/
  }

  async createSession(DTO: SessionDTO) {
    const newSession = this.sessionsORMrepo.create(DTO);

    try {
      const result = await this.sessionsORMrepo.save(newSession);
      return result.id;
    } catch (error) {
      console.log(
        `Error saving Session for Session creation, sessions' repo`,
        error,
      );
      return null;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    INSERT INTO public."Sessions" (
      "userId", "deviceId", "deviceName", ip, iat, exp
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id 
    `,
      [DTO.userId, DTO.deviceId, DTO.deviceName, DTO.ip, DTO.iat, DTO.exp],
    );

    return result.length ? result[0].id : null;*/
  }

  async updateIatExp(
    userId: string,
    deviceId: string,
    iat: number,
    exp: number,
  ): Promise<boolean> {
    const session = await this.sessionsORMrepo.findOneBy({
      userId: userId,
      deviceId: deviceId,
    });
    if (!session) return false;

    try {
      session.iat = new Date(iat * 1000);
      session.exp = new Date(exp * 1000);
      await this.sessionsORMrepo.save(session);
      return true;
    } catch (error) {
      console.error(
        `Error saving Session for iat and exp update, sessions' repo:`,
        error,
      );
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    UPDATE public."Sessions"
    SET "iat" = $1, "exp" = $2
    WHERE "userId" = $3 AND "deviceId" = $4;
    `,
      [new Date(iat * 1000), new Date(exp * 1000), userId, deviceId],
    );
    //console.log(result); // => [[], 1] COMMENT OUT

    return result[1] === 1;*/
  }
}
