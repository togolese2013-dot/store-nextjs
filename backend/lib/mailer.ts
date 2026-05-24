import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS   = process.env.RESEND_FROM || "onboarding@resend.dev";

let _client: Resend | null = null;

function getClient(): Resend {
  if (!_client) {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
    _client = new Resend(RESEND_API_KEY);
  }
  return _client;
}

export interface SendMailOptions {
  to:      string | string[];
  subject: string;
  html:    string;
  text?:   string;
}

export async function sendMail(opts: SendMailOptions): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("[mailer] RESEND_API_KEY not set — email skipped:", opts.subject);
    return;
  }
  const resend = getClient();
  const { error } = await resend.emails.send({
    from:    FROM_ADDRESS,
    to:      Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html:    opts.html,
    text:    opts.text,
  });
  if (error) {
    console.error("[mailer] Resend error:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}
