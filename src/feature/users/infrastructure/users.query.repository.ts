import { Injectable } from '@nestjs/common';
import { UserViewModel } from '../api/models/output/user.output.model';
import { UserEntity } from '../domain/sql/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserQueryDto } from '../../../common/utils/pagination/userQueryDTO';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  mapToOutput(user: UserEntity): UserViewModel {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async getById(id: string): Promise<UserViewModel | null> {
    const result: UserEntity | null = await this.dataSource.query(
      `
    SELECT * 
    FROM public."user" 
    WHERE id = $1
    `,
      [id],
    );

    //console.log(`LOG: ${result}`); //COMMENT OUT

    if (result === null) {
      return null;
    }

    const user: UserEntity = result[0]; //gets the 1st row from the result

    return this.mapToOutput(user);
  }

  async getAllUsers(query: UserQueryDto) {
    const {
      searchLoginTerm,
      searchEmailTerm,
      sortBy,
      sortDirection,
      pageNumber,
      pageSize,
    } = query;

    // Calculate offset
    const offset = (pageNumber! - 1) * pageSize!;

    // Build the WHERE conditions for filtering
    const filters: string[] = [];
    const params: string[] = [];

    if (searchLoginTerm) {
      filters.push(`login ILIKE $${params.length + 1}`);
      params.push(`%${searchLoginTerm}%`);
    }

    if (searchEmailTerm) {
      filters.push(`email ILIKE $${params.length + 1}`);
      params.push(`%${searchEmailTerm}%`);
    }
    // WHERE clause - combine filters
    const whereClause = filters.length ? `WHERE ${filters.join(' OR ')}` : '';

    // Query to get paginated and sorted users
    const usersQuery = `
      SELECT *
      FROM public."user" 
      ${whereClause}
      ORDER BY ${sortBy === 'login' || sortBy === 'email' ? `("${sortBy}") COLLATE "C"` : `"${sortBy}"`} ${sortDirection!.toUpperCase()}
      LIMIT $${params.length + 1} 
      OFFSET $${params.length + 2}
    `;

    /*console.log(sortBy, sortDirection, params, offset, usersQuery);*/

    // Query to get total count of users (for pagination)
    const countQuery = `
      SELECT COUNT(*) 
      FROM public."user" 
      ${whereClause}
    `;

    // Execute queries
    const users = await this.dataSource.query(usersQuery, [
      ...params,
      pageSize,
      offset,
    ]);
    const totalCountResult = await this.dataSource.query(countQuery, params);
    const totalCount = parseInt(totalCountResult[0].count, 10);

    // Calculate total pages
    const pagesCount = Math.ceil(totalCount / pageSize!);

    // Return data in the specified format
    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: users.map((user) => ({
        id: user.id,
        login: user.login,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      })),
    };
  }

  /*async getAll old paging
  async getAll(
    pagination: PaginationWithSearchLoginAndEmailTerm,
  ): Promise<PaginationOutput<UserViewModel>> {
    const filters: string[] = [];
    const params: any[] = [];

    if (pagination.searchEmailTerm) {
      filters.push(`email ILIKE '%' || $1 || '%'`);
      params.push(pagination.searchEmailTerm);
    }

    if (pagination.searchLoginTerm) {
      filters.push(`login ILIKE '%' || $2 || '%'`);
      params.push(pagination.searchLoginTerm);
    }

    const filterCondition =
      filters.length > 0 ? `WHERE ${filters.join(' OR ')}` : '';

    //ensure $3 and $4 are integers for OFFSET and LIMIT
    params.push(pagination.getSkipItemsCount());
    params.push(pagination.pageSize);

    return await this.__getResult(filterCondition, pagination, params);

    /!* MONGOOSE
    const filters: FilterQuery<User>[] = [];

    if (pagination.searchEmailTerm) {
      filters.push({
        email: { $regex: pagination.searchEmailTerm, $options: 'i' },
      });
    }

    if (pagination.searchLoginTerm) {
      filters.push({
        login: { $regex: pagination.searchLoginTerm, $options: 'i' },
      });
    }

    const filter: FilterQuery<User> = {};

    if (filters.length > 0) {
      filter.$or = filters;
    }

    return await this.__getResult(filter, pagination);*!/
  }

  private async __getResult(
    /!* MONGOOSE filter: FilterQuery<User>,*!/
    filterCondition: string,
    pagination: PaginationWithSearchLoginAndEmailTerm,
    params: any[],
  ): Promise<PaginationOutput<UserViewModel>> {
    /!* MONGOOSE
    const users = await this.userModel
      .find(filter)
      .sort({
        [pagination.sortBy]: pagination.getSortDirectionInNumericFormat(),
      })
      .skip(pagination.getSkipItemsCount())
      .limit(pagination.pageSize);

    const totalCount = await this.userModel.countDocuments(filter);*!/

    const users = await this.dataSource.query(
      `
     SELECT *
     FROM public."Users"
     ${filterCondition}
     ORDER BY "${pagination.sortBy}" ${pagination.getSortDirectionInTextFormat()}
     OFFSET $${params.length - 1}
     LIMIT $${params.length}
     `,
      params,
      /!*[
        pagination.searchEmailTerm,
        pagination.searchLoginTerm,
        pagination.getSkipItemsCount(),
        pagination.pageSize,
      ],*!/
    );

    // Get total count of users matching the filter
    const totalCountResult = await this.dataSource.query(
      `
     SELECT COUNT(*)
     FROM public."Users"
     ${filterCondition}
     `,
      params.slice(0, params.length - 2), // Only send filter params, not OFFSET or LIMIT
    );

    const totalCount = parseInt(totalCountResult[0].count, 10);

    const mappedUsers = users.map((user: UserEntity) => this.mapToOutput(user));

    return new PaginationOutput<UserViewModel>(
      mappedUsers,
      pagination.pageNumber,
      pagination.pageSize,
      totalCount,
    );
  }*/
}
