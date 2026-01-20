import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendMailDto {
  @ApiProperty({
    description: 'Adresse email du destinataire',
    example: 'utilisateur@example.com',
  })
  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  @IsNotEmpty({ message: "L'adresse email est obligatoire" })
  email: string;

  @ApiProperty({
    description: "Sujet de l'email",
    example: 'Invitation Cinepote',
  })
  @IsString({ message: 'Le sujet doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le sujet est obligatoire' })
  subject: string;

  @ApiProperty({
    description: "Contenu HTML de l'email (sans balises html/body)",
    example: `
        <h1>🎉 Vous êtes invité !</h1>
        <p>Bonjour,</p>
        <p>Nous avons le plaisir de vous inviter à une séance de xxxxxxxxx. Cliquez sur le bouton ci-dessous pour confirmer votre participation.</p>
        <a href="https://example.com/invitation?token=abc123" class="button">Participé</a>
    `,
  })
  @IsString({ message: 'Le contenu doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le contenu est obligatoire' })
  content: string;
}
