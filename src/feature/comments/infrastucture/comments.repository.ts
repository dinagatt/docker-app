import { Injectable } from '@nestjs/common';
import { CommentDTO } from '../application/DTOs/commentDTO';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../domain/TypeORM/comment.entity';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(Comment) private commentsORMrepo: Repository<Comment>,
  ) {}

  async createCommentByPostId(DTO: CommentDTO): Promise<string | null> {
    const newComment = this.commentsORMrepo.create(DTO);

    try {
      const result = await this.commentsORMrepo.save(newComment);
      return result.id;
    } catch (error) {
      console.log(
        `Error saving Comment for Comment creation, comments' repo`,
        error,
      );
      return null;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    INSERT INTO public."Comments"(
      "postId", "userId", "content", "createdAt", "likesCount", "dislikesCount"
      )
      VALUES ($1, $2, $3, $4 , $5, $6)
      RETURNING "id"
      `,
      [
        commentDTO.postId,
        commentDTO.userId,
        commentDTO.content,
        commentDTO.createdAt,
        commentDTO.likesCount,
        commentDTO.dislikesCount,
      ],
    );

    return result.length ? result[0].id : null;*/
  }

  async findCommentById(id: string): Promise<Comment | null> {
    const result: Comment | null = await this.commentsORMrepo.findOneBy({
      id: id,
    });

    return result ? (result as Comment) : null;

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    SELECT *
    FROM public."Comments"
    WHERE id = $1
    `,
      [id],
    );

    return result.length ? (result[0] as CommentEntity) : null;*/
  }

  async updateCommentByCommentId(
    content: string,
    commentId: string,
    userId: string,
  ): Promise<boolean> {
    const comment = await this.findCommentById(commentId);
    if (!comment) return false;

    try {
      comment.content = content;
      await this.commentsORMrepo.save(comment);
      return true;
    } catch (error) {
      console.error(
        `Error saving Comment for content update, comments' repo:`,
        error,
      );
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
     UPDATE public."Comments"
     SET "content" = $1 
     WHERE id = $2 AND "userId" = $3
     RETURNING *;
     `,
      [content, commentId, userId],
    );
    //console.log(result); //COMMENT OUT
    return result[1] === 1;*/
  }

  async deleteCommentById(id: string): Promise<boolean> {
    try {
      const result = await this.commentsORMrepo.delete({ id: id });
      if (result.affected === 1) {
        return true;
        //console.log('Comment deleted successfully.');
      } else {
        console.log(
          `No comment found with the given ID ${id} for deletion, comments' repo`,
        );
        return false;
      }
    } catch (error) {
      console.error(`Error during deletion, comments' repo`, error);
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
     DELETE FROM public."Comments"
     WHERE "id" = $1 
     RETURNING *
     `,
      [id],
    );

    return result.length > 0;*/
  }

  async updateLikeDislikeCount(
    commentId: string,
    likeIncrement: number,
    dislikeIncrement: number,
  ): Promise<boolean> {
    const comment = await this.findCommentById(commentId);
    if (!comment) return false;

    try {
      comment.likesCount = comment.likesCount + likeIncrement;
      comment.dislikesCount = comment.dislikesCount + dislikeIncrement;
      await this.commentsORMrepo.save(comment);
      return true;
    } catch (error) {
      console.error(
        `Error saving Comment for like/dislike count update, comments' repo:`,
        error,
      );
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
     UPDATE public."Comments"
     SET 
       "likesCount" = "likesCount" + $1,
       "dislikesCount" = "dislikesCount" + $2
     WHERE id = $3
     RETURNING *;
     `,
      [likeIncrement, dislikeIncrement, commentId],
    );
    //console.log(result); //COMMENT OUT
    return result[1] === 1;*/
  }
}
