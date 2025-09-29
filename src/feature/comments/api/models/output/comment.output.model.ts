import { LikesInfoViewModel } from '../../../comment-likes/api/models/output/comment-like.output.model';

export class CommentViewModel {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  likesInfo: LikesInfoViewModel;
}

export class CommentatorInfo {
  userId: string;
  userLogin: string;
}
