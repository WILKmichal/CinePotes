import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinSeanceDto {
  @ApiProperty({ example: 'ABC123', description: 'Code unique de la séance à rejoindre (6 caractères)' })
  @IsString()
  @Length(6, 6)
  code: string;
}
