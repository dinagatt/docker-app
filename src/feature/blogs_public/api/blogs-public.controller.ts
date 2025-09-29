import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from '../../blogs/application/blogs.service';
import { BlogsQueryRepository } from '../../blogs/infrastructure/blogs.query.repository';
import { BlogViewModel } from '../../blogs/api/models/output/blog.output.model';
import { BlogQueryDTO } from '../../../common/utils/pagination/blogQueryDTO';
import { AttachUserIdGuard } from '../../../common/guards/access-token-userId-guard';
import { PostQueryDto } from '../../../common/utils/pagination/postQueryDTO';
import { Request } from 'express';

@Controller('blogs')
export class BlogsPublicController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}

  @Get(':id')
  async getBlogById(@Param('id') id: string): Promise<BlogViewModel> {
    const blog: BlogViewModel | null =
      await this.blogsQueryRepository.getBlogById(id);

    if (!blog) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }

    return blog;
  }

  @Get()
  async getAllBlogs(@Query() query: BlogQueryDTO) {
    const blogs = await this.blogsQueryRepository.getAllBlogs(query);

    return blogs;
  }

  @Get(':id/posts')
  @UseGuards(AttachUserIdGuard)
  async getPostsByBlogId(
    @Query() query: PostQueryDto,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const blog: boolean = await this.blogsService.doesBlogExist(id);

    if (!blog) {
      throw new NotFoundException(`Blog for posts with id ${id} not found`);
    } else {
      const posts = await this.blogsQueryRepository.getAllPostsByBlogId(
        query,
        id,
        req.userId,
      );

      if (!posts) {
        throw new NotFoundException(
          `Posts w/ pagination by blogId ${id} were not found`,
        );
      } else {
        return posts;
      }
    }
  }
}
