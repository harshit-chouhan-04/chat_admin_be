import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './providers/auth.service';
import { AdminModule } from 'src/admin/admin.module';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [AdminModule, SharedModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
