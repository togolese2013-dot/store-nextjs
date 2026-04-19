import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    // Redirect back with error if not configured
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    return NextResponse.redirect(`${siteUrl}/?auth=google-not-configured`);
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/account/google/callback`;
  const url         = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id",     clientId);
  url.searchParams.set("redirect_uri",  redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope",         "openid email profile");
  url.searchParams.set("access_type",   "online");

  return NextResponse.redirect(url.toString());
}
