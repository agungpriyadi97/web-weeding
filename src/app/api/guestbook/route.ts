import { NextResponse } from 'next/server';
import { getGuestbook, addGuestbookEntry } from '@/utils/db';

export async function GET() {
  try {
    const messages = await getGuestbook();
    return NextResponse.json(messages);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.guest_name || !body.message) {
      return NextResponse.json({ error: 'Name and Message are required.' }, { status: 400 });
    }
    const entry = await addGuestbookEntry(body);
    return NextResponse.json(entry);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
