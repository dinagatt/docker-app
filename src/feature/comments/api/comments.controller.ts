import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentViewModel } from './models/output/comment.output.model';
import { CommentsQueryRepository } from '../infrastucture/comments.query.repository';
import { Request } from 'express';
import { CommentsService } from '../application/comments.service';
import { CommentInputModel } from './models/input/create-comment.input.model';
import { AccessTokenAuthGuard } from '../../../common/guards/jwt-access-token-auth-guard';
import { CommentLikeInputModel } from '../comment-likes/api/models/input/comment-like.input.model';
import { AttachUserIdGuard } from '../../../common/guards/access-token-userId-guard';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get(':id')
  @UseGuards(AttachUserIdGuard)
  async getCommentById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<CommentViewModel> {
    const comment: CommentViewModel | null =
      await this.commentsQueryRepository.getCommentById(id, req.userId);

    if (!comment) {
      throw new NotFoundException(
        `Comment with id ${id} was not found for output`,
      );
    }

    return comment;
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenAuthGuard)
  async updateComment(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() inputModel: CommentInputModel,
  ) {
    const userId = req.userId;
    const { content } = inputModel;

    const userIdFromExistingComment =
      await this.commentsService.doesCommentExist(id);

    if (!userIdFromExistingComment) {
      throw new NotFoundException(
        ` Comment with id ${id} was not found for update`,
      );
    }

    const doesBelongToUser = await this.commentsService.doesCommentBelongToUser(
      userId!,
      userIdFromExistingComment,
    );

    if (!doesBelongToUser) {
      throw new ForbiddenException(
        `Comment with id ${id} does not belong to user with id ${userId}, unable to update`,
      );
    }

    const isUpdated = await this.commentsService.updateComment(
      id,
      content,
      userIdFromExistingComment,
    );

    if (!isUpdated) {
      throw new Error(`Comment with id ${id} was not updated`);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenAuthGuard)
  async deleteComment(@Param('id') id: string, @Req() req: Request) {
    const userIdFromExistingComment: string | null =
      await this.commentsService.doesCommentExist(id);

    if (!userIdFromExistingComment) {
      throw new NotFoundException(
        `Comment with id ${id} was not found for deletion`,
      );
    }

    const doesCommentBelongToUser =
      await this.commentsService.doesCommentBelongToUser(
        req.userId!,
        userIdFromExistingComment,
      );

    if (!doesCommentBelongToUser) {
      throw new ForbiddenException(
        ` Comment with id ${id} does not belong to user with id ${req.userId}, unable to delete `,
      );
    }

    const isDeleted = await this.commentsService.deleteCommentById(id);

    if (!isDeleted) {
      throw new Error(`Comment with id ${id} was not deleted`);
    }
  }

  @Put(':id/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenAuthGuard)
  async updateLikeStatus(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() inputModel: CommentLikeInputModel,
  ) {
    const userId = req.userId;
    const { likeStatus } = inputModel;
    //console.log('USER ID FROM REQUEST: ', req.userId)

    const isLikeStatusUpdated = await this.commentsService.updateLikeStatus(
      id,
      likeStatus,
      userId!,
    );

    if (!isLikeStatusUpdated) {
      throw new NotFoundException(
        `Comment with id ${id} does not exist, unable to change like status`,
      );
    }
  }
}
