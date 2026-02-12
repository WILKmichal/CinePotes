import { baseTemplate } from './base.template';

describe('baseTemplate', () => {
  // Verifie que le wrapper HTML contient bien le contenu passe en parametre
  it('should wrap content in CinePotes HTML layout', () => {
    const html = baseTemplate('<p>Hello</p>');

    expect(html).toContain('<p>Hello</p>');
  });

  // Verifie la presence du header avec le nom CinePotes
  it('should include the CinePotes header', () => {
    const html = baseTemplate('<p>Test</p>');

    expect(html).toContain('CinéPotes');
  });

  // Verifie la presence du footer
  it('should include the footer', () => {
    const html = baseTemplate('<p>Test</p>');

    expect(html).toContain('Tous droits réservés');
    expect(html).toContain('merci de ne pas répondre');
  });

  // Verifie que le HTML est bien structure (doctype, body)
  it('should be valid HTML structure', () => {
    const html = baseTemplate('<p>Test</p>');

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html>');
    expect(html).toContain('</html>');
  });
});
