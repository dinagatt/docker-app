import { BlogDocument } from '../../../domain/mongo/blog.entity';

export class BlogViewModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

//MAPPERS
export const BlogOutputModelMapper = (blog: BlogDocument): BlogViewModel => {
  const outputModel = new BlogViewModel();

  outputModel.id = blog.id;
  outputModel.name = blog.name;
  outputModel.description = blog.description;
  outputModel.websiteUrl = blog.websiteUrl;
  outputModel.createdAt = blog.createdAt;
  outputModel.isMembership = blog.isMembership;

  return outputModel;
};
