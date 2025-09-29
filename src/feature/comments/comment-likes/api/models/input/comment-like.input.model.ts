import { IsEnum } from 'class-validator';

export enum CommentLikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export class CommentLikeInputModel {
  @IsEnum(CommentLikeStatus)
  likeStatus: CommentLikeStatus;
}
