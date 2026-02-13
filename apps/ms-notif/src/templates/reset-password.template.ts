import { baseTemplate } from "./base.template";

export function resetPasswordTemplate(
  resetUrl: string,
  expiresInMinutes: number,
): string {
  return baseTemplate(`
    <h2>Réinitialisation du mot de passe</h2>
    <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe.</p>
    <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
    <p>Ce lien expire dans ${expiresInMinutes} minutes.</p>
  `);
}
