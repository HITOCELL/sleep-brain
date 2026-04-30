'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateResult } from '@/lib/scoring';
import { DiagnosisResult } from '@/lib/types';

/*
  睡眠偏差値：学業の偏差値に準拠
  - 平均 = 50（totalScore が中間値 30 のとき）
  - 最良（totalScore=0）→ 75
  - 平均（totalScore=30）→ 50
  - 最低（totalScore=60）→ 25
  公式: 75 - (totalScore / 60) × 50
*/
function calcDeviation(totalScore: number): number {
  return Math.round(75 - (totalScore / 60) * 50);
}

/* 偏差値アークゲージ（スケール 0〜100 / 実測値は 25〜75） */
function DeviationGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value / 100));
  const r = 54;
  const cx = 80;
  const cy = 72;
  const startDeg = 180;
  const sweepDeg = 180;
  const toXY = (deg: number) => ({
    x: cx + r * Math.cos((deg * Math.PI) / 180),
    y: cy + r * Math.sin((deg * Math.PI) / 180),
  });
  const s = toXY(startDeg);
  const e = toXY(startDeg + sweepDeg);
  const fillEnd = toXY(startDeg + sweepDeg * pct);
  const largeArc = sweepDeg * pct > 180 ? 1 : 0;

  const bgPath = `M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`;
  const fgPath = pct > 0
    ? `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${fillEnd.x} ${fillEnd.y}`
    : '';

  /* 偏差値に応じた色 */
  const gradStart = value >= 60 ? '#6ED6D3' : value >= 50 ? '#7C83F6' : value >= 40 ? '#F59E0B' : '#F43F5E';
  const gradEnd   = value >= 60 ? '#50C8C4' : value >= 50 ? '#6ED6D3' : value >= 40 ? '#F59E0B' : '#E11D48';

  return (
    <svg width="160" height="96" viewBox="0 0 160 96">
      <defs>
        <linearGradient id="devGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={gradStart} />
          <stop offset="100%" stopColor={gradEnd} />
        </linearGradient>
      </defs>
      {/* トラック */}
      <path d={bgPath} fill="none" stroke="#EEF0FF" strokeWidth="10" strokeLinecap="round" />
      {/* 塗り */}
      {fgPath && <path d={fgPath} fill="none" stroke="url(#devGrad)" strokeWidth="10" strokeLinecap="round" />}
      {/* 偏差値数字 */}
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#14244A" fontSize="32" fontWeight="900" fontFamily="-apple-system, sans-serif">
        {value}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#B0B8D8" fontSize="10" fontFamily="-apple-system, sans-serif">
        睡眠偏差値
      </text>
      {/* 基準ラベル（平均50） */}
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#C5CBE8" fontSize="9" fontFamily="-apple-system, sans-serif">
        平均 50
      </text>
    </svg>
  );
}

const ZONE_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  '睡眠安定ゾーン':     { bg: '#E8FFF5', color: '#059669', dot: '#10B981' },
  '睡眠見直しゾーン':   { bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6' },
  '睡眠課題蓄積ゾーン': { bg: '#FFFBEB', color: '#D97706', dot: '#F59E0B' },
  '睡眠優先改善ゾーン': { bg: '#FFF1F2', color: '#E11D48', dot: '#F43F5E' },
};

