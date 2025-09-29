import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BlogViewModel } from './models/output/blog.output.model';
import { BlogInputModel } from './models/input/create-blog.input.model';
import { BlogsService } from '../application/blogs.service';
import { BlogsQueryRepository } from '../infrastructure/blogs.query.repository';
import { BlogPostInputModel } from './models/input/create-post-by-blogId.input.model';
import { PostsQueryRepository } from '../../posts/infrastructure/posts.query.repository';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard';
import { PostsService } from '../../posts/application/posts.service';
import { Request } from 'express';
import { AttachUserIdGuard } from '../../../common/guards/access-token-userId-guard';
import { BlogQueryDTO } from '../../../common/utils/pagination/blogQueryDTO';
import { PostQueryDto } from '../../../common/utils/pagination/postQueryDTO';

@Controller('sa/blogs')
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsService: PostsService,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  // BLOGS
  @Post()
  @UseGuards(BasicAuthGuard)
  async createBlog(
    @Body() createModel: BlogInputModel,
  ): Promise<BlogViewModel> {
    const createdBlogId = await this.blogsService.createBlog(createModel);

    if (!createdBlogId) {
      throw new Error(`Blog was not created`);
    } else {
      const createdBlog =
        await this.blogsQueryRepository.getBlogById(createdBlogId);

      if (createdBlog) {
        return createdBlog;
      } else {
        throw new NotFoundException(`Blog was not found and mapped`);
      }
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async updateBlog(
    @Param('id') id: string,
    @Body() updateModel: BlogInputModel,
  ) {
    const isUpdated: boolean = await this.blogsService.updateBlog(
      id,
      updateModel,
    );

    if (!isUpdated) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }
  }

  @Get(':id')
  @UseGuards(BasicAuthGuard)
  async getBlogById(@Param('id') id: string): Promise<BlogViewModel> {
    const blog: BlogViewModel | null =
      await this.blogsQueryRepository.getBlogById(id);

    if (!blog) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }

    return blog;
  }

  @Get()
  @UseGuards(BasicAuthGuard)
  async getAllBlogs(@Query() query: BlogQueryDTO) {
    const blogs = await this.blogsQueryRepository.getAllBlogs(query);

    return blogs;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async deleteBlog(@Param('id') id: string) {
    const isDeleted: boolean = await this.blogsService.deleteBlog(id);

    if (!isDeleted) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }
  }

  // POSTS
  @Post(':id/posts')
  @UseGuards(BasicAuthGuard)
  async createPostByBlogId(
    @Param('id') id: string,
    @Body() createModel: BlogPostInputModel,
  ) {
    const blog: boolean = await this.blogsService.doesBlogExist(id);

    if (!blog) {
      throw new NotFoundException(
        `Blog for post creation with id ${id} was not found`,
      );
    }

    const newPostId: string | null = await this.postsService.createPost(
      id,
      createModel.title,
      createModel.shortDescription,
      createModel.content,
    );

    if (!newPostId) {
      throw new Error(`Post for blog with blogId ${id} was not created`);
    } else {
      const savedPost = await this.postsQueryRepository.getPostById(
        newPostId,
        null,
      );

      if (savedPost) {
        return savedPost;
      } else {
        throw new NotFoundException(
          `Post for blog with blogId ${id} was not found and mapped`,
        );
      }
    }
  }

  @Get(':id/posts')
  @UseGuards(BasicAuthGuard)
  @UseGuards(AttachUserIdGuard)
  async getPostsByBlogId(
    @Query() query: PostQueryDto,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    //console.log(query);

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
          `Posts w/ pagination by blogId with blogId ${id} were not found`,
        );
      } else {
        return posts;
      }
    }
  }

  @Put(':id/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async updatePostByBlogId(
    @Param() params: { id: string; postId: string },
    /* OR THIS BELOW:
    @Param('id') id: string,
    @Param('postId') postId: string,*/
    @Body() updateModel: BlogPostInputModel,
  ) {
    const { id, postId } = params;

    const blog: boolean = await this.blogsService.doesBlogExist(id);

    if (!blog) {
      throw new NotFoundException(
        `Blog with blogId ${id} was not found for post update with postId ${postId}`,
      );
    }

    const isUpdated: boolean = await this.postsService.updatePost(
      postId,
      updateModel.title,
      updateModel.shortDescription,
      updateModel.content,
    );

    if (!isUpdated) {
      throw new NotFoundException(
        `Post with postId ${postId} for blog with blogId ${id} was not updated`,
      );
    }
  }

  @Delete(':id/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async deletePostByBlogId(@Param() params: { id: string; postId: string }) {
    const { id, postId } = params;

    const blog: boolean = await this.blogsService.doesBlogExist(id);

    if (!blog) {
      throw new NotFoundException(
        `Blog with blogId ${id} was not found for post deletion with postId ${postId}`,
      );
    }

    const isDeleted: boolean = await this.postsService.deletePost(postId);

    if (!isDeleted) {
      throw new NotFoundException(
        `Post with id ${postId} was not found for deletion`,
      );
    }
  }
}
