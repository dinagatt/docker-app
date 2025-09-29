import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseDBEntity } from '../../../../common/db/base-db.entity';
import { User } from './user.entity';

@Entity()
export class UserEmailConfirmationInfo extends BaseDBEntity {
  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  confirmationCode: string;

  @Column({ type: 'timestamp with time zone' })
  expirationDate: Date;

  @OneToOne(() => User, (user) => user.userEmailConfirmationInfo)
  @JoinColumn()
  public user: User;
}
