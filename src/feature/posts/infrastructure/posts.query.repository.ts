import { Injectable } from '@nestjs/common';
import { PostViewModel } from '../api/models/output/post.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostQueryDto } from '../../../common/utils/pagination/postQueryDTO';
import { Post } from '../domain/TypeORM/post.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(@InjectRepository(Post) private postsORMrepo: Repository<Post>) {}

  mapToOutput(post: any): PostViewModel {
    return {
      id: post.p_id,
      title: post.p_title,
      shortDescription: post.p_shortDescription,
      content: post.p_content,
      blogId: post.b_id,
      blogName: post.b_name,
      createdAt: post.p_createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: post.p_likesCount,
        dislikesCount: post.p_dislikesCount,
        myStatus: post.myStatus || 'None',
        newestLikes: post.threePostLikes || [],
      },
    };
  }

  async getPostById(
    id: string,
    userId: string | null,
  ): Promise<PostViewModel | null> {
    const post = await this.postsORMrepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.blog', 'b')
      .addSelect((subQuery) => {
        return subQuery
          .select('COALESCE(MAX(pl.status), :defaultStatus)', 'status')
          .from('post_like', 'pl')
          .where('pl.userId = :userId', { userId })
          .andWhere('pl.postId = p.id')
          .limit(1);
      }, 'myStatus')
      .addSelect((subQuery) => {
        return subQuery
          .select(
            `COALESCE(jsonb_agg(json_build_object(
            'addedAt', recent_likes.addedAt, 
            'userId', recent_likes.userId, 
            'login', recent_likes.login)), '[]')`,
          )
          .from((qb) => {
            return qb
              .select([
                'pl.createdAt AS addedAt',
                'pl.userId AS userId',
                'u.login AS login',
              ])
              .from('post_like', 'pl')
              .leftJoin('user', 'u', 'u.id = pl.userId')
              .where('pl.postId = p.id AND pl.status = :status', {
                status: 'Like',
              })
              .orderBy('pl.createdAt', 'DESC')
              .limit(3);
          }, 'recent_likes');
      }, 'threePostLikes')
      .where('p.id = :id', { id: id })
      .setParameters({
        userId,
        defaultStatus: 'None',
      })
      .getRawOne();

    //console.log(post);

    /*RAW SQL: MyStatus/threeLastLikes as separate queries
    const post = await this.dataSource.query(
      `
    SELECT p.*, b."name" as "blogName"  /!* if we have more than one => concat(b."name" || ''|| b."smth" as "someAlias") *!/
    FROM public."post" as p
    LEFT JOIN public."blog" as b
      ON p."blogId" = b."id"
    WHERE p."id" = $1
    `,
      [id],
    );

    if (!post || post.length === 0) {
      return null;
    }

    //get the 3 newest likes for the post
    const newestLikes = await this.dataSource.query(
      `
    SELECT 
      TO_CHAR(pl."addedAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "addedAt",
      pl."userId", 
      u."login"
    FROM public."Post Likes" AS pl
    LEFT JOIN public."Users" AS u
      ON pl."userId" = u."id"
    WHERE pl."postId" = $1 AND pl."status" = 'Like'
    ORDER BY "addedAt" DESC
    LIMIT 3;
    `,
      [id],
    );

    const formattedLikes = newestLikes.length ? newestLikes : [];

    //determine the current user's like status for this post
    let myStatus: PostLikeStatus = PostLikeStatus.None;
    if (userId) {
      const myReaction = await this.dataSource.query(
        `
        SELECT pl."status"
        FROM public."Post Likes" as pl
        WHERE pl."postId" = $1 AND pl."userId" = $2
        `,
        [id, userId],
      );

      if (myReaction.length > 0) {
        myStatus = myReaction[0].status;
      }
    }*/

    return post ? this.mapToOutput(post) : null;
  }

  async getAllPosts(query: PostQueryDto, userId: string | null) {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;

    // query builder
    const postsByQB = await this.postsORMrepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.blog', 'b')
      .addSelect((subQuery) => {
        return subQuery
          .select('COALESCE(MAX(pl.status), :defaultStatus)', 'status')
          .from('post_like', 'pl')
          .where('pl.userId = :userId', { userId })
          .andWhere('pl.postId = p.id')
          .limit(1);
      }, 'myStatus')
      .addSelect((subQuery) => {
        return subQuery
          .select(
            `COALESCE(jsonb_agg(json_build_object(
            'addedAt', recent_likes.addedAt, 
            'userId', recent_likes.userId, 
            'login', recent_likes.login)), '[]')`,
          )
          .from((qb) => {
            return qb
              .select([
                'pl.createdAt AS addedAt',
                'pl.userId AS userId',
                'u.login AS login',
              ])
              .from('post_like', 'pl')
              .leftJoin('user', 'u', 'u.id = pl.userId')
              .where('pl.postId = p.id AND pl.status = :status', {
                status: 'Like',
              })
              .orderBy('pl.createdAt', 'DESC')
              .limit(3);
          }, 'recent_likes');
      }, 'threePostLikes')
      .orderBy(
        sortBy === 'blogName' ? 'b.name' : `p.${sortBy}`,
        sortDirection.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip((pageNumber! - 1) * pageSize!)
      .take(pageSize)
      .setParameters({
        userId,
        defaultStatus: 'None',
      })
      .getRawMany();

    //console.log(postsByQB);

    const totalCount = await this.postsORMrepo
      .createQueryBuilder('p')
      .getCount();

    /* RAW SQL: WITH MyStatus/threeLastLikes
        const offset = (pageNumber! - 1) * pageSize!;

        // WHERE conditions for filtering
        const filters: string[] = [];
        const whereClause =
          filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        const posts = await this.dataSource.query(
          `
          SELECT p.*, b."name" AS "blogName",

          COALESCE((
          SELECT pl."status"
          FROM public."Post Likes" AS pl
          WHERE pl."userId" = $1 AND pl."postId" = p."id"
          LIMIT 1
          ), 'None') AS "myStatus",

          COALESCE((
          SELECT jsonb_agg(json_build_object(
          'addedAt', recent_likes."addedAt",
          'userId', recent_likes."userId",
          'login', recent_likes."login"
          ))
          FROM (
            SELECT pl."addedAt", pl."userId", u."login"
          FROM public."Post Likes" AS pl
          LEFT JOIN public."Users" AS u ON pl."userId" = u."id"
          WHERE pl."postId" = p."id" AND pl."status" = 'Like'
          ORDER BY pl."addedAt" DESC
          LIMIT 3
          ) AS recent_likes
          ), '[]'::jsonb) AS "threePostLikes"

          FROM public."Posts" as p
          LEFT JOIN public."Blogs" as b
            ON p."blogId" = b."id"
          ${whereClause}
          ORDER BY "${sortBy}" ${sortDirection!.toUpperCase()}
          LIMIT $2
          OFFSET $3
        `,
          [userId, pageSize, offset],
        );*/

    /* RAW SQL: NO MyStatus/threeLastLikes
    const posts = await this.dataSource.query(
      `
      SELECT p.*, b."name" AS "blogName"
      FROM public."post" AS p
      LEFT JOIN public."blog" AS b
        ON p."blogId" = b."id"
      ${whereClause}
      ORDER BY "${sortBy}" ${sortDirection!.toUpperCase()}
      LIMIT $1 
      OFFSET $2
    `,
      [pageSize, offset],
    );

    const totalCountResult = await this.dataSource.query(
      `
      SELECT COUNT(*) 
      FROM public."post" 
      ${whereClause}
    `,
    );
    const totalCount = parseInt(totalCountResult[0].count, 10);*/

    const pagesCount = Math.ceil(totalCount / pageSize!);

    /* RAW SQL: MyStatus and threeLastLikes as separate queries
    // get 3 like reactions of each found post:
    const allLikeReactions = await this.dataSource.query(
      `
    SELECT pl."addedAt",pl."userId", u."login"
    FROM public."Post Likes" as pl
    LEFT JOIN public."Users" as u
      ON pl."userId" = u."id"
    WHERE pl."status" = 'Like';
    ORDER BY "addedAt" DESC
    `,
      [],
    );
    // group likes by postId and limit to the 3 most recent
    const likesByPost = allLikeReactions.reduce((acc, like) => {
      if (!acc[like.postId]) {
        acc[like.postId] = [];
      }
      if (acc[like.postId].length < 3) {
        acc[like.postId].push({
          addedAt: like.addedAt,
          userId: like.userId,
          login: like.login,
        });
      }
      return acc;
    }, {});

    // determine the current user's like status for this post
    let myStatus: PostLikeStatus = PostLikeStatus.None;
    if (userId) {
      const myReactions = await this.dataSource.query(
        `
        SELECT pl."postId", pl."status"
        FROM public."Post Likes" as pl
        WHERE pl."userId" = $1
        `,
        [userId],
      );

      if (myReactions) {
        myStatus = myReactions.reduce((acc, reaction) => {
          if (!acc[reaction.postId]) {
            acc[reaction.postId] = 'None';
          }
          if (acc[reaction.postId].length < 0) {
            acc[reaction.postId].push({
              status: reaction.status,
            });
          }
          return acc;
        }, {});
      }
    }*/

    // Return data in the specified format
    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: postsByQB.map((post: any) => {
        return {
          id: post.p_id,
          title: post.p_title,
          shortDescription: post.p_shortDescription,
          content: post.p_content,
          blogId: post.b_id,
          blogName: post.b_name,
          createdAt: post.p_createdAt.toISOString(),
          extendedLikesInfo: {
            likesCount: post.p_likesCount,
            dislikesCount: post.p_dislikesCount,
            myStatus: post.myStatus || 'None',
            newestLikes: post.threePostLikes || [],
          },
        };
      }),
    };
  }

  /*async getAllPosts OLD PAGING
  async getAllPosts(
    pagination: PaginationWithSearchNameTerm,
    userId: string | null,
  ): Promise<PaginationOutput<PostViewModel> | null> {
    const filters: string[] = [];

    if (pagination.searchNameTerm) {
      filters.push(`name ILIKE '%' || $1 || '%'`);
    }

    const filterCondition =
      filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    return await this.__getResult(filterCondition, pagination, userId);

    /!* MONGOOSE
    const filters: FilterQuery<Post>[] = [];

    if (pagination.searchNameTerm) {
      filters.push({
        name: { $regex: pagination.searchNameTerm, $options: 'i' },
      });
    }
    //console.log(pagination);

    const filter: FilterQuery<Post> = {};

    if (filters.length > 0) {
      filter.$or = filters;
    }

    return await this.__getResult(filter, pagination, userId);*!/
  }

  private async __getResult(
    /!*filter: FilterQuery<Post>,*!/
    filterCondition: string,
    pagination: PaginationWithSearchNameTerm,
    userId: string | null,
  ): Promise<PaginationOutput<PostViewModel> | null> {
    /!* MONGOOSE
    const posts = await this.postModel
      .find(filter)
      .sort({
        [pagination.sortBy]: pagination.getSortDirectionInNumericFormat(),
      })
      .skip(pagination.getSkipItemsCount())
      .limit(pagination.pageSize);
    if (!posts) return null;

    const totalCount = await this.postModel.countDocuments(filter);

    //retrieve post IDs to fetch all likes related to these posts
    const postsIds = posts.map((post: PostDocument) => post._id.toString());
    const postsLikes: PostLikeDocument[] = await this.postLikeModel.find({
      postId: { $in: postsIds },
    });

    //map the posts with likes and user status
    const items = await Promise.all(
      posts.map(async (post: PostDocument) => {
        //get all likes related to the current post
        const postLikes = postsLikes.filter(
          (postLike) => postLike.postId === post._id.toString(),
        );

        //get user's reaction
        let myStatus = PostLikeStatus.None;
        if (userId) {
          const userReaction = postLikes.find(
            (postLike) => postLike.userId === userId,
          );
          if (userReaction) {
            myStatus = userReaction.status;
          }
        }

        //get the 3 newest likes for the post
        const newestLikes: PostLikeDocument[] = await this.postLikeModel
          .find({
            postId: post._id.toString(),
            status: PostLikeStatus.Like,
          })
          .sort({ addedAt: -1 })
          .limit(3);

        //map newestLikes
        const newestLikesMapped: LikeDetailsViewModel[] = newestLikes.map(
          (like: PostLikeDocument) => ({
            addedAt: like.addedAt,
            userId: like.userId,
            login: like.login,
          }),
        );

        return this.mapToOutput(post, newestLikesMapped, myStatus);
      }),
    );*!/

    const posts = await this.dataSource.query(
      `
     SELECT *
     FROM public."Posts"
     ${filterCondition}
     ORDER BY "${pagination.sortBy}" ${pagination.getSortDirectionInTextFormat()}
     OFFSET ${pagination.getSkipItemsCount()}
     LIMIT ${pagination.pageSize};
     `,
      [pagination.searchNameTerm],
    );

    // Get total count of users matching the filter
    const totalCountResult = await this.dataSource.query(
      `
     SELECT COUNT(*)
     FROM public."Posts"
     ${filterCondition};
     `,
      [pagination.searchNameTerm],
    );
    const totalCount = parseInt(totalCountResult[0].count, 10);

    const items = await Promise.all(
      posts.map(async (post: PostEntity) => {
        return this.mapToOutput(post, [], PostLikeStatus.None);
      }),
    );

    return new PaginationOutput<PostViewModel>(
      items,
      pagination.pageNumber,
      pagination.pageSize,
      totalCount,
    );
  }*/
}
