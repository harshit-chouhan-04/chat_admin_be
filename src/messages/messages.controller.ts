import { Body, Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { QueryMessagesDto } from './dtos/query-messages.dto';
import { MessagesService } from './providers/messages.service';

@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'List messages with pagination and filters' })
  findAll(@Query() query: QueryMessagesDto) {
    return this.messageService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a message by id' })
  @ApiParam({ name: 'id', type: String })
  get(@Param('id') id: string) {
    return this.messageService.findOne(id);
  }
}
