import { NextRequest, NextResponse } from 'next/server';

const GAS_URL = process.env.GAS_WEBHOOK_URL ?? '';

export async function POST(req: NextRequest) {
  const { lineUserId, encodedAnswers } = await req.json();
  if (!lineUserId || !GAS_URL) {
    return NextResponse.json({ ok: false, reason: 'missing' });
  }
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'line_register', lineUserId, encodedAnswers: encodedAnswers ?? '', createdAt: Date.now() }),
    });
    const data = await res.json();
    console.log('register lineUserId:', lineUserId.slice(0, 8), 'result:', data.success);
    return NextResponse.json({ ok: data.success ?? false });
  } catch (e) {
    console.error('register error:', e);
    return NextResponse.json({ ok: false });
  }
}
