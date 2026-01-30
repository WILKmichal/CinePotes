import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';


export class RegisterDto {
    @ApiProperty({ example: 'Jean Dupont', required: false })
    @IsOptional()
    @IsString()
    nom?: string;


    @ApiProperty({ example: 'user@email.com' })
    @IsEmail({}, { message: "Email invalide" })
    @IsNotEmpty()
    email: string;


    @ApiProperty({ example: 'password123' })
    @IsString()
    @MinLength(4)
    password: string;


    @ApiProperty({ example: 'user', required: false })
    @IsOptional()
    @IsString()
    role?: string;
}