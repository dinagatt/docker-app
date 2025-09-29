import { Injectable } from '@nestjs/common';
import { PostLikeStatus } from '../api/models/input/post-like.input.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostLikeDTO } from '../application/DTO/postLikeDTO';
import { PostLike } from '../domain/TypeORM/postLike.entity';

@Injectable()
export class PostLikesRepository {
  constructor(
    @InjectRepository(PostLike)
    private postLikesORMrepo: Repository<PostLike>,
  ) {}

  async findLikeByUserIdAndPostId(
    userId: string,
    postId: string,
  ): Promise<PostLike | null> {
    const result = await this.postLikesORMrepo.findOneBy({
      userId: userId,
      postId: postId,
    });

    return result ? (result as PostLike) : null;

    /* RAW SQL
   const result = await this.dataSource.query(
      `
    SELECT *
    FROM public."Post Likes"
    WHERE "postId" = $1 AND "userId" = $2
    `,
      [postId, userId],
    );

    return result.length ? (result[0] as PostLikeEntity) : null;*/
  }

  async createLikeOrDislike(DTO: PostLikeDTO): Promise<string | null> {
    const newPostLike = this.postLikesORMrepo.create(DTO);

    try {
      const result = await this.postLikesORMrepo.save(newPostLike);
      return result.id;
    } catch (error) {
      console.log(
        `Error saving PostLike for PostLike creation, postLikes' repo`,
        error,
      );
      return null;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    INSERT INTO public."Post Likes"(
      "postId", "userId", "status", "addedAt"
      )
      VALUES ($1, $2, $3, $4)
      RETURNING "id" 
      `,
      [
        postLikeDTO.postId,
        postLikeDTO.userId,
        postLikeDTO.status,
        postLikeDTO.addedAt,
      ],
    );

    return result.length ? result[0].id : null;*/
  }

  async updateLikeOrDislike(likeId: string, likeStatus: PostLikeStatus) {
    //console.log('Like status from req in repo: ', likeStatus);

    const postStatus = await this.postLikesORMrepo.findOneBy({
      id: likeId,
    });
    if (!postStatus) return false;

    try {
      postStatus.status = likeStatus;
      await this.postLikesORMrepo.save(postStatus);
      return true;
    } catch (error) {
      console.error(
        `Error saving PostLike for likeStatus update, postLikes' repo:`,
        error,
      );
      return false;
    }

    /* RAW SQL
   const result = await this.dataSource.query(
      `
     UPDATE public."Post Likes"
     SET "status" = $1 
     WHERE id = $2
     RETURNING *;
     `,
      [likeStatus, likeId],
    );
    //console.log(result); //COMMENT OUT
    return result[1] === 1;*/
  }
}
