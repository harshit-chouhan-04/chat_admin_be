import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { QueryUsersDto } from './dtos/query-users.dto';
import { UpdateNumberOfMessageLeftDto } from './dtos/update-number-of-message-left.dto';
import { UsersService } from './providers/users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users with pagination and search' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user profile with stats' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/number-of-message-left')
  @ApiOperation({ summary: 'Update number of messages left for a user' })
  @ApiParam({ name: 'id', type: String })
  updateNumberOfMessageLeft(
    @Param('id') id: string,
    @Body() dto: UpdateNumberOfMessageLeftDto,
  ) {
    return this.usersService.updateNumberOfMessageLeft(
      id,
      dto.numberOfMessageLeft,
    );
  }
}
