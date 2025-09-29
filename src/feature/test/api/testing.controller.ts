import {
  Controller,
  Delete,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('testing')
export class TestingController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Delete('all-data')
  @HttpCode(204)
  async deleteAllData(): Promise<void> {
    try {
      // Start a transaction to ensure safe table truncation
      await this.dataSource.transaction(async (manager) => {
        // Get all table names from the current schema (public schema by default)
        const tables = await manager.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);

        // If no tables are found, log and return
        if (!tables || tables.length === 0) {
          console.log('No tables found in the database');
          return;
        }

        // Truncate each table to delete all data
        for (const table of tables) {
          const tableName = table.table_name;
          await manager.query(
            `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`,
          );
          console.log(`Truncated table: ${tableName}`);
        }
        const check = await this.dataSource.query(
          `SHOW transaction_isolation;`,
        );
        console.log(check);
        console.log('Database cleanup complete.');
      });
    } catch (error) {
      console.error('Error truncating tables:', error);
      throw new HttpException(
        'Error cleaning up database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

/* MONGOOSE
export class TestingController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Delete('all-data')
  @HttpCode(204)
  async deleteAllData(): Promise<void> {
    try {
      if (!this.connection.db) {
        throw new HttpException(
          'Database connection is not established',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const collections = await this.connection.db.collections();

      if (!collections || collections.length === 0) {
        console.log('No collections found in the database');
        return;
      }

      for (const collection of collections) {
        await this.connection.db.dropCollection(collection.collectionName);
        console.log(`Dropped collection: ${collection.collectionName}`);
      }

      console.log('Database cleanup complete.');
    } catch (error) {
      console.error('Error dropping collections:', error);
      throw new HttpException(
        'Error cleaning up database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
*/
