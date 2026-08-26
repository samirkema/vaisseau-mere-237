import { Resend } from 'resend';

// Initialisation lazy pour éviter une exception au chargement du module lors
// du build Next.js quand RESEND_API_KEY n'est pas définie (ex: CI, preview).
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('[email] RESEND_API_KEY is not set — cannot send email');
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? 'Vaisseau Manga 237 <noreply@vaisseaumanga237.io>';

// Alerte l'administrateur qu'un paiement crypto est arrivé SANS que la commande
// puisse être complétée (sous-paiement, prix incohérent). Sans cet e-mail, le
// refus n'existerait que dans les journaux serveur : le client aurait envoyé de
// l'argent et personne, côté vendeur, ne le saurait.
export async function sendUnderpaidOrderAlert(opts: {
  adminEmail:    string;
  orderId:       string;
  tableauTitle:  string;
  expectedEur:   number;
  reason:        string;
  customerEmail: string | null;
}) {
  const date = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  return getResend().emails.send({
    from:    FROM,
    to:      opts.adminEmail,
    subject: `⚠️ Paiement incomplet — commande ${opts.orderId.slice(0, 8)}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="color:#b45309;margin-bottom:8px">Paiement incomplet</h1>
        <p>Un paiement crypto est arrivé mais la commande <strong>n'a pas été complétée</strong>.
           Aucun e-mail de confirmation n'a été envoyé à l'acheteur.</p>
        <table style="border-collapse:collapse;width:100%;margin-top:16px;font-size:14px">
          <tr><td style="padding:6px 0;color:#6b7280">Commande</td><td><code>${escapeHtml(opts.orderId)}</code></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Œuvre</td><td>${escapeHtml(opts.tableauTitle)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Montant attendu</td><td><strong>${opts.expectedEur} €</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Acheteur</td><td>${escapeHtml(opts.customerEmail ?? '—')}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Motif</td><td>${escapeHtml(opts.reason)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Reçu le</td><td>${date}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px;margin-top:20px">
          La commande est marquée <code>underpaid</code>. Si l'acheteur complète son
          paiement, elle repassera automatiquement en <code>completed</code>.
          Sinon, un remboursement ou une relance est à décider manuellement.
        </p>
      </div>
    `,
  });
}

export async function sendPaymentReceipt(opts: {
  to:          string;
  pseudo:      string;
  amountEur:   number;
  paymentRef:  string | null;
  expiresAt:   Date;
}) {
  const expires = opts.expiresAt.toLocaleDateString('fr-FR', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  });

  return getResend().emails.send({
    from:    FROM,
    to:      opts.to,
    subject: `Reçu Vaisseau Manga 237 — ${opts.amountEur.toFixed(2)} €`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="color:#4f46e5;margin-bottom:8px">Reçu de paiement</h1>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#6b7280">Client</td><td style="padding:8px 0;font-weight:600">${escapeHtml(opts.pseudo)}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Montant</td><td style="padding:8px 0;font-weight:600">${opts.amountEur.toFixed(2)} €</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Référence</td><td style="padding:8px 0;font-family:monospace;font-size:13px">${opts.paymentRef ?? '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Accès jusqu'au</td><td style="padding:8px 0;font-weight:600">${expires}</td></tr>
        </table>
        <p style="color:#9ca3af;font-size:12px;margin-top:32px">
          Vaisseau Manga 237 — conservez cet email comme justificatif.
        </p>
      </div>
    `,
  });
}

export async function sendTableauOrderToAdmin(opts: {
  adminEmail:    string;
  tableauTitle:  string;
  format:        string;
  amountEur:     number;
  customerEmail: string | null;
  customerName:  string | null;
  paymentRef:    string | null;
}) {
  const date = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  return getResend().emails.send({
    from:    FROM,
    to:      opts.adminEmail,
    subject: `💰 Nouvelle commande — ${opts.tableauTitle} (${opts.amountEur.toFixed(2)} €)`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="color:#f97316;margin-bottom:8px">Nouvelle commande tableau</h1>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#6b7280;width:140px">Tableau</td><td style="padding:8px 0;font-weight:700">${escapeHtml(opts.tableauTitle)}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Format</td><td style="padding:8px 0">${escapeHtml(opts.format)}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Montant</td><td style="padding:8px 0;font-weight:700;color:#f97316">${opts.amountEur.toFixed(2)} €</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Acheteur</td><td style="padding:8px 0">${escapeHtml(opts.customerName ?? '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0">${escapeHtml(opts.customerEmail ?? '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Référence</td><td style="padding:8px 0;font-family:monospace;font-size:12px">${opts.paymentRef ?? '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Date</td><td style="padding:8px 0">${date}</td></tr>
        </table>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">Prépare l'expédition et contacte l'acheteur.</p>
      </div>
    `,
  });
}

export async function sendTableauOrderConfirmation(opts: {
  to:           string;
  customerName: string | null;
  tableauTitle: string;
  format:       string;
  amountEur:    number;
  paymentRef:   string | null;
}) {
  return getResend().emails.send({
    from:    FROM,
    to:      opts.to,
    subject: `Commande confirmée — ${opts.tableauTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="color:#f97316;margin-bottom:8px">Merci pour votre commande !</h1>
        <p>Bonjour ${escapeHtml(opts.customerName ?? 'cher client')},</p>
        <p>Votre commande a bien été reçue. Nous vous contacterons pour organiser l'expédition.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#6b7280;width:140px">Tableau</td><td style="padding:8px 0;font-weight:700">${escapeHtml(opts.tableauTitle)}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Format</td><td style="padding:8px 0">${escapeHtml(opts.format)}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Montant payé</td><td style="padding:8px 0;font-weight:700">${opts.amountEur.toFixed(2)} €</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Référence</td><td style="padding:8px 0;font-family:monospace;font-size:12px">${opts.paymentRef ?? '—'}</td></tr>
        </table>
        <p style="color:#9ca3af;font-size:12px;margin-top:32px">Conservez cet email comme justificatif.</p>
      </div>
    `,
  });
}

// Échappe les caractères HTML pour éviter l'injection dans les templates email
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
