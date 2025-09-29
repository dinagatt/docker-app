export interface PostEntity {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  likesCount: number;
  dislikesCount: number;
}
