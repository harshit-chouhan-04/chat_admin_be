import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  ONE_TIME = 'one_time',
}

export type PlanDocument = HydratedDocument<Plan>;

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, type: String, enum: BillingCycle })
  billingCycle: BillingCycle;

  @Prop({ required: true, min: 0 })
  credits: number;

  @Prop({ required: true, min: 0 })
  messageLimit: number;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);

PlanSchema.index({ name: 1 });
PlanSchema.index({ isActive: 1, createdAt: -1 });
