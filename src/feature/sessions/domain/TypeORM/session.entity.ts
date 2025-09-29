import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseDBEntity } from '../../../../common/db/base-db.entity';
import { User } from '../../../users/domain/TypeORM/user.entity';

@Entity()
export class Session extends BaseDBEntity {
  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  deviceId: string;

  @Column({ type: 'varchar' })
  deviceName: string;

  @Column({ type: 'varchar' })
  ip: string;

  @Column({ type: 'timestamp with time zone' })
  iat: Date;

  @Column({ type: 'timestamp with time zone' })
  exp: Date;

  @ManyToOne(() => User, (user: User) => user.sessions)
  user: User;
}
