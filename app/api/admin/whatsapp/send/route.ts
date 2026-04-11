import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getSetting } from "@/lib/admin-db";

interface SendTextPayload {
  to:      string;
  message: string;
}

interface BroadcastPayload {
  numbers: string[];
  message: string;
}

/* POST /api/admin/whatsapp/send */
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  try {
    const body = await req.json();

    const phoneId = await getSetting("wa_phone_number_id");
    const token   = await getSetting("wa_access_token");

    if (!phoneId || !token) {
      return NextResponse.json({ error: "WhatsApp API non configuré. Allez dans Réglages → WhatsApp API." }, { status: 400 });
    }

    /* Single message */
    if (body.to) {
      const { to, message } = body as SendTextPayload;
      const result = await sendMessage(phoneId, token, to, message);
      return NextResponse.json(result);
    }

    /* Broadcast to multiple numbers */
    if (body.numbers) {
      const { numbers, message } = body as BroadcastPayload;
      const results = await Promise.allSettled(
        numbers.map(n => sendMessage(phoneId, token, n, message))
      );
      const succeeded = results.filter(r => r.status === "fulfilled").length;
      const failed    = results.length - succeeded;
      return NextResponse.json({ succeeded, failed, total: results.length });
    }

    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  } catch (err) {
    console.error("[wa send]", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}

async function sendMessage(phoneId: string, token: string, to: string, text: string) {
  const number = to.replace(/\D/g, "");
  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type:    "individual",
      to:                number,
      type:              "text",
      text:              { preview_url: false, body: text },
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
