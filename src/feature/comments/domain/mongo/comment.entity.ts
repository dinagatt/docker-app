import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class Comment {
  @Prop({ type: ObjectId, required: true })
  _id: ObjectId;

  @Prop({ type: String, required: true })
  postId: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({
    type: {
      userId: { type: String, required: true },
      userLogin: { type: String, required: true },
    },
    required: true,
  })
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };

  @Prop({ type: Date, default: new Date().toISOString })
  createdAt: string;

  @Prop({
    type: {
      likesCount: { type: Number, required: true },
      dislikesCount: { type: Number, required: true },
    },
    required: true,
  })
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
  };
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.loadClass(Comment);

//Types
export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument>;
