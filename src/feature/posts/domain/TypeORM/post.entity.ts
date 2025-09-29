import { BaseDBEntity } from '../../../../common/db/base-db.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Blog } from '../../../blogs/domain/TypeORM/blog.entity';
import { Comment } from '../../../comments/domain/TypeORM/comment.entity';
import { PostLike } from '../../post-likes/domain/TypeORM/postLike.entity';

@Entity()
export class Post extends BaseDBEntity {
  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar' })
  shortDescription: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int' })
  likesCount: number;

  @Column({ type: 'int' })
  dislikesCount: number;

  @Column({ type: 'uuid' })
  blogId: string;

  @ManyToOne(() => Blog, (blog: Blog) => blog.posts, { nullable: false })
  @JoinColumn({ name: 'blogId' })
  blog: Blog;

  @OneToMany(() => PostLike, (postLike: PostLike) => postLike.user)
  postLikes: PostLike[];

  @OneToMany(() => Comment, (comment: Comment) => comment.post)
  comments: Comment[];
}
