import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import { ConfirmEmailDto } from './confirm-email.dto';
import { ForgotPasswordDto } from './forgot-password.dto';
import { ResetPasswordDto } from './reset-password.dto';
import { UpdateNameDto } from './update-name.dto';
import { GuestLoginDto } from './guest-login.dto';

export interface LoginPayload extends LoginDto {}

export interface RegisterPayload extends RegisterDto {}

export interface ConfirmEmailPayload extends ConfirmEmailDto {}

export interface ForgotPasswordPayload extends ForgotPasswordDto {}

export interface ResetPasswordPayload extends ResetPasswordDto {}

export interface GuestLoginPayload extends GuestLoginDto {}

export interface VerifyTokenPayload {
  token: string;
}

export interface MePayload {
  userId: string;
}

export interface UpdateNamePayload extends UpdateNameDto {
  userId: string;
}

export interface DeleteMePayload {
  userId: string;
}