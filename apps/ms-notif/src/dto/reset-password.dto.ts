import { IsEmail, IsNumber, IsUrl, Min } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsUrl()
  resetUrl: string;

  @IsNumber()
  @Min(1)
  expiresInMinutes: number;
}
