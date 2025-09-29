import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/posts.repository';
import { BlogsRepository } from '../../blogs/infrastructure/blogs.repository';
import { PostLikesRepository } from '../post-likes/infrastructure/post-likes.repository';
import { UsersRepository } from '../../users/infrastructure/users.repository';
import { PostDTO } from './DTOs/postDTO';
import { PostLikeStatus } from '../post-likes/api/models/input/post-like.input.model';
import { PostLikeDTO } from '../post-likes/application/DTO/postLikeDTO';
import { Post } from '../domain/TypeORM/post.entity';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
    private readonly postLikesRepository: PostLikesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async createPost(
    blogId: string,
    title: string,
    shortDescription: string,
    content: string,
  ): Promise<string | null> {
    const blog = await this.blogsRepository.findBlogById(blogId);
    if (!blog) return null;

    const newPost: PostDTO = {
      title: title,
      shortDescription: shortDescription,
      content: content,
      createdAt: new Date(),
      likesCount: 0,
      dislikesCount: 0,
      blogId: blogId,
    };

    return await this.postsRepository.createPost(newPost);
  }

  async updatePost(
    postId: string,
    title: string,
    shortDescription: string,
    content: string,
  ): Promise<boolean> {
    const existingPost: Post | null =
      await this.postsRepository.findPostById(postId);
    if (!existingPost) return false;

    return await this.postsRepository.updatePost(
      existingPost.id,
      title,
      shortDescription,
      content,
    );
  }

  async deletePost(id: string): Promise<boolean> {
    const existingPost: Post | null =
      await this.postsRepository.findPostById(id);
    if (existingPost === null) return false;

    return await this.postsRepository.deletePost(id);
  }

  async doesPostExist(id: string): Promise<Post | null> {
    const existingPost: Post | null =
      await this.postsRepository.findPostById(id);

    if (!existingPost) return null;

    return existingPost;
  }

  async updateLikeStatus(
    userId: string,
    postId: string,
    likeStatus: PostLikeStatus,
  ): Promise<boolean> {
    try {
      const post = await this.postsRepository.findPostById(postId);
      if (!post) return false;

      const like = await this.postLikesRepository.findLikeByUserIdAndPostId(
        userId,
        postId,
      );

      //if like exists and new status is the same AND/OR if like doesn't exist and new status is None, return early
      if (
        (like && likeStatus === like.status) ||
        (!like && likeStatus === PostLikeStatus.None)
      ) {
        return true;
      }

      //console.log('USER ID FROM REQ: ', userId); //COMMENT OUT
      //console.log('LIKE STATUS FROM BODY: ', likeStatus); //COMMENT OUT

      await this.updateLikeDislikeCount(postId, likeStatus, userId);
      //console.log('Was dis/like count updated?  ', updatedDisLikeCount); //COMMENT OUT

      if (like) {
        await this.postLikesRepository.updateLikeOrDislike(like.id, likeStatus);
      } else {
        const newLike: PostLikeDTO = {
          postId: postId,
          userId: userId,
          status: likeStatus,
        };
        await this.postLikesRepository.createLikeOrDislike(newLike);
      }

      return true;
    } catch (error) {
      console.error('Error updating postLike status, PostService:', error);
      return false;
    }
  }

  async updateLikeDislikeCount(
    postId: string,
    likeStatus: PostLikeStatus,
    userId: string,
  ): Promise<boolean> {
    const like = await this.postLikesRepository.findLikeByUserIdAndPostId(
      userId,
      postId,
    );

    let likeIncrement = 0;
    let dislikeIncrement = 0;

    //increment or decrement based on the new like status
    if (likeStatus === PostLikeStatus.Like) {
      likeIncrement = 1;
      dislikeIncrement = like?.status === PostLikeStatus.Dislike ? -1 : 0;
    } else if (likeStatus === PostLikeStatus.Dislike) {
      dislikeIncrement = 1;
      likeIncrement = like?.status === PostLikeStatus.Like ? -1 : 0;
    } else if (likeStatus === PostLikeStatus.None && like) {
      if (like.status === PostLikeStatus.Like) {
        likeIncrement = -1;
      } else if (like.status === PostLikeStatus.Dislike) {
        dislikeIncrement = -1;
      }
    }

    try {
      return await this.postsRepository.updateLikeDislikeCount(
        postId,
        likeIncrement,
        dislikeIncrement,
      );
    } catch (error) {
      console.error(
        error,
        'Could not update like/dislike count of posts, PostService',
      );
      return false;
    }
  }
}
