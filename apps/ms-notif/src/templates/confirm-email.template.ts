import { baseTemplate } from "./base.template";

export function confirmEmailTemplate(nom: string, confirmUrl: string): string {
  return baseTemplate(`
    <h2>Bienvenue ${nom}</h2>
    <p>Merci de confirmer votre email :</p>
    <a href="${confirmUrl}">Confirmer mon email</a>
  `);
}
