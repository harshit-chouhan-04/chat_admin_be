// src/users/users.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Conversation } from 'src/conversations/entities/conversation.entity';

import { User } from './entities/user.entity';
import { UsersService } from './providers/users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users for admin review' })
  @ApiOkResponse({
    description: 'List of platform users',
    type: [User],
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id/chats')
  @ApiOperation({ summary: 'Get all conversations for a selected user' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'List of user conversations',
    type: [Conversation],
  })
  getUserChats(@Param('id') id: string) {
    return this.usersService.getUserChats(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'User details', type: User })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
