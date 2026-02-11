export function pageReiniMotDePasse(
  resetUrl: string,
  expiresInMinutes: number,
): string {
  return `
<div class='p-6 text-center'>
  <h2 class='text-xl font-bold mb-4'>
    Réinitialisation du mot de passe
  </h2>

  <p class='mb-6'>
    Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe.
  </p>

  <a
    href='${resetUrl}'
    class='inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold'
  >
    Réinitialiser mon mot de passe
  </a>

  <p class='mt-6 text-sm text-gray-500'>
    Ce lien expire dans ${expiresInMinutes} minutes.
  </p>
</div>
`;
}
