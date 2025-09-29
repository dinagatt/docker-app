import { Injectable } from '@nestjs/common';
import { BlogViewModel } from '../api/models/output/blog.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogQueryDTO } from '../../../common/utils/pagination/blogQueryDTO';
import { PostQueryDto } from '../../../common/utils/pagination/postQueryDTO';
import { Blog } from '../domain/TypeORM/blog.entity';
import { Post } from '../../posts/domain/TypeORM/post.entity';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectRepository(Blog) private blogsORMrepo: Repository<Blog>,
    @InjectRepository(Post) private postsORMrepo: Repository<Post>,
  ) {}

  //BLOGS

  mapToOutput(blog: Blog): BlogViewModel {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt.toISOString(),
      isMembership: blog.isMembership,
    };
  }

  async getBlogById(id: string): Promise<BlogViewModel | null> {
    const blog = await this.blogsORMrepo
      .createQueryBuilder('b')
      .where('b.id = :id', { id })
      .getOne();

    /* RAW SQL
    const blog = await this.dataSource.query(
      `
    SELECT * 
    FROM public."blog" 
    WHERE id = $1
    `,
      [id],
    );
    //console.log(blog![0]); // => [{id: '6edf02fc-a01c-45b7-bc02-7d60c898d4a5', name: 'Blog 07.11.24', description: 'description',websiteUrl: 'https://vernik.me/catalog/audio_tv_i_igry/?PAGEN_1=4',createdAt: 2024-11-07T23:48:16.345Z,isMembership: false}]  COMMENT OUT

    if (!blog || blog.length === 0) {
      return null;
    }*/

    return blog ? this.mapToOutput(blog) : null;
  }

  async getAllBlogs(query: BlogQueryDTO) {
    const { pageNumber, pageSize, sortBy, sortDirection, searchNameTerm } =
      query;

    const queryBuilder = this.blogsORMrepo.createQueryBuilder('b');

    if (searchNameTerm) {
      queryBuilder.where('b.name ILIKE :searchNameTerm', {
        searchNameTerm: `%${searchNameTerm}%`,
      });
    }

    queryBuilder
      .orderBy(
        sortBy === 'name' ? 'b.name COLLATE "C"' : `b.${sortBy}`,
        sortDirection.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip((pageNumber! - 1) * pageSize!)
      .take(pageSize);

    const blogs = await queryBuilder.getRawMany();
    const totalCount = await queryBuilder.getCount();

    //console.log(blogs, totalCount);

    /*RAW SQL: WITH SEARCH
    // Calculate offset
    const offset = (pageNumber! - 1) * pageSize!;

    // Build the WHERE conditions for filtering
    const filters: string[] = [];
    const params: string[] = [];

    if (searchNameTerm) {
      filters.push(`name ILIKE $${params.length + 1}`);
      params.push(`%${searchNameTerm}%`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    // Query to get paginated and sorted blogs
    const blogsQuery = `
      SELECT *
      FROM public."blog" 
      ${whereClause}
      ORDER BY ${sortBy === 'name' ? `("name") COLLATE "C"` : `"${sortBy}"`} ${sortDirection!.toUpperCase()}
      LIMIT $${params.length + 1} 
      OFFSET $${params.length + 2}
    `;

    // Query to get total count of blogs (for pagination)
    const countQuery = `
      SELECT COUNT(*) 
      FROM public."blog" 
      ${whereClause}
    `;

    // Execute queries
    const blogs = await this.dataSource.query(blogsQuery, [
      ...params,
      pageSize,
      offset,
    ]);
    const totalCountResult = await this.dataSource.query(countQuery, params);
    const totalCount = parseInt(totalCountResult[0].count, 10);*/

    const pagesCount = Math.ceil(totalCount / pageSize);

    // Return data in the specified format
    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: blogs.map((blog) => ({
        id: blog.b_id,
        name: blog.b_name,
        description: blog.b_description,
        websiteUrl: blog.b_websiteUrl,
        createdAt: blog.b_createdAt.toISOString(),
        isMembership: blog.b_isMembership,
      })),
    };
  }

  //POSTS

  /*postMapToOutput(
    post: PostEntity,
    threePostLikes: /!*LikeDetailsViewModel*!/ [],
    myStatus: PostLikeStatus,
  ): PostViewModel {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus: myStatus,
        newestLikes: threePostLikes,
      },
    };
  }*/

  async getAllPostsByBlogId(
    query: PostQueryDto,
    blogId: string,
    userId: string | null,
  ) {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;

    // query builder

    /* OLD VERSION
    const postsByQB = await this.postsORMrepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.blog', 'b')
      .select([
        'p.id AS "id"',
        'p.title AS "title"',
        'p.shortDescription AS "shortDescription"',
        'p.content AS "content"',
        'p.blogId AS "blogId"',
        'p.createdAt AS "createdAt"',
        'p.likesCount AS "likesCount"',
        'p.dislikesCount AS "dislikesCount"',
        'b.name AS "blogName"',
      ])
      .where('p."blogId" = :blogId', { blogId })
      .orderBy(`p.${sortBy}`, sortDirection.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber! - 1) * pageSize!)
      .take(pageSize)
      .getRawMany();*/

    const postsByQB = await this.postsORMrepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.blog', 'b')
      .where('p."blogId" = :blogId', { blogId })
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
      .orderBy(`p.${sortBy}`, sortDirection.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber! - 1) * pageSize!)
      .take(pageSize)
      .setParameters({
        userId,
        defaultStatus: 'None',
      })
      .getRawMany();

    const totalCount = await this.postsORMrepo
      .createQueryBuilder('p')
      .where('p."blogId" = :blogId', { blogId })
      .getCount();

    //console.log(postsByQB, totalCount);

    /* RAW SQL: WITH/WITHOUT MyStatus/threeLastLikes
    const offset = (pageNumber! - 1) * pageSize!;

    // WHERE conditions for filtering
    const filters: string[] = [` p."blogId" = $1 `];

    const whereClause =
      filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    /!*const posts = await this.dataSource.query(
      `
      SELECT p.*, b."name" as "blogName",
      
        COALESCE((
          SELECT pl."status"
          FROM public."Post Likes" AS pl
          WHERE pl."userId" = $2 AND pl."postId" = p."id"
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
      
      FROM public."post" AS p
      LEFT JOIN public."blog" AS b
        ON p."blogId" = b."id" 
      ${whereClause}
      ORDER BY "${sortBy}" ${sortDirection!.toUpperCase()}
      LIMIT $3 
      OFFSET $4
    `,
      [blogId, userId, pageSize, offset],
    );*!/

    const posts = await this.dataSource.query(
      `
      SELECT p.*, b."name" as "blogName"
      FROM public."post" AS p
      LEFT JOIN public."blog" AS b
        ON p."blogId" = b."id" 
      ${whereClause}
      ORDER BY "${sortBy}" ${sortDirection.toUpperCase()}
      LIMIT $2 
      OFFSET $3
    `,
      [blogId, pageSize, offset],
    );

    const totalCountResult = await this.dataSource.query(
      `
      SELECT COUNT(*) 
      FROM public."post" AS p
      ${whereClause}
    `,
      [blogId],
    );
    const totalCount = parseInt(totalCountResult[0].count, 10);*/

    const pagesCount = Math.ceil(totalCount / pageSize!);

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: postsByQB.map((post: any) => ({
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
      })),
    };
  }
}
