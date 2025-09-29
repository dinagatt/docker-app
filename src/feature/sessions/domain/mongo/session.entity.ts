import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema()
export class Session {
  @Prop({ type: ObjectId, required: true })
  _id: ObjectId;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  deviceId: string;

  @Prop({ type: String, required: true })
  deviceName: string;

  @Prop({ type: String, required: true })
  ip: string;

  @Prop({ type: Date, required: true })
  iat: Date;

  @Prop({ type: Date, required: true })
  exp: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.loadClass(Session);

//Types
export type SessionDocument = HydratedDocument<Session>;

export type SessionModelType = Model<SessionDocument>;
