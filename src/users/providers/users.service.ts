// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../entities/user.entity';
import { Conversation } from 'src/conversations/entities/conversation.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
  ) {}

  async create(data: {
    name?: string;
    email: string;
    mobile?: string;
    username?: string;
    passwordHash?: string;
  }) {
    const baseUsername = data.name
      ? data.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      : data.email.split('@')[0];

    // Keep trying until we find a unique username
    let username = baseUsername;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const existingUser = await this.userModel.findOne({ username });

      if (existingUser) {
        username = `${baseUsername}${counter}`;
        counter++;
      } else {
        isUnique = true;
      }
    }
    return this.userModel.create({
      ...data,
      username,
      chats: [],
      numberOfMessageLeft: 5,
    });
  }

  findAll() {
    return this.userModel.find();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  findByEmailForAuth(email: string) {
    return this.userModel.findOne({ email }).select('+passwordHash');
  }

  findOne(id: string) {
    return this.userModel.findById(id);
  }

  updateById(id: string, data: Partial<User>) {
    return this.userModel.findByIdAndUpdate(id, data, { new: true });
  }

  async addChatToUser(userId: string, chatId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { chats: chatId } },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserChats(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.chats || user.chats.length === 0) {
      return [];
    }

    return this.conversationModel
      .find({ _id: { $in: user.chats } })
      .sort({ updatedAt: -1 });
  }
}
