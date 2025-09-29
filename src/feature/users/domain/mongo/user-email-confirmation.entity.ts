import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class UserEmailConfirmation {
  @Prop({ type: ObjectId, required: true })
  _id: ObjectId;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  confirmationCode: string;

  @Prop({ type: Date, default: new Date().toISOString })
  expirationDate: string;
}

export const UserEmailConfirmationSchema = SchemaFactory.createForClass(
  UserEmailConfirmation,
);

// Types
export type UserEmailConfirmationDocument =
  HydratedDocument<UserEmailConfirmation>;

export type UserEmailConfirmationModelType =
  Model<UserEmailConfirmationDocument>;
