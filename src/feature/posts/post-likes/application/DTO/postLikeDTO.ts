import { PostLikeStatus } from '../../api/models/input/post-like.input.model';

export class PostLikeDTO {
  postId: string;
  userId: string;
  status: PostLikeStatus;
}
