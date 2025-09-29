import { CommentLikeStatus } from '../../api/models/input/comment-like.input.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseDBEntity } from '../../../../../common/db/base-db.entity';
import { User } from '../../../../users/domain/TypeORM/user.entity';
import { Comment } from '../../../domain/TypeORM/comment.entity';

@Entity()
export class CommentLike extends BaseDBEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  commentId: string;

  @Column({ type: 'enum', enum: CommentLikeStatus })
  status: CommentLikeStatus;

  @ManyToOne(() => User, (user: User) => user.commentLikes)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Comment, (comment: Comment) => comment.commentLikes)
  @JoinColumn({ name: 'commentId' })
  comment: Comment;
}
