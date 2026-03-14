import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAdminDto } from '../dtos/create-admin.dto';
import { Admin, AdminDocument } from '../entities/admin.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
  ) {}
  async getAdmin(email: string) {
    return this.adminModel.findOne({
      email,
      isActive: true,
    });
  }

  async getAdminById(id: string) {
    const admin = await this.adminModel.findOne({
      _id: id,
      isActive: true,
    });
    return admin;
  }

  async createAdmin(dto: CreateAdminDto) {
    const admin = await this.adminModel.create({
      ...dto,
    });
    return admin.toObject();
  }
}
