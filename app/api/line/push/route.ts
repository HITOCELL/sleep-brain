import { NextRequest, NextResponse } from 'next/server';

const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';

export async function POST(req: NextRequest) {
  const { lineUserId, encodedAnswers } = await req.json();

  if (!ACCESS_TOKEN) {
    return NextResponse.json({ ok: false, reason: 'missing_token' });
  }
  if (!lineUserId || !encodedAnswers) {
    return NextResponse.json({ ok: false, reason: 'missing_params' });
  }

  // まずuserIdがこのチャンネルのものか確認（プロバイダー不一致の診断）
  const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });

  if (!profileRes.ok) {
    const profileErr = await profileRes.json().catch(() => ({}));
    console.error('profile check failed:', profileRes.status, JSON.stringify(profileErr));
    return NextResponse.json({
      ok: false,
      reason: 'provider_mismatch',
      httpStatus: profileRes.status,
      detail: profileErr,
      errorMessage: 'LIFFのチャンネルとMessaging APIのチャンネルが異なるプロバイダーです。LINE Developers ConsoleでLIFFをMessaging APIチャンネルに移動してください。',
    });
  }

  const resultUrl = `https://sleep-brain.vercel.app/r?d=${encodedAnswers}`;
  const body = JSON.stringify({
    to: lineUserId,
    messages: [{
      type: 'text',
      text: `🌙 あなたの睡眠診断結果が届きました！\n\n以下のリンクからいつでも結果を確認できます👇\n\n${resultUrl}`,
    }],
  });

  let lastErr: Record<string, unknown> = {};
  let lastStatus = 0;

  for (let i = 0; i < 3; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1500 * i));

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body,
    });

    lastStatus = res.status;

    if (res.ok) {
      console.log('LINE push success to', lineUserId.slice(0, 8));
      return NextResponse.json({ ok: true });
    }

    lastErr = await res.json().catch(() => ({}));
    const msg: string = (lastErr.message as string) ?? '';
    console.error(`LINE push error (attempt ${i + 1}) status=${res.status}:`, JSON.stringify(lastErr));

    if (msg.includes('not a friend') || msg.includes('recipient')) continue;
    return NextResponse.json({ ok: false, reason: 'line_error', httpStatus: lastStatus, detail: lastErr, errorMessage: msg });
  }

  return NextResponse.json({ ok: false, reason: 'not_following', httpStatus: lastStatus, detail: lastErr });
}
