import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostDTO } from '../application/DTOs/postDTO';
import { Post } from '../domain/TypeORM/post.entity';

@Injectable()
export class PostsRepository {
  constructor(@InjectRepository(Post) private postsORMrepo: Repository<Post>) {}

  async createPost(postDTO: PostDTO): Promise<string | null> {
    const newPost = this.postsORMrepo.create(postDTO);

    try {
      const result = await this.postsORMrepo.save(newPost);
      return result.id;
    } catch (error) {
      console.log(`Error saving Post for Post creation, posts' repo`, error);
      return null;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    INSERT INTO public."Posts"(
      "title", "shortDescription", "content", "blogId", "createdAt", "likesCount", "dislikesCount"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id 
      `,
      [
        postDTO.title,
        postDTO.shortDescription,
        postDTO.content,
        postDTO.blogId,
        postDTO.createdAt,
        postDTO.likesCount,
        postDTO.dislikesCount,
      ],
    );

    return result.length ? result[0].id : null;*/
  }

  async findPostById(id: string): Promise<Post | null> {
    const result: Post | null = await this.postsORMrepo.findOneBy({ id: id });

    return result ? (result as Post) : null;

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    SELECT * 
    FROM public."Posts" 
    WHERE id = $1
    `,
      [id],
    );

    //console.log(result);
    return result.length ? (result[0] as PostEntity) : null;*/
  }

  async updatePost(
    id: string,
    title: string,
    shortDescription: string,
    content: string,
  ): Promise<boolean> {
    const post = await this.findPostById(id);
    if (!post) return false;

    try {
      post.title = title;
      post.shortDescription = shortDescription;
      post.content = content;
      await this.postsORMrepo.save(post);
      return true;
    } catch (error) {
      console.error(`Error saving Post for Post update, posts' repo:`, error);
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
     UPDATE public."Posts"
     SET "title" = $1 , "shortDescription" = $2, "content"  = $3
     WHERE "id" = $4
     RETURNING *;
     `,
      [title, shortDescription, content, id],
    );

    //console.log(result);
    return result[1] === 1;*/
  }

  async deletePost(id: string): Promise<boolean> {
    try {
      const result = await this.postsORMrepo.delete({ id: id });
      if (result.affected === 1) {
        return true;
        //console.log('Post deleted successfully.');
      } else {
        console.log(
          `No post found with the given ID ${id} for deletion, posts' repo`,
        );
        return false;
      }
    } catch (error) {
      console.error(`Error during deletion, posts' repo`, error);
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
     DELETE FROM public."Posts"
     WHERE "id" = $1 
     RETURNING *
     `,
      [id],
    );

    //return result[1] === 1;
    return result.length > 0;*/
  }

  async updateLikeDislikeCount(
    postId: string,
    likeIncrement: number,
    dislikeIncrement: number,
  ): Promise<boolean> {
    const post = await this.findPostById(postId);
    if (!post) return false;

    try {
      post.likesCount = post.likesCount + likeIncrement;
      post.dislikesCount = post.dislikesCount + dislikeIncrement;
      await this.postsORMrepo.save(post);
      return true;
    } catch (error) {
      console.error(
        `Error saving Post for like/dislike count update, posts' repo:`,
        error,
      );
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
     UPDATE public."Posts"
     SET
       "likesCount" = "likesCount" + $1,
       "dislikesCount" = "dislikesCount" + $2
     WHERE id = $3
     RETURNING *;
     `,
      [likeIncrement, dislikeIncrement, postId],
    );
    //console.log(result); //COMMENT OUT
    return result[1] === 1;*/
  }
}
