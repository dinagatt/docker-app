import { Injectable } from '@nestjs/common';
import { DeviceViewModel } from '../api/models/output/session.output.model';
import { SessionEntity } from '../domain/sql/session.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SessionsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  mapToOutput(session: SessionEntity): DeviceViewModel {
    return {
      ip: session.ip,
      title: session.deviceName,
      lastActiveDate: session.iat.toISOString(),
      deviceId: session.deviceId,
    };
  }

  async getAllActiveSessions(
    userId: string,
  ): Promise<DeviceViewModel[] | null> {
    const devices = await this.dataSource.query(
      `
    SELECT * 
    FROM public."session" 
    WHERE "userId" = $1
    `,
      [userId],
    );
    //console.log(devices); // COMMENT OUT

    if (devices) {
      return devices.map(this.mapToOutput);
    } else {
      return null;
    }
  }
}
