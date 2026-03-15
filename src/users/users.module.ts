import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice, InvoiceSchema } from 'src/invoices/entities/invoice.entity';
import { Message, MessageSchema } from 'src/messages/entities/message.entity';
import { Plan, PlanSchema } from 'src/plans/entities/plan.entity';
import { User, UserSchema } from './entities/user.entity';
import { UsersController } from './users.controller';
import {
  Conversation,
  ConversationSchema,
} from 'src/conversations/entities/conversation.entity';
import { UsersService } from './providers/users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
