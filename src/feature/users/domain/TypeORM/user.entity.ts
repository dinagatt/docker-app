import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseDBEntity } from '../../../../common/db/base-db.entity';
import { UserEmailConfirmationInfo } from './userEmailConfirmationInfo.entity';
import { Session } from '../../../sessions/domain/TypeORM/session.entity';
import { Comment } from '../../../comments/domain/TypeORM/comment.entity';
import { CommentLike } from '../../../comments/comment-likes/domain/TypeORM/commentLike.entity';
import { PostLike } from '../../../posts/post-likes/domain/TypeORM/postLike.entity';
import { Player } from '../../../quiz-game/domain/player.entity';

@Entity()
export class User extends BaseDBEntity {
  @Column({ type: 'varchar' })
  login: string;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'boolean' })
  isConfirmed: boolean;

  @OneToOne(
    () => UserEmailConfirmationInfo,
    (userEmailConfirmationInfo) => userEmailConfirmationInfo.user,
  )
  @JoinColumn()
  public userEmailConfirmationInfo: UserEmailConfirmationInfo;

  @OneToMany(() => Session, (session: Session) => session.user)
  sessions: Session[];

  @OneToMany(() => Comment, (comment: Comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => CommentLike, (commentLike: CommentLike) => commentLike.user)
  commentLikes: CommentLike[];

  @OneToMany(() => PostLike, (postLike: PostLike) => postLike.user)
  postLikes: PostLike[];

  @OneToMany(() => Player, (player: Player) => player.user)
  players: Player[];
}
