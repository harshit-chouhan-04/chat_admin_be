import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MessagesService } from './providers/messages.service';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Message } from './entities/message.entites';
import { CreateMessageDto } from './dtos/create-message.dto';

@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a user-side message in a selected conversation',
  })
  @ApiBody({ type: CreateMessageDto })
  @ApiCreatedResponse({ type: Message })
  send(@Body() body: CreateMessageDto) {
    return this.messageService.createUserMessage(body);
  }

  @Get(':chatId')
  @ApiOperation({ summary: 'Get all messages for a selected conversation' })
  @ApiParam({ name: 'chatId', type: String })
  @ApiOkResponse({ type: [Message] })
  get(@Param('chatId') chatId: string) {
    return this.messageService.getByChat(chatId);
  }
}
