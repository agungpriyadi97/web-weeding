import { NextResponse } from 'next/server';
import { getRSVPs, addRSVP } from '@/utils/db';

export async function GET() {
  try {
    const rsvps = await getRSVPs();
    return NextResponse.json(rsvps);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.guest_name || body.attendance === undefined) {
      return NextResponse.json({ error: 'Name and Attendance are required.' }, { status: 400 });
    }
    const rsvp = await addRSVP(body);
    return NextResponse.json(rsvp);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
