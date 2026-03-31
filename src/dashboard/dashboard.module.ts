import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Conversation,
  ConversationSchema,
} from 'src/conversations/entities/conversation.entity';
import { Invoice, InvoiceSchema } from 'src/invoices/entities/invoice.entity';
import { Message, MessageSchema } from 'src/messages/entities/message.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './providers/dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
