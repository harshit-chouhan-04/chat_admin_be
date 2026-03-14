import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true })
  firstname: string;

  @Prop({ required: false })
  lastname: string;

  @Prop({ required: false })
  email: string;

  @Prop({ required: true })
  mobileNo: string;

  @Prop({ require: true })
  password: string;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
