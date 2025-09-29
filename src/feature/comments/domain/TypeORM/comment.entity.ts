import { BaseDBEntity } from '../../../../common/db/base-db.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Post } from '../../../posts/domain/TypeORM/post.entity';
import { User } from '../../../users/domain/TypeORM/user.entity';
import { CommentLike } from '../../comment-likes/domain/TypeORM/commentLike.entity';

@Entity()
export class Comment extends BaseDBEntity {
  @Column({ type: 'uuid' })
  postId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int' })
  likesCount: number;

  @Column({ type: 'int' })
  dislikesCount: number;

  @ManyToOne(() => Post, (post: Post) => post.comments)
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ManyToOne(() => User, (user: User) => user.comments)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(
    () => CommentLike,
    (commentLike: CommentLike) => commentLike.comment,
  )
  commentLikes: CommentLike[];
}
