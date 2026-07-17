import { NextResponse } from 'next/server';
import { getGuestbook, addGuestbookEntry, toggleGuestbookApproval, deleteGuestbookEntry } from '@/utils/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const messages = await getGuestbook(all);
    return NextResponse.json(messages);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.id !== undefined) {
      const success = await toggleGuestbookApproval(body.id, body.is_approved);
      return NextResponse.json({ success });
    }
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    }
    const success = await deleteGuestbookEntry(id);
    return NextResponse.json({ success });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
