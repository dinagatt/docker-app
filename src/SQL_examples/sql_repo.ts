import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentViewModel } from '../feature/comments/api/models/output/comment.output.model';
//FOR USERS
@Injectable()
export class SqlExampleRepo {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async findAll() {
    const result = await this.dataSource.query(`
SELECT *
FROM public."Users";
    `);

    return result.map((u) => {
      return {
        id: u.id,
        login: u.login,
        email: u.email,
        createdAt: u.createdAt,
      };
    });
  }

  async findOne(id: string): Promise<CommentViewModel | null> {
    const result = await this.dataSource.query(`
SELECT *
FROM public."Users" AS u
WHERE u.id = ${id};
    `);

    return result.map((u) => {
      return {
        id: u.id,
        login: u.login,
        email: u.email,
        createdAt: u.createdAt,
      };
    })[0];
  }
}
