import { Column, Entity, OneToMany } from 'typeorm';
import { BaseDBEntity } from '../../../../common/db/base-db.entity';
import { Post } from '../../../posts/domain/TypeORM/post.entity';

@Entity()
export class Blog extends BaseDBEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'varchar' })
  websiteUrl: string;

  @Column({ type: 'boolean' })
  isMembership: boolean;

  @OneToMany(() => Post, (post: Post) => post.blog)
  posts: Post[];
}
