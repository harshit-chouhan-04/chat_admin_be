import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ description: 'First name of the admin user' })
  @IsNotEmpty()
  @IsString()
  firstname: string;

  @ApiProperty({ description: 'Last name of the admin user' })
  @IsNotEmpty()
  @IsString()
  lastname: string;

  @ApiProperty({ description: 'Mobile number of the admin user' })
  @IsNotEmpty()
  @IsString()
  mobileNo: string;

  @ApiProperty({ description: 'Email address of the admin user' })
  @IsEmail()
  @IsString()
  email: string;

  @ApiPropertyOptional({
    description: 'Is the admin user active?',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Password of the admin user', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
