import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SENDER_TYPE } from 'src/common/enums/sender-type.enum';

export class QueryMessagesDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  conversation?: string;

  @ApiPropertyOptional({ enum: SENDER_TYPE })
  @IsOptional()
  @IsEnum(SENDER_TYPE)
  senderType?: SENDER_TYPE;
}
