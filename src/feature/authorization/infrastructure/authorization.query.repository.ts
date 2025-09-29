import { Injectable } from '@nestjs/common';
import { MeViewModel } from '../api/models/output/output.models';
import { UserEntity } from '../../users/domain/sql/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthQueryRepository {
  constructor(
    @InjectDataSource()
    protected dataSource: DataSource /* MONGOOSE @InjectModel(User.name) private userModel: UserModelType*/,
  ) {}

  getMyAccountInfoMapped(user: UserEntity): MeViewModel {
    return {
      email: user.email,
      login: user.login,
      userId: user.id,
    };
  }

  async findUserByUserId(userId: string): Promise<MeViewModel | null> {
    /* MONGOOSE
    const user: UserDocument | null = await this.userModel.findOne({
      _id: new ObjectId(userId),
    });*/

    const user = await this.dataSource.query(
      `
    SELECT * 
    FROM public."user" 
    WHERE id = $1
    `,
      [userId],
    );
    //console.log(user[0]); //COMMENT OUT

    if (!user) {
      return null;
    } else {
      return this.getMyAccountInfoMapped(user[0]);
    }
  }
}
