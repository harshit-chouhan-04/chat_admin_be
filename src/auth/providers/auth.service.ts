import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminService } from 'src/admin/providers/admin.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private adminService: AdminService,
  ) {}
  async login(email: string, password: string) {
    const admin = await this.adminService.getAdmin(email);
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: admin._id, email: admin.email };
    const adminObject = admin.toObject() as {
      [key: string]: any;
      password?: string;
    };
    delete adminObject.password;
    return {
      ...adminObject,
      token: this.jwtService.sign(payload),
    };
  }

  async getProfile(adminId: string) {
    const admin = await this.adminService.getAdminById(adminId);
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }
    const adminObject = admin.toObject() as {
      [key: string]: any;
      password?: string;
    };
    delete adminObject.password;
    return adminObject;
  }
}
