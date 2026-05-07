import { NextRequest, NextResponse } from 'next/server';
import { calculateResult } from '@/lib/scoring';
import { questions } from '@/lib/questions';

function getLabel(questionIndex: number, value: string): string {
  const q = questions[questionIndex];
  if (!q) return value;
  const opt = q.options.find(o => o.value === value);
  return opt ? opt.label : value;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineId, answers, userAgent, sessionId } = body as {
      lineId?: string;
      answers: string[];
      userAgent?: string;
      sessionId?: string;
    };

    if (!Array.isArray(answers) || answers.length < 20) {
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
      q1:  getLabel(0,  answers[0]  ?? ''),
      q2:  getLabel(1,  answers[1]  ?? ''),
      q3:  getLabel(2,  answers[2]  ?? ''),
      q4:  getLabel(3,  answers[3]  ?? ''),
      q5:  getLabel(4,  answers[4]  ?? ''),
      q6:  getLabel(5,  answers[5]  ?? ''),
      q7:  getLabel(6,  answers[6]  ?? ''),
      q8:  getLabel(7,  answers[7]  ?? ''),
      q9:  getLabel(8,  answers[8]  ?? ''),
      q10: getLabel(9,  answers[9]  ?? ''),
      q11: getLabel(10, answers[10] ?? ''),
      q12: getLabel(11, answers[11] ?? ''),
      q13: getLabel(12, answers[12] ?? ''),
      q14: getLabel(13, answers[13] ?? ''),
      q15: getLabel(14, answers[14] ?? ''),
      q16: getLabel(15, answers[15] ?? ''),
      q17: getLabel(16, answers[16] ?? ''),
      q18: getLabel(17, answers[17] ?? ''),
      q19: getLabel(18, answers[18] ?? ''),
      q20: getLabel(19, answers[19] ?? ''),
      totalScore: result.totalScore,
      sleepDeviation: result.sleepDeviation,
      sleepZone: result.zone,
      mainType: result.mainType.key,
      subType: result.subType.key,
      recommendedRoute: getLabel(19, answers[19] ?? ''),
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
