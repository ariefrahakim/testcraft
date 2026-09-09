import { NextResponse } from "next/server";

// Landing-page registration endpoint.
// In production: persist to Prisma `Lead` model + send email via Resend
// + notify the sales team on WhatsApp.
export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, phone, interest } = body ?? {};
  if (!name || (!email && !phone)) {
    return NextResponse.json(
      { ok: false, error: "Name and email/phone are required" },
      { status: 400 }
    );
  }
  // await prisma.lead.create({ data: { name, email, phone, interest } });
  // await resend.emails.send({ to: email, subject: "Welcome to TestCraft!", ... });
  console.log("New lead:", { name, email, phone, interest });
  return NextResponse.json({ ok: true });
}
