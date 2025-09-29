import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Model } from 'mongoose';
import { CommentLikeStatus } from '../../api/models/input/comment-like.input.model';

@Schema()
export class CommentLike {
  @Prop({ type: ObjectId, required: true })
  _id: ObjectId;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  commentId: string;

  @Prop({
    type: String,
    enum: Object.values(CommentLikeStatus),
    required: true,
  })
  status: CommentLikeStatus;
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike);
CommentLikeSchema.loadClass(CommentLike);

//Types
export type CommentLikeDocument = HydratedDocument<CommentLike>;

export type CommentLikeModelType = Model<CommentLikeDocument>;
