// Wrapper HTML CinéPotes : header avec logo + footer
export function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:20px; font-family:Arial,sans-serif; background-color:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto;">

    <!-- Header -->
    <tr>
      <td style="background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:20px; text-align:center;">
        <img
          src="https://img.icons8.com/?size=100&id=11860&format=png&color=4F46E5"
          alt="CinePotes" width="32" height="32"
          style="vertical-align:middle; margin-right:8px;"
        >
        <span style="color:#2563eb; font-size:20px; font-weight:700; vertical-align:middle;">
          CinéPotes
        </span>
      </td>
    </tr>

    <tr><td height="16"></td></tr>

    <!-- Contenu -->
    <tr>
      <td style="background:#fff; border-radius:16px; padding:24px;">
        ${content}
      </td>
    </tr>

    <tr><td height="16"></td></tr>

    <!-- Footer -->
    <tr>
      <td style="text-align:center; padding:16px; color:#6b7280; font-size:12px;">
        &copy; 2025 CinéPotes - Tous droits réservés<br>
        Email automatique, merci de ne pas répondre.
      </td>
    </tr>

  </table>
</body>
</html>`;
}
