import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const GAS_URL = process.env.GAS_WEBHOOK_URL ?? '';
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET ?? '';
const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';

function verifySignature(body: string, signature: string): boolean {
  if (!CHANNEL_SECRET) return false;
  const hash = crypto
    .createHmac('sha256', CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

async function sendLinePush(lineUserId: string, encodedAnswers: string) {
  const resultUrl = `https://sleep-brain.vercel.app/r?d=${encodedAnswers}`;
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{
        type: 'text',
        text: `🌙 あなたの睡眠診断結果が届きました！\n\n以下のリンクからいつでも結果を確認できます👇\n\n${resultUrl}`,
      }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('follow push error:', JSON.stringify(err));
  } else {
    console.log('follow push success to', lineUserId.slice(0, 8));
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get('x-line-signature') ?? '';

  if (!verifySignature(raw, sig)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let body: { events?: Array<{ type: string; source?: { userId?: string }; timestamp?: number }> };
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ ok: true }); }

  for (const ev of body.events ?? []) {
    if (ev.type === 'follow' && ev.source?.userId) {
      const lineUserId = ev.source.userId;
      console.log('follow event userId:', lineUserId.slice(0, 8));

      if (!GAS_URL || !ACCESS_TOKEN) {
        console.error('follow: missing GAS_URL or ACCESS_TOKEN');
        continue;
      }

      // GASからencodedAnswersを取得してpush送信
      try {
        const gasRes = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'line_get', lineUserId }),
        });
        const gasData = await gasRes.json();

        if (gasData.success && gasData.encodedAnswers) {
          await sendLinePush(lineUserId, gasData.encodedAnswers);
        } else {
          console.log('follow: no encodedAnswers stored for', lineUserId.slice(0, 8));
        }
      } catch (e) {
        console.error('follow webhook processing error:', e);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
