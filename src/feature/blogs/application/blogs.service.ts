import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { BlogInputModel } from '../api/models/input/create-blog.input.model';
import { BlogDTO } from './DTOs/blogDTO';
import { Blog } from '../domain/TypeORM/blog.entity';

@Injectable()
export class BlogsService {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async doesBlogExist(id: string): Promise<boolean> {
    const blog: Blog | null = await this.blogsRepository.findBlogById(id);
    if (!blog) return false;

    return true;
  }

  async createBlog(createModel: BlogInputModel): Promise<string | null> {
    const newBlog: BlogDTO = {
      name: createModel.name,
      description: createModel.description,
      websiteUrl: createModel.websiteUrl,
      createdAt: new Date(),
      isMembership: false,
    };

    return await this.blogsRepository.createBlog(newBlog);
  }

  async updateBlog(id: string, updateModel: BlogInputModel): Promise<boolean> {
    const existingBlog: Blog | null =
      await this.blogsRepository.findBlogById(id);
    if (existingBlog === null) return false;

    return await this.blogsRepository.updateBlog(id, updateModel);
  }

  async deleteBlog(id: string): Promise<boolean> {
    const existingBlog: Blog | null =
      await this.blogsRepository.findBlogById(id);
    if (existingBlog === null) return false;

    return await this.blogsRepository.deleteBlog(id);
  }
}
