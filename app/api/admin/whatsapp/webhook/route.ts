import { NextRequest, NextResponse } from "next/server";
import { getSetting, saveIncomingMessage } from "@/lib/admin-db";

/* ── GET — webhook verification (Meta handshake) ── */
export async function GET(req: NextRequest) {
  const mode       = req.nextUrl.searchParams.get("hub.mode");
  const token      = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge  = req.nextUrl.searchParams.get("hub.challenge");

  const myToken = await getSetting("wa_webhook_verify_token");

  if (mode === "subscribe" && token === myToken && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/* ── POST — incoming message from Meta ── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    for (const entry of body?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        const value    = change?.value;
        const contacts = value?.contacts ?? [];
        const messages = value?.messages ?? [];

        for (const msg of messages) {
          const contact = contacts.find((c: { wa_id: string }) => c.wa_id === msg.from);
          const name    = contact?.profile?.name ?? "";

          let content   = "";
          if (msg.type === "text")    content = msg.text?.body ?? "";
          else if (msg.type === "image")   content = "[Image]";
          else if (msg.type === "audio")   content = "[Audio]";
          else if (msg.type === "video")   content = "[Vidéo]";
          else if (msg.type === "document") content = "[Document]";
          else content = `[${msg.type}]`;

          await saveIncomingMessage({
            wa_message_id: msg.id,
            from_number:   msg.from,
            to_number:     value?.metadata?.display_phone_number ?? "",
            contact_name:  name,
            direction:     "in",
            type:          msg.type,
            content,
            media_url:     msg.image?.id ?? msg.audio?.id ?? "",
            status:        "received",
          });
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wa webhook]", err);
    return NextResponse.json({ ok: true }); // Always 200 to Meta
  }
}
