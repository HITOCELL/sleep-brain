import { NextRequest, NextResponse } from 'next/server';
import { calculateResult } from '@/lib/scoring';
import { questions } from '@/lib/questions';

function getLabel(questionIndex: number, value: string): string {
  const q = questions[questionIndex];
  if (!q) return value;
  const opt = q.options.find(o => o.value === value);
  return opt ? opt.label : value;
}

function labelsFor(questionIndex: number, values: string[]): string {
  return values.map((v) => getLabel(questionIndex, v)).filter(Boolean).join(' / ');
}

function normalizeAnswers(input: unknown): string[][] {
  if (!Array.isArray(input)) return [];
  return input.map((v) => Array.isArray(v) ? v.map(String) : [String(v)]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineId, answers: rawAnswers, userAgent, sessionId } = body as {
      lineId?: string;
      answers: unknown;
      userAgent?: string;
      sessionId?: string;
    };

    const answers = normalizeAnswers(rawAnswers);
    if (answers.length < 20) {
      return NextResponse.json({ success: false, error: 'invalid_params' }, { status: 400 });
    }

    const result = calculateResult(answers);

    const now = new Date();
    const timestamp = now.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).replace(/\//g, '-');

    const sid = sessionId || (Math.random().toString(36).slice(2, 10) + Date.now().toString(36));

    const payload = {
      timestamp,
      sessionId: sid,
      lineId: lineId ?? '',
      q1:  labelsFor(0,  answers[0]  ?? []),
      q2:  labelsFor(1,  answers[1]  ?? []),
      q3:  labelsFor(2,  answers[2]  ?? []),
      q4:  labelsFor(3,  answers[3]  ?? []),
      q5:  labelsFor(4,  answers[4]  ?? []),
      q6:  labelsFor(5,  answers[5]  ?? []),
      q7:  labelsFor(6,  answers[6]  ?? []),
      q8:  labelsFor(7,  answers[7]  ?? []),
      q9:  labelsFor(8,  answers[8]  ?? []),
      q10: labelsFor(9,  answers[9]  ?? []),
      q11: labelsFor(10, answers[10] ?? []),
      q12: labelsFor(11, answers[11] ?? []),
      q13: labelsFor(12, answers[12] ?? []),
      q14: labelsFor(13, answers[13] ?? []),
      q15: labelsFor(14, answers[14] ?? []),
      q16: labelsFor(15, answers[15] ?? []),
      q17: labelsFor(16, answers[16] ?? []),
      q18: labelsFor(17, answers[17] ?? []),
      q19: labelsFor(18, answers[18] ?? []),
      q20: labelsFor(19, answers[19] ?? []),
      totalScore: result.totalScore,
      sleepDeviation: result.sleepDeviation,
      sleepZone: result.zone,
      mainType: result.mainType.key,
      subType: result.subType.key,
      recommendedRoute: labelsFor(19, answers[19] ?? []),
      userAgent: userAgent ?? '',
      createdAt: timestamp,
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      lineRegistered: '',
      programClicked: '',
      consultationClicked: '',
      sourcePage: '',
    };

    const gasUrl = process.env.GAS_WEBHOOK_URL;
    if (gasUrl) {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('submit error:', err);
    return NextResponse.json({ success: false, error: 'internal' }, { status: 500 });
  }
}
