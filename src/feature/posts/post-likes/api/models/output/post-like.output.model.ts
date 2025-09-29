import { PostLikeStatus } from '../input/post-like.input.model';

export class LikeDetailsViewModel {
  addedAt: string;
  userId: string;
  login: string;
}

export class ExtendedLikesInfoViewModel {
  likesCount: number; //total likes for parent item
  dislikesCount: number; //total dislikes for parent item
  myStatus: PostLikeStatus;
  newestLikes: LikeDetailsViewModel[]; //last 3 'Like' reactions
}
