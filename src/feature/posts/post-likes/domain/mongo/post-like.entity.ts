import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Model } from 'mongoose';
import { PostLikeStatus } from '../../api/models/input/post-like.input.model';

@Schema()
export class PostLike {
  @Prop({ type: ObjectId, required: true })
  _id: ObjectId;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  postId: string;

  @Prop({ type: String, enum: Object.values(PostLikeStatus), required: true })
  status: PostLikeStatus;

  @Prop({ type: String, required: true })
  addedAt: string;

  @Prop({ type: String, required: true })
  login: string;
}

export const PostLikeSchema = SchemaFactory.createForClass(PostLike);
PostLikeSchema.loadClass(PostLike);

//Types
export type PostLikeDocument = HydratedDocument<PostLike>;

export type PostLikeModelType = Model<PostLikeDocument>;
