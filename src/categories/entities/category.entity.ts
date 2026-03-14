import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Category {
  @ApiProperty({ example: 'Romantic' })
  @Prop({ required: true, unique: true })
  name: string;

  @ApiProperty({ example: 'romantic' })
  @Prop({ required: true, unique: true })
  slug: string;

  @ApiProperty({ example: false })
  @Prop({ required: true })
  isNsfw: boolean;

  @ApiProperty({ example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  @Prop({ default: false })
  isDeleted: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
