import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema()
export class User {
  @Prop({ type: ObjectId, required: true })
  _id: ObjectId;

  @Prop({ type: String, required: true })
  login: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Date, default: new Date().toISOString })
  createdAt: string;

  @Prop({ type: Boolean, required: true })
  isConfirmed: boolean;

  /*  static createUser(login: string, email: string | null) {
        const user = new this();

        user.login = login;
        user.email = email ?? `${randomUUID()}_${login}@it-incubator.io`;

        return user;
    }

    getLogin() {
        return this.login;
    }*/
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.loadClass(User);

// Types
export type UserDocument = HydratedDocument<User>;

type UserModelStaticType = {
  createUser: (name: string, email: string | null) => UserDocument;
};

export type UserModelType = Model<UserDocument>; //& UserModelStaticType;
