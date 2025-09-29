export enum CommentLikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export class LikesInfoViewModel {
  likesCount: number;
  dislikesCount: number;
  myStatus: CommentLikeStatus;
}
