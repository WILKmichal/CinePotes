import { confirmEmailTemplate } from './confirm-email.template';

describe('confirmEmailTemplate', () => {
  // Verifie que le nom de l'utilisateur apparait dans le HTML
  it('should include the user name', () => {
    const html = confirmEmailTemplate('Jean', 'http://localhost/confirm');

    expect(html).toContain('Bienvenue Jean');
  });

  // Verifie que le lien de confirmation est present
  it('should include the confirmation URL', () => {
    const html = confirmEmailTemplate('Jean', 'http://localhost/confirm?token=abc');

    expect(html).toContain('href="http://localhost/confirm?token=abc"');
  });

  // Verifie que le template utilise bien le wrapper CinePotes
  it('should be wrapped in CinePotes base template', () => {
    const html = confirmEmailTemplate('Jean', 'http://localhost/confirm');

    expect(html).toContain('CinéPotes');
    expect(html).toContain('<!DOCTYPE html>');
  });
});
