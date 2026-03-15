import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay',
  PAYPAL = 'paypal',
  OTHER = 'other',
}

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true, unique: true, trim: true })
  invoiceId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Plan', required: true, index: true })
  plan: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, min: 0 })
  numberOfMessages: number;

  @Prop({ required: true, min: 0 })
  credits: number;

  @Prop({ required: true, uppercase: true, trim: true })
  currency: string;

  @Prop({ required: true, type: String, enum: InvoiceStatus, index: true })
  status: InvoiceStatus;

  @Prop({
    required: true,
    type: String,
    enum: PaymentProvider,
  })
  paymentProvider: PaymentProvider;

  @Prop()
  paidAt?: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.index({ user: 1, status: 1, createdAt: -1 });
