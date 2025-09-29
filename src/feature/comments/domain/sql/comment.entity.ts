export interface CommentEntity {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  likesCount: number;
  dislikesCount: number;
}
