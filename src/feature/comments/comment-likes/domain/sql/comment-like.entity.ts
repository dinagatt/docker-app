import { CommentLikeStatus } from '../../api/models/input/comment-like.input.model';

export interface CommentLikeEntity {
  id: string;
  userId: string;
  commentId: string;
  status: CommentLikeStatus;
}
