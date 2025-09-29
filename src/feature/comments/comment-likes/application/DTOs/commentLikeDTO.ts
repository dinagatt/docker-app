import { CommentLikeStatus } from '../../api/models/input/comment-like.input.model';

export class CommentLikeDTO {
  userId: string;
  commentId: string;
  status: CommentLikeStatus;
}
