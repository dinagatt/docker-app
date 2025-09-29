import { Injectable } from '@nestjs/common';
import { CommentLikeStatus } from '../api/models/input/comment-like.input.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentLikeDTO } from '../application/DTOs/commentLikeDTO';
import { CommentLike } from '../domain/TypeORM/commentLike.entity';

Injectable();
export class CommentLikesRepository {
  constructor(
    @InjectRepository(CommentLike)
    private commentLikesORMrepo: Repository<CommentLike>,
  ) {}

  async findLikeByUserIdAndCommentId(
    userId: string,
    commentId: string,
  ): Promise<CommentLike | null> {
    const result = await this.commentLikesORMrepo.findOneBy({
      userId: userId,
      commentId: commentId,
    });

    return result ? (result as CommentLike) : null;

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    SELECT * 
    FROM public."Comment Likes" 
    WHERE "commentId" = $1 AND "userId" = $2 
    `,
      [commentId, userId],
    );
    //console.log(result); // COMMENT OUT
    return result.length ? (result[0] as CommentLikeEntity) : null;*/
  }

  async createLikeOrDislike(DTO: CommentLikeDTO): Promise<string | null> {
    const newCommentLike = this.commentLikesORMrepo.create(DTO);

    try {
      const result = await this.commentLikesORMrepo.save(newCommentLike);
      return result.id;
    } catch (error) {
      console.log(
        `Error saving CommentLike for CommentLike creation, commentLikes' repo`,
        error,
      );
      return null;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    INSERT INTO public."Comment Likes"(
      "userId", "commentId", "status"
      )
      VALUES ($1, $2, $3)
      RETURNING "id" 
      `,
      [commentLikeDTO.userId, commentLikeDTO.commentId, commentLikeDTO.status],
    );

    return result.length ? result[0].id : null;*/
  }

  async updateLikeOrDislike(
    likeId: string,
    likeStatus: CommentLikeStatus,
  ): Promise<boolean> {
    const commentStatus = await this.commentLikesORMrepo.findOneBy({
      id: likeId,
    });
    if (!commentStatus) return false;

    try {
      commentStatus.status = likeStatus;
      await this.commentLikesORMrepo.save(commentStatus);
      return true;
    } catch (error) {
      console.error(
        `Error saving CommentLike for likeStatus update, commentLikes' repo:`,
        error,
      );
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
     UPDATE public."Comment Likes"
     SET "status" = $1 
     WHERE id = $2
     RETURNING *;
     `,
      [likeStatus, likeId],
    );
    //console.log(result); //COMMENT OUT
    return result[1] === 1;*/
  }
}
