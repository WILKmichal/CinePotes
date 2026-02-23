import { resetPasswordTemplate } from "./reset-password.template";

describe("resetPasswordTemplate", () => {
  // Verifie que le lien de reset est present
  it("should include the reset URL", () => {
    const html = resetPasswordTemplate("http://localhost/reset?token=xyz", 30);

    expect(html).toContain('href="http://localhost/reset?token=xyz"');
  });

  // Verifie que la duree d'expiration apparait
  it("should include the expiration time", () => {
    const html = resetPasswordTemplate("http://localhost/reset", 45);

    expect(html).toContain("45 minutes");
  });

  // Verifie que le template utilise bien le wrapper CinePotes
  it("should be wrapped in CinePotes base template", () => {
    const html = resetPasswordTemplate("http://localhost/reset", 30);

    expect(html).toContain("CinéPotes");
    expect(html).toContain("Réinitialisation du mot de passe");
  });
});
