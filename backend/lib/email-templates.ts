// Transactional email templates

const BRAND_COLOR = "#6366f1"; // indigo-500

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND_COLOR};padding:28px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">ShopSaaS</span>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px 28px;">${body}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              ShopSaaS · Votre boutique en ligne, simplement<br/>
              Pour toute question : <a href="mailto:support@togolese.tg" style="color:${BRAND_COLOR};">support@togolese.tg</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Welcome email sent after successful onboarding.
 */
export function welcomeShopEmail(opts: {
  adminNom:    string;
  shopNom:     string;
  shopSlug:    string;
  adminUrl:    string;
  loginUrl:    string;
  plan:        string;
}): { subject: string; html: string; text: string } {
  const { adminNom, shopNom, shopSlug, adminUrl, loginUrl, plan } = opts;
  const planLabel = plan === "pro" ? "Pro" : plan === "basic" ? "Basic" : "Gratuit";

  const html = base(
    `Bienvenue sur ShopSaaS — ${shopNom}`,
    `
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Bienvenue, ${adminNom} 👋</h1>
    <p style="margin:0 0 24px;font-size:16px;color:#6b7280;">Votre boutique <strong>${shopNom}</strong> est prête !</p>

    <table width="100%" cellpadding="12" style="background:#f9fafb;border-radius:8px;margin-bottom:28px;border:1px solid #e5e7eb;">
      <tr>
        <td style="font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Nom de la boutique</td>
        <td style="font-size:14px;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;">${shopNom}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Identifiant (slug)</td>
        <td style="font-size:14px;color:#111827;font-family:monospace;border-bottom:1px solid #e5e7eb;">${shopSlug}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#6b7280;">Plan</td>
        <td style="font-size:14px;color:#111827;font-weight:600;">${planLabel}</td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-size:14px;color:#374151;">Connectez-vous à votre interface admin pour commencer à gérer vos produits, ventes et clients.</p>

    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td>
          <a href="${loginUrl}"
             style="display:inline-block;background:${BRAND_COLOR};color:#fff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
            Accéder à mon admin →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#9ca3af;">
      URL directe : <a href="${adminUrl}" style="color:${BRAND_COLOR};">${adminUrl}</a>
    </p>
    `
  );

  const text = `Bienvenue ${adminNom} !

Votre boutique "${shopNom}" (${shopSlug}) est prête sur le plan ${planLabel}.

Connectez-vous ici : ${loginUrl}

Pour toute aide : support@togolese.tg`;

  return { subject: `🎉 Votre boutique ${shopNom} est prête — ShopSaaS`, html, text };
}
