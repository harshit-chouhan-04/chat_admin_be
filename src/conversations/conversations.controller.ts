import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConversationsService } from './providers/conversations.service';
import {
  ApiBody,
  ApiProperty,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Conversation } from './entities/conversation.entity';
import { Message } from 'src/messages/entities/message.entites';

class CreateConversationDto {
  @ApiProperty({ example: 'Late Night Feels' })
  title: string;

  @ApiProperty({ required: false, example: '67ca8e7d1d2b9f2c3a9c6e10' })
  user?: string;

  @ApiProperty({ required: false, example: '67ca8e7d1d2b9f2c3a9c6e10' })
  userId?: string;

  @ApiProperty({ required: false, example: '67ca8e7d1d2b9f2c3a9c6e11' })
  character?: string;

  @ApiProperty({ required: false, example: '67ca8e7d1d2b9f2c3a9c6e11' })
  characterId?: string;

  @ApiProperty({
    required: false,
    example: 'FEMALE',
    enum: ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'],
  })
  personaGender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';

  @ApiProperty({ required: false, example: 24, minimum: 18, maximum: 99 })
  personaAge?: number;

  @ApiProperty({ required: false, example: 'Riya' })
  personaName?: string;
}

class UpdateConversationPersonaDto {
  @ApiProperty({ example: 'Riya' })
  personaName: string;

  @ApiProperty({
    example: 'FEMALE',
    enum: ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'],
  })
  personaGender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';

  @ApiProperty({ example: 24, minimum: 18, maximum: 99 })
  personaAge: number;
}

class ConversationListQueryDto {
  @ApiProperty({ required: false, example: '67ca8e7d1d2b9f2c3a9c6e10' })
  userId?: string;
}

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a conversation for a selected user' })
  @ApiBody({ type: CreateConversationDto })
  @ApiOkResponse({ type: Conversation })
  create(@Body() body: CreateConversationDto) {
    return this.conversationsService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'List conversations, optionally filtered by user' })
  @ApiOkResponse({ type: [Conversation] })
  findAll(@Query() query: ConversationListQueryDto) {
    return this.conversationsService.findAll(query.userId);
  }

  @Get('characters')
  @ApiOperation({
    summary:
      'Get available characters with latest conversation mapping for a user',
  })
  getCharacters(@Query() query: ConversationListQueryDto) {
    return this.conversationsService.getCharacters(query.userId);
  }

  @Patch(':conversationId/persona')
  @ApiOperation({ summary: 'Update persona details for a conversation' })
  @ApiParam({ name: 'conversationId', type: String })
  @ApiBody({ type: UpdateConversationPersonaDto })
  updatePersona(
    @Param('conversationId') conversationId: string,
    @Body() body: UpdateConversationPersonaDto,
  ) {
    return this.conversationsService.updatePersona(conversationId, body);
  }

  @Sse(':conversationId/reply')
  @ApiOperation({
    summary: 'Stream AI reply for a selected conversation (SSE)',
  })
  @ApiParam({ name: 'conversationId', type: String })
  streamAi(
    @Param('conversationId') conversationId: string,
  ): Observable<MessageEvent> {
    return this.conversationsService.streamAiReply(conversationId);
  }

  @Get(':conversationId')
  @ApiOperation({ summary: 'Get messages for a selected conversation' })
  @ApiParam({ name: 'conversationId', type: String })
  @ApiOkResponse({ type: [Message] })
  getMessages(@Param('conversationId') conversationId: string) {
    return this.conversationsService.getMessages(conversationId);
  }
}
