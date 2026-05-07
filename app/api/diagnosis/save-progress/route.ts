import { NextRequest, NextResponse } from 'next/server';
import { questions } from '@/lib/questions';

function getLabel(idx: number, value: string): string {
  const q = questions[idx];
  if (!q) return value;
  const opt = q.options.find(o => o.value === value);
  return opt ? opt.label : value;
}

export async function POST(request: NextRequest) {
  try {
    const { answers, sessionId, userAgent } = await request.json() as {
      answers: string[];
      sessionId: string;
      userAgent?: string;
    };

    if (!sessionId || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ success: false });
    }

    const now = new Date();
    const timestamp = now.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).replace(/\//g, '-');

    // q1〜q20 のうち回答済み分だけ入れる（残りは空文字）
    const payload: Record<string, string> = {
      type: 'save_progress',
      timestamp,
      sessionId,
      userAgent: userAgent ?? '',
    };
    for (let i = 0; i < 20; i++) {
      payload[`q${i + 1}`] = i < answers.length ? getLabel(i, answers[i] ?? '') : '';
    }

    const gasUrl = process.env.GAS_WEBHOOK_URL;
    if (gasUrl) {
      fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
