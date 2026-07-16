import { NextResponse } from 'next/server';
import { addAnalyticsLog, getAnalyticsLogs } from '@/utils/db';

export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referrer = request.headers.get('referer') || 'Direct';
    
    // Simple parsing logic for lighweight analytics
    let browser = 'Other';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    let device = 'Desktop';
    if (/mobile/i.test(userAgent)) device = 'Mobile';
    else if (/tablet/i.test(userAgent)) device = 'Tablet';

    const body = await request.json().catch(() => ({}));
    const page_path = body.page_path || '/';
    const country = request.headers.get('x-vercel-ip-country') || 'Indonesia';

    const log = await addAnalyticsLog({
      browser,
      device,
      country,
      referrer,
      page_path
    });

    return NextResponse.json(log);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
export async function GET() {
  try {
    const logs = await getAnalyticsLogs();
    return NextResponse.json(logs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
