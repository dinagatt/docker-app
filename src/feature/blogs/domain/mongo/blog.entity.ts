import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema()
export class Blog {
  @Prop({ type: ObjectId, required: true })
  _id: ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: true })
  websiteUrl: string;

  @Prop({ type: Date, default: new Date().toISOString })
  createdAt: string;

  @Prop({ type: Boolean, required: true })
  isMembership: boolean;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.loadClass(Blog);

// Types
export type BlogDocument = HydratedDocument<Blog>;

type BlogModelStaticType = {
  createBlog: (
    name: string,
    description: string,
    websiteUrl: string,
  ) => BlogDocument;
};

export type BlogModelType = Model<BlogDocument>; //& BlogModelStaticType;
