import { NextRequest, NextResponse } from 'next/server';

const GAS_URL = process.env.GAS_WEBHOOK_URL ?? '';
const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';

export async function POST(req: NextRequest) {
  const { encodedAnswers } = await req.json();
  if (!encodedAnswers || !GAS_URL || !ACCESS_TOKEN) {
    return NextResponse.json({ ok: false, reason: 'missing_params' });
  }

  // Ask GAS to claim the most recent unclaimed LINE user (within 30 min)
  let lineUserId: string | null = null;
  try {
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'line_claim' }),
    });
    const data = await gasRes.json();
    lineUserId = data.lineUserId ?? null;
  } catch {
    return NextResponse.json({ ok: false, reason: 'gas_error' });
  }

  if (!lineUserId) {
    return NextResponse.json({ ok: false, reason: 'no_user_found' });
  }

  const resultUrl = `https://sleep-brain.vercel.app/r?d=${encodedAnswers}`;
  const message = {
    type: 'text',
    text: `🌙 あなたの睡眠診断結果が届きました！\n\n以下のリンクから詳細な診断レポートをご確認ください👇\n\n${resultUrl}\n\n※このリンクはあなた専用です。`,
  };

  try {
    const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ to: lineUserId, messages: [message] }),
    });
    const lineData = await lineRes.json();
    if (!lineRes.ok) {
      console.error('LINE push error:', lineData);
      return NextResponse.json({ ok: false, reason: 'line_api_error', detail: lineData });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, reason: 'line_fetch_error' });
  }

  return NextResponse.json({ ok: true, lineUserId });
}
