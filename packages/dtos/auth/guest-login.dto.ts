import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GuestLoginDto {
  @ApiProperty({
    description: 'Display name for the guest user',
    example: 'Alice',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Display name must be at least 2 characters' })
  @MaxLength(50, { message: 'Display name must not exceed 50 characters' })
  displayName: string;
}

export class GuestLoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for the guest session',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'User ID of the guest',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  @ApiProperty({
    description: 'Display name of the guest',
    example: 'Alice',
  })
  displayName: string;
}
