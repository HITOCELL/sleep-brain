import { NextRequest, NextResponse } from 'next/server';
import { questions } from '@/lib/questions';

function getLabel(idx: number, value: string): string {
  const q = questions[idx];
  if (!q) return value;
  const opt = q.options.find(o => o.value === value);
  return opt ? opt.label : value;
}

function labelsFor(idx: number, values: string[]): string {
  return values.map((v) => getLabel(idx, v)).filter(Boolean).join(' / ');
}

function normalizeAnswers(input: unknown): string[][] {
  if (!Array.isArray(input)) return [];
  return input.map((v) => Array.isArray(v) ? v.map(String) : [String(v)]);
}

export async function POST(request: NextRequest) {
  try {
    const { answers: rawAnswers, sessionId, userAgent } = await request.json() as {
      answers: unknown;
      sessionId: string;
      userAgent?: string;
    };

    const answers = normalizeAnswers(rawAnswers);
    if (!sessionId || answers.length === 0) {
      return NextResponse.json({ success: false });
    }

    const now = new Date();
    const timestamp = now.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).replace(/\//g, '-');

    const payload: Record<string, string> = {
      type: 'save_progress',
      timestamp,
      sessionId,
      userAgent: userAgent ?? '',
    };
    for (let i = 0; i < 20; i++) {
      payload[`q${i + 1}`] = i < answers.length ? labelsFor(i, answers[i] ?? []) : '';
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
