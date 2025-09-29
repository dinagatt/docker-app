import { Column, Entity } from 'typeorm';
import { BaseDBEntity } from '../../../../common/db/base-db.entity';

@Entity()
export class Test_User extends BaseDBEntity {
  @Column({ type: 'varchar' })
  login: string;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'boolean' })
  isConfirmed: boolean;
}
