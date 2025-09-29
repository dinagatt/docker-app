import { PostLikeStatus } from '../../api/models/input/post-like.input.model';

export interface PostLikeEntity {
  id: string;
  userId: string;
  postId: string;
  status: PostLikeStatus;
  addedAt: Date;
}
