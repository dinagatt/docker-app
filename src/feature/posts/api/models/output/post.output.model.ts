import { PostDocument } from '../../../domain/mongo/post.entity';
import { ExtendedLikesInfoViewModel } from '../../../post-likes/api/models/output/post-like.output.model';

export class PostViewModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfoViewModel;
}

//MAPPERS
export const PostOutputModelMapper = (post: PostDocument): PostViewModel => {
  const outputModel = new PostViewModel();

  outputModel.id = post.id;
  outputModel.title = post.title;
  outputModel.shortDescription = post.shortDescription;
  outputModel.content = post.content;
  outputModel.blogId = post.blogId;
  outputModel.blogName = post.blogName;
  outputModel.createdAt = post.createdAt;

  return outputModel;
};
