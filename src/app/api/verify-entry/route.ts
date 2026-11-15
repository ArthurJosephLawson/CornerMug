import { NextResponse } from "next/server";
import { validateEntryRequest } from "@/lib/entryValidation";
import { hasGmailMxRecords } from "@/lib/gmailDns";
import type { EntryRequest, EntryResponse, SessionData } from "@/types/entry";

export async function POST(request: Request): Promise<NextResponse<EntryResponse>> {
  let body: EntryRequest;
  try {
    body = (await request.json()) as EntryRequest;
  } catch {
    return NextResponse.json({ ok: false, errors: ["Invalid request body."] }, { status: 400 });
  }

  const errors = validateEntryRequest(body);
  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const gmailReachable = await hasGmailMxRecords();
  if (!gmailReachable) {
    return NextResponse.json(
      { ok: false, errors: ["Gmail mail servers unreachable."] },
      { status: 400 },
    );
  }

  const session: SessionData = {
    gmail: body.gmail.toLowerCase(),
    username: body.username,
    token: crypto.randomUUID(),
    joinedAt: new Date().toISOString(),
  };

  return NextResponse.json({ ok: true, session }, { status: 200 });
}
