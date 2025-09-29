import { Injectable } from '@nestjs/common';
import { BlogInputModel } from '../api/models/input/create-blog.input.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogDTO } from '../application/DTOs/blogDTO';
import { Blog } from '../domain/TypeORM/blog.entity';

@Injectable()
export class BlogsRepository {
  constructor(@InjectRepository(Blog) private blogsORMrepo: Repository<Blog>) {}

  async createBlog(blogDTO: BlogDTO): Promise<string | null> {
    const newBlog = this.blogsORMrepo.create(blogDTO);

    try {
      const result = await this.blogsORMrepo.save(newBlog);
      return result.id;
    } catch (error) {
      console.log(`Error saving Blog for Blog creation, blogs' repo`, error);
      return null;
    }

    /* RAW AQL
    const result = await this.dataSource.query(
      `
    INSERT INTO public."Blogs"(
      "name", "description", "websiteUrl", "createdAt", "isMembership"
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id 
      `,
      [
        blogDTO.name,
        blogDTO.description,
        blogDTO.websiteUrl,
        blogDTO.createdAt,
        blogDTO.isMembership,
      ],
    );
    //console.log(result); // => [ { id: '6edf02fc-a01c-45b7-bc02-7d60c898d4a5' } ] COMMENT OUT

    return result.length ? result[0].id : null;*/
  }

  async findBlogById(id: string): Promise<Blog | null> {
    const result: Blog | null = await this.blogsORMrepo.findOneBy({ id: id });

    return result ? (result as Blog) : null;

    /* RAQ SQL
    const result = await this.dataSource.query(
      `
    SELECT * 
    FROM public."Blogs" 
    WHERE id = $1
    `,
      [id],
    );

    //console.log(result); // COMMENT OUT
    return result.length ? (result[0] as BlogEntity) : null;*/
  }

  async updateBlog(id: string, blogDTO: BlogInputModel): Promise<boolean> {
    const blog = await this.findBlogById(id);
    if (!blog) return false;

    try {
      blog.name = blogDTO.name;
      blog.description = blogDTO.description;
      blog.websiteUrl = blogDTO.websiteUrl;
      await this.blogsORMrepo.save(blog);
      return true;
    } catch (error) {
      console.error(`Error saving Blog for Blog update, blogs' repo:`, error);
      return false;
    }

    /* RAW SQL
    const { name, description, websiteUrl } = blogDTO;

    const result = await this.dataSource.query(
      `
    UPDATE public."Blogs"
    SET "name" = $1,"description" = $2, "websiteUrl" = $3
    WHERE id = $4;
    `,
      [name, description, websiteUrl, id],
    );

    return result[1] === 1;*/
  }

  async deleteBlog(id: string): Promise<boolean> {
    try {
      const result = await this.blogsORMrepo.delete({ id: id });
      if (result.affected === 1) {
        return true;
        //console.log('Blog deleted successfully.');
      } else {
        console.log(
          `No blog found with the given ID ${id} for deletion, blogs' repo`,
        );
        return false;
      }
    } catch (error) {
      console.error(`Error during deletion, blogs' repo`, error);
      return false;
    }

    /* RAW SQL
    const result = await this.dataSource.query(
      `
    DELETE FROM public."Blogs"
    WHERE "id" = $1 
    RETURNING *
    `,
      [id],
    );

    //console.log(result.length);
    //return result[1] === 1;
    return result.length > 0;*/
  }
}
