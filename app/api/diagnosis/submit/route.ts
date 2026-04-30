import { NextRequest, NextResponse } from 'next/server';
import { calculateResult } from '@/lib/scoring';

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, answers, userAgent } = body as {
      email: string;
      answers: string[];
      userAgent?: string;
    };

    if (!email || !Array.isArray(answers) || answers.length < 20) {
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

    const payload = {
      timestamp,
      sessionId: randomId(),
      email,
      age: answers[0] ?? '',
      gender: answers[1] ?? '',
      occupation: answers[2] ?? '',
      q4: answers[3] ?? '',
      q5: answers[4] ?? '',
      q6: answers[5] ?? '',
      q7: answers[6] ?? '',
      q8: answers[7] ?? '',
      q9: answers[8] ?? '',
      q10: answers[9] ?? '',
      q11: answers[10] ?? '',
      q12: answers[11] ?? '',
      q13: answers[12] ?? '',
      q14: answers[13] ?? '',
      q15: answers[14] ?? '',
      q16: answers[15] ?? '',
      q17: answers[16] ?? '',
      q18: answers[17] ?? '',
      q19: answers[18] ?? '',
      q20: answers[19] ?? '',
      totalScore: result.totalScore,
      sleepDeviation: result.sleepDeviation,
      sleepZone: result.zone,
      mainType: result.mainType.key,
      subType: result.subType.key,
      recommendedRoute: answers[19] ?? '',
      userAgent: userAgent ?? '',
      createdAt: timestamp,
      // Future fields (reserved, empty for now)
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
      const gasRes = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!gasRes.ok) {
        console.error('GAS webhook failed:', await gasRes.text());
        return NextResponse.json({ success: false, error: 'gas_failed' }, { status: 502 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('submit error:', err);
    return NextResponse.json({ success: false, error: 'internal' }, { status: 500 });
  }
}