const PROGRAM_URL = 'https://osamusenseiline.hitocell.com/p/3xok8LJqUz7g';

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const submitted = localStorage.getItem('diagnosis_email_submitted');
    if (!submitted) { router.replace('/email'); return; }
    const raw = localStorage.getItem('diagnosis_answers');
    if (!raw) { router.replace('/quiz'); return; }
    setResult(calculateResult(JSON.parse(raw)));
  }, [router]);

  if (!result) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F4F8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#7C83F6', fontSize: '14px' }}>読み込み中...</p>
      </div>
    );
  }

  const deviationScore = calcDeviation(result.totalScore);
  const zone = ZONE_STYLE[result.zone] ?? { bg: '#EEF0FF', color: '#7C83F6', dot: '#7C83F6' };

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F8FF', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '430px', display: 'flex', flexDirection: 'column' }}>

        {/* ヘッダー */}
        <header style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 0 #E8EDFF' }}>
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ color: '#7C83F6', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>← ホーム</Link>
            <span style={{ color: '#14244A', fontWeight: 700, fontSize: '14px' }}>診断結果</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C83F6', padding: '4px' }} aria-label="シェア">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>
        </header>

        {/* ヒーロー結果カード */}
        <div style={{
          margin: '16px 16px 0',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #EEF0FF 0%, #E8FAF8 100%)',
          padding: '20px 20px 16px',
          boxShadow: '0 4px 20px rgba(124,131,246,0.14)',
        }}>
          <p style={{ color: '#7C83F6', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>あなたの睡眠タイプ</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, paddingRight: '8px' }}>
              <h2 style={{ color: '#14244A', fontSize: '20px', fontWeight: 900, lineHeight: 1.3, marginBottom: '10px' }}>
                {result.mainType.name}
              </h2>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: zone.bg, color: zone.color,
                padding: '4px 12px', borderRadius: '999px',
                fontSize: '11px', fontWeight: 600,
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: zone.dot }} />
                {result.zone}
              </div>
            </div>
            {/* 偏差値アークゲージ */}
            <DeviationGauge value={deviationScore} />
          </div>
        </div>

        <main style={{ padding: '12px 16px 48px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* ひとこと解説 */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 12px rgba(60,50,120,0.06)' }}>
            <p style={{ color: '#7C83F6', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>ひとこと解説</p>
            <p style={{ color: '#14244A', fontSize: '14px', fontWeight: 600, lineHeight: 1.65 }}>{result.mainType.description}</p>
          </div>

          {/* おすすめアドバイス */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 12px rgba(60,50,120,0.06)' }}>
            <p style={{ color: '#14244A', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>おすすめアドバイス</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {result.mainType.improvements.slice(0, 3).map((item, i) => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                    background: 'linear-gradient(135deg, #EEF0FF, #E8FAF8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#7C83F6', fontSize: '11px', fontWeight: 900,
                  }}>{i + 1}</div>
                  <p style={{ color: '#4D5875', fontSize: '13px', lineHeight: 1.65 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 今日からできること */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 12px rgba(60,50,120,0.06)' }}>
            <p style={{ color: '#14244A', fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>今日からできること</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.mainType.todayActions.slice(0, 3).map((action) => (
                <div key={action} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#F4F8FF', borderRadius: '14px', padding: '12px 14px' }}>
                  <span style={{ color: '#6ED6D3', fontSize: '14px', flexShrink: 0, marginTop: '1px', fontWeight: 700 }}>✓</span>
                  <p style={{ color: '#4D5875', fontSize: '13px', lineHeight: 1.6 }}>{action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 神睡眠プログラムCTA */}
          <div style={{
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #EEF0FF 0%, #E8FAF8 100%)',
            padding: '24px',
            boxShadow: '0 2px 12px rgba(124,131,246,0.10)',
          }}>
            <p style={{ color: '#7C83F6', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>もっと深く整えたい方へ</p>
            <h3 style={{ color: '#14244A', fontWeight: 900, fontSize: '16px', marginBottom: '10px' }}>神睡眠プログラム</h3>
            <p style={{ color: '#4D5875', fontSize: '12px', lineHeight: 1.7, marginBottom: '20px' }}>
              睡眠偏差値を上げるには、自分に合った順序で整えることが大切です。やさしく学びながら、今日からできる改善ステップを実践できます。
            </p>
            <a
              href={PROGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', width: '100%', textAlign: 'center',
                background: 'linear-gradient(135deg, #6ED6D3, #50C8C4)',
                color: 'white', fontWeight: 700, fontSize: '14px',
                padding: '16px', borderRadius: '999px',
                boxShadow: '0 4px 18px rgba(110,214,211,0.42)',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              神睡眠プログラムを見る
            </a>
            <p style={{ color: '#B0B8D8', fontSize: '10px', textAlign: 'center', marginTop: '10px' }}>無理なく、自分のペースで</p>
          </div>

          <p style={{ color: '#C5CBE8', fontSize: '10px', lineHeight: 1.7, textAlign: 'center', padding: '0 8px' }}>
            ※この診断は睡眠習慣を見直すための参考情報です。医療的な診断や治療を目的としたものではありません。強い不調がある場合は医療機関へご相談ください。
          </p>

          <Link
            href="/quiz"
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              border: '2px solid #D4D8F5', color: '#7C83F6',
              fontWeight: 600, fontSize: '14px', padding: '14px',
              borderRadius: '999px', textDecoration: 'none',
            }}
          >
            もう一度診断する
          </Link>
        </main>
      </div>
    </div>
  );
}
