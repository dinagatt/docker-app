import { Injectable } from '@nestjs/common';
import { CommentViewModel } from '../api/models/output/comment.output.model';
import { CommentLikeStatus } from '../comment-likes/api/models/input/comment-like.input.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentQueryDto } from '../../../common/utils/pagination/commentQueryDTO';
import { Comment } from '../domain/TypeORM/comment.entity';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectRepository(Comment) private commentsORMrepo: Repository<Comment>,
  ) {}

  mapToOutput(comment: any): CommentViewModel {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.user.login,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: comment.commentLikes?.[0]?.status || CommentLikeStatus.None,
      },
    };
  }

  async getCommentById(
    id: string,
    userId: string | null,
  ): Promise<CommentViewModel | null> {
    const comment = await this.commentsORMrepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'u')
      .leftJoinAndSelect(
        'c.commentLikes',
        'cl',
        userId ? 'cl.userId = :userId' : '1=0',
        { userId },
      )
      .where('c.id = :id', { id })
      .getOne();

    //console.log(comment);

    return comment ? this.mapToOutput(comment) : null;

    /* RAW SQL
    const comment = await this.dataSource.query(
      `
    SELECT c.*, u."login" as "userLogin" 
    FROM public."Comments" as c
    LEFT JOIN public."Users" as u
      ON c."userId" = u."id"
    WHERE c."id" = $1
    `,
      [id],
    );
    //console.log(comment.length); // COMMENT OUT

    if (!comment || comment.length === 0) {
      return null;
    }

    let myStatus = CommentLikeStatus.None;
    if (userId) {
      const reaction = await this.dataSource.query(
        `
        SELECT cl."status"
        FROM public."Comment Likes" as cl
        WHERE cl."commentId" = $1 AND cl."userId" = $2
        `,
        [id, userId],
      );
      //console.log(reaction[0].status); // COMMENT OUT
      if (reaction.length > 0) {
        myStatus = reaction[0].status;
      }
    }

    return this.mapToOutput(comment[0], myStatus);*/
  }

  async getAllCommentsByPostId(
    query: CommentQueryDto,
    userId: string | null,
    postId: string,
  ) {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;

    // query builder
    const [comments, totalCount] = await this.commentsORMrepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'u')
      .leftJoinAndSelect(
        'c.commentLikes',
        'cl',
        userId ? 'cl.userId = :userId' : '1=0',
        { userId },
      )
      .where('c.postId = :postId', { postId })
      .orderBy(`c.${sortBy}`, sortDirection.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    //console.log(comments);

    /* RAW SQL
    // OFFSET
    const offset = (pageNumber! - 1) * pageSize!;

    // WHERE conditions for filtering
    const filters: string[] = [` c."postId" = $1 `];
    const whereClause =
      filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const comments = await this.dataSource.query(
      `
      SELECT 
        c.*, 
        u."login" as "userLogin",
        COALESCE(cl."status", 'None') as "myStatus"
      FROM public."Comments" as c
      LEFT JOIN public."Users" as u
        ON c."userId" = u."id" 
      LEFT JOIN public."Comment Likes" as cl
        ON c."id" = cl."commentId" AND cl."userId" = $2 
      ${whereClause}
      ORDER BY "${sortBy}" ${sortDirection!.toUpperCase()}
      LIMIT $3 
      OFFSET $4
    `,
      [postId, userId, pageSize, offset],
    );

    const totalCountResult = await this.dataSource.query(
      `
      SELECT COUNT(*) 
      FROM public."Comments"  as c
      ${whereClause}
    `,
      [postId],
    );
    const totalCount = parseInt(totalCountResult[0].count, 10);*/

    const pagesCount = Math.ceil(totalCount / pageSize);

    // Mapped for output
    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        commentatorInfo: {
          userId: comment.userId,
          userLogin: comment.user.login,
        },
        createdAt: comment.createdAt.toISOString(),
        likesInfo: {
          likesCount: comment.likesCount,
          dislikesCount: comment.dislikesCount,
          myStatus: userId
            ? comment.commentLikes?.[0]?.status || CommentLikeStatus.None
            : CommentLikeStatus.None,
        },
      })),
    };
  }

  /*getCommentsByPostsId old paging
  async getCommentsByPostsId(
    pagination: Pagination,
    userId: string | null,
    postId: string,
  ): Promise<PaginationOutput<CommentViewModel> | null> {
    const filters: FilterQuery<Post>[] = [];

    /!*if (pagination.searchNameTerm) {
      filters.push({
        name: { $regex: pagination.searchNameTerm, $options: 'i' },
      });
    }*!/
    //console.log(pagination);

    const filter: FilterQuery<Comment> = { postId: postId };

    if (filters.length > 0) {
      filter.$or = filters;
    }

    return await this.__getResult(filter, pagination, userId);
  }

  private async __getResult(
    filter: FilterQuery<Comment>,
    pagination: Pagination,
    userId: string | null,
  ): Promise<PaginationOutput<CommentViewModel> | null> {
    const comments = await this.commentModel
      .find(filter)
      .sort({
        [pagination.sortBy]: pagination.getSortDirectionInTextFormat(),
      })
      .skip(pagination.getSkipItemsCount())
      .limit(pagination.pageSize);

    if (!comments) return null;

    const totalCount = await this.commentModel.countDocuments(filter);

    //retrieve comments' IDs to fetch all likes related to these comments
    const commentsIds = comments.map((comment: CommentDocument) =>
      comment._id.toString(),
    );
    const commentsLikes: CommentLikeDocument[] =
      await this.commentLikeModel.find({
        commentId: { $in: commentsIds },
      });

    //map the comments with likes and user status
    const items = await Promise.all(
      comments.map(async (comment: CommentDocument) => {
        //get all likes related to the current comment
        const commentLikes = commentsLikes.filter(
          (commentLike) => commentLike.commentId === comment._id.toString(),
        );

        //get user's reaction
        let myStatus = CommentLikeStatus.None;
        if (userId) {
          const userReaction = commentLikes.find(
            (commentLike) => commentLike.userId === userId,
          );

          if (userReaction) {
            myStatus = userReaction.status;
          }
        }

        //console.log(`Found user's like status, comment query repo: `, myStatus);
        return this.mapToOutput(comment, myStatus);
      }),
    );

    return new PaginationOutput<CommentViewModel>(
      items,
      pagination.pageNumber,
      pagination.pageSize,
      totalCount,
    );
  }*/
}
