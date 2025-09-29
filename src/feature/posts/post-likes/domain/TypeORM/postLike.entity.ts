import { PostLikeStatus } from '../../api/models/input/post-like.input.model';
import { BaseDBEntity } from '../../../../../common/db/base-db.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../../../users/domain/TypeORM/user.entity';
import { Post } from '../../../domain/TypeORM/post.entity';

@Entity()
export class PostLike extends BaseDBEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  postId: string;

  @Column({ type: 'enum', enum: PostLikeStatus })
  status: PostLikeStatus;

  @ManyToOne(() => User, (user: User) => user.postLikes)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Post, (post: Post) => post.postLikes)
  @JoinColumn({ name: 'postId' })
  post: Post;
}
