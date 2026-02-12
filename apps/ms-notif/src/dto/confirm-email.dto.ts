import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class ConfirmEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsUrl()
  confirmUrl: string;
}
