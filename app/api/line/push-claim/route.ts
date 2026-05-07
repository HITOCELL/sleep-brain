import { NextRequest, NextResponse } from 'next/server';

const GAS_URL = process.env.GAS_WEBHOOK_URL ?? '';
const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';

export async function POST(req: NextRequest) {
  const { encodedAnswers } = await req.json();

  if (!ACCESS_TOKEN || !GAS_URL || !encodedAnswers) {
    return NextResponse.json({ ok: false, reason: 'missing_params' });
  }

  // encodedAnswersからlineUserIdをGASで逆引き
  let lineUserId = '';
  try {
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'line_get_by_answers', encodedAnswers }),
    });
    const gasData = await gasRes.json();
    lineUserId = gasData.lineUserId ?? '';
    console.log('push-claim: GAS lookup result:', gasData.success, 'userId:', lineUserId ? lineUserId.slice(0, 8) + '...' : 'none');
  } catch (e) {
    console.error('push-claim: GAS error:', e);
    return NextResponse.json({ ok: false, reason: 'gas_error' });
  }

  if (!lineUserId) {
    return NextResponse.json({ ok: false, reason: 'no_user' });
  }

  const resultUrl = `https://sleep-brain.vercel.app/r?d=${encodedAnswers}`;
  const body = JSON.stringify({
    to: lineUserId,
    messages: [{
      type: 'text',
      text: `🌙 あなたの睡眠診断結果が届きました！\n\n以下のリンクからいつでも結果を確認できます👇\n\n${resultUrl}`,
    }],
  });

  for (let i = 0; i < 3; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1500 * i));
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ACCESS_TOKEN}` },
      body,
    });
    if (res.ok) {
      console.log('push-claim: success to', lineUserId.slice(0, 8));
      return NextResponse.json({ ok: true });
    }
    const err = await res.json().catch(() => ({}));
    const msg = (err.message as string) ?? '';
    console.error(`push-claim error (attempt ${i + 1}) status=${res.status}:`, JSON.stringify(err));
    if (!msg.includes('not a friend') && !msg.includes('recipient')) {
      return NextResponse.json({ ok: false, reason: 'line_error', detail: err });
    }
  }
  return NextResponse.json({ ok: false, reason: 'not_following' });
}
