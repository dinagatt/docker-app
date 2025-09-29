import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../users/infrastructure/users.repository';
import { CommentsRepository } from '../infrastucture/comments.repository';
import { CommentLikeStatus } from '../comment-likes/api/models/input/comment-like.input.model';
import { CommentLikesRepository } from '../comment-likes/infrastructure/comment-likes.repository';
import { CommentDTO } from './DTOs/commentDTO';
import { CommentLikeDTO } from '../comment-likes/application/DTOs/commentLikeDTO';
import { User } from '../../users/domain/TypeORM/user.entity';
import { Comment } from '../domain/TypeORM/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly commentLikesRepository: CommentLikesRepository,
  ) {}

  async createCommentByPostId(
    content: string,
    postId: string,
    userId: string,
  ): Promise<string | null> {
    const user: User | null = await this.usersRepository.findById(userId);
    if (!user) return null;

    const newComment: CommentDTO = {
      postId: postId,
      userId: user.id,
      content: content,
      createdAt: new Date(),
      likesCount: 0,
      dislikesCount: 0,
    };

    return this.commentsRepository.createCommentByPostId(newComment);
  }

  async doesCommentExist(commentId: string): Promise<string | null> {
    const comment: Comment | null =
      await this.commentsRepository.findCommentById(commentId);
    if (!comment) return null;

    return comment.userId;
  }

  async doesCommentBelongToUser(
    userId: string,
    userIdFromFoundComment: string,
  ): Promise<boolean> {
    if (userIdFromFoundComment === userId) {
      return true;
    } else {
      return false;
    }

    //return userIdFromFoundComment === userId; IS IT THE SAME?
  }

  async updateComment(
    commentId: string,
    content: string,
    userId: string,
  ): Promise<boolean> {
    return await this.commentsRepository.updateCommentByCommentId(
      content,
      commentId,
      userId,
    );
  }

  async deleteCommentById(commentId: string): Promise<boolean> {
    return await this.commentsRepository.deleteCommentById(commentId);
  }

  async updateLikeStatus(
    commentId: string,
    likeStatus: CommentLikeStatus,
    userId: string,
  ): Promise<boolean> {
    try {
      const comment = await this.commentsRepository.findCommentById(commentId);
      if (!comment) return false;

      //console.log(userId); // COMMENT OUT
      const existingLike =
        await this.commentLikesRepository.findLikeByUserIdAndCommentId(
          userId,
          commentId,
        );

      if (
        (!existingLike && likeStatus === CommentLikeStatus.None) ||
        (existingLike && existingLike.status === likeStatus)
      ) {
        return true;
      }

      await this.updateLikeDislikeCount(commentId, likeStatus, userId);

      if (existingLike) {
        await this.commentLikesRepository.updateLikeOrDislike(
          existingLike.id,
          likeStatus,
        );
      } else {
        const newCommentLike: CommentLikeDTO = {
          commentId: commentId,
          userId: userId,
          status: likeStatus,
        };
        await this.commentLikesRepository.createLikeOrDislike(newCommentLike);
      }

      return true;
    } catch (error) {
      console.error(
        `Error updating like status of a comment with id ${commentId}, service`,
        error,
      );
      return false;
    }
  }

  async updateLikeDislikeCount(
    commentId: string,
    likeStatus: CommentLikeStatus,
    userId: string,
  ): Promise<boolean> {
    //console.log(`Creating new like with status: ${likeStatus}`);

    const like = await this.commentLikesRepository.findLikeByUserIdAndCommentId(
      userId,
      commentId,
    );

    let likeIncrement = 0;
    let dislikeIncrement = 0;

    if (likeStatus === CommentLikeStatus.Like) {
      likeIncrement = 1;
      dislikeIncrement = like?.status === CommentLikeStatus.Dislike ? -1 : 0;
    } else if (likeStatus === CommentLikeStatus.Dislike) {
      dislikeIncrement = 1;
      likeIncrement = like?.status === CommentLikeStatus.Like ? -1 : 0;
    } else if (likeStatus === CommentLikeStatus.None && like) {
      if (like.status === CommentLikeStatus.Like) {
        likeIncrement = -1;
      } else if (like.status === CommentLikeStatus.Dislike) {
        dislikeIncrement = -1;
      }
    }

    try {
      return await this.commentsRepository.updateLikeDislikeCount(
        commentId,
        likeIncrement,
        dislikeIncrement,
      );
    } catch (error) {
      console.error(
        error,
        `Could not update like/dislike count of a comment with id ${commentId}, service`,
      );
      return false;
    }
  }
}
