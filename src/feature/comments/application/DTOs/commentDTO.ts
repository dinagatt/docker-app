export class CommentDTO {
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  likesCount: number;
  dislikesCount: number;
}
