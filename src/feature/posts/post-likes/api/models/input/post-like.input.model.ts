import { IsEnum } from 'class-validator';

export enum PostLikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export class PostLikeInputModel {
  @IsEnum(PostLikeStatus)
  likeStatus: PostLikeStatus;
}
