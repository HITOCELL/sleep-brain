import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, step, sessionId, userAgent } = body as {
      event: string;
      step?: number;
      sessionId: string;
      userAgent?: string;
    };

    if (!event || !sessionId) {
      return NextResponse.json({ success: false, error: 'invalid_params' }, { status: 400 });
    }

    const now = new Date();
    const timestamp = now.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).replace(/\//g, '-');

    const payload = {
      type: 'tracking',
      timestamp,
      sessionId,
      event,
      step: step ?? '',
      userAgent: userAgent ?? '',
    };

    const gasUrl = process.env.GAS_WEBHOOK_URL;
    if (gasUrl) {
      const gasRes = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch((e) => { console.error('GAS fetch error:', e); return null; });
      if (gasRes) {
        const gasText = await gasRes.text().catch(() => '');
        console.log('GAS response:', gasRes.status, gasText.slice(0, 200));
      }
    } else {
      console.warn('GAS_WEBHOOK_URL is not set');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('track error:', err);
    return NextResponse.json({ success: false, error: 'internal' }, { status: 500 });
  }
}
