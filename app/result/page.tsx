'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateResult } from '@/lib/scoring';
import { DiagnosisResult } from '@/lib/types';
import { track } from '@/lib/track';

function calcDeviation(totalScore: number): number {
  // 0→65, 20→55, 40→45, 60→35, 80→25, 100→15 (clamp 15〜70)
  const v = Math.round(65 - totalScore * 0.5);
  return Math.max(15, Math.min(70, v));
}

function DeviationGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value / 100));
  const r = 54; const cx = 80; const cy = 72;
  const toXY = (deg: number) => ({ x: cx + r * Math.cos((deg * Math.PI) / 180), y: cy + r * Math.sin((deg * Math.PI) / 180) });
  const s = toXY(180); const e = toXY(360); const fillEnd = toXY(180 + 180 * pct);
  const bgPath = `M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`;
  const fgPath = pct > 0 ? `M ${s.x} ${s.y} A ${r} ${r} 0 ${180 * pct > 180 ? 1 : 0} 1 ${fillEnd.x} ${fillEnd.y}` : '';
  const gradStart = value >= 60 ? '#6ED6D3' : value >= 50 ? '#7C83F6' : value >= 40 ? '#F59E0B' : '#F43F5E';
  const gradEnd   = value >= 60 ? '#50C8C4' : value >= 50 ? '#6ED6D3' : value >= 40 ? '#F59E0B' : '#E11D48';
  return (
    <svg width="160" height="96" viewBox="0 0 160 96">
      <defs><linearGradient id="devGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={gradStart}/><stop offset="100%" stopColor={gradEnd}/></linearGradient></defs>
      <path d={bgPath} fill="none" stroke="#EEF0FF" strokeWidth="10" strokeLinecap="round"/>
      {fgPath && <path d={fgPath} fill="none" stroke="url(#devGrad)" strokeWidth="10" strokeLinecap="round"/>}
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#14244A" fontSize="32" fontWeight="900" fontFamily="-apple-system, sans-serif">{value}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#B0B8D8" fontSize="10" fontFamily="-apple-system, sans-serif">睡眠偏差値</text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#C5CBE8" fontSize="9" fontFamily="-apple-system, sans-serif">平均 50</text>
    </svg>
  );
}

const ZONE_STYLE: Record<string, { bg: string; color: string; dot: string; urgency: string; ctaTitle: string }> = {
  '睡眠安定ゾーン':     { bg: '#E8FFF5', color: '#059669', dot: '#10B981', urgency: 'さらに睡眠の質を高めたい方へ', ctaTitle: 'より深く、より良い眠りへ' },
  '睡眠見直しゾーン':   { bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6', urgency: '睡眠を根本から見直したい方へ', ctaTitle: '今のうちに睡眠を整えましょう' },
  '睡眠課題蓄積ゾーン': { bg: '#FFFBEB', color: '#D97706', dot: '#F59E0B', urgency: '本気で睡眠を改善したい方へ', ctaTitle: '蓄積した睡眠負債をリセットする' },
  '睡眠優先改善ゾーン': { bg: '#FFF1F2', color: '#E11D48', dot: '#F43F5E', urgency: '今すぐ睡眠を改善すべき方へ', ctaTitle: 'このまま放置するのは危険です' },
};

const PROGRAM_URL = 'https://osamusenseiline.hitocell.com/p/4G4GVbnKqxPK';

const PROGRAM_FEATURES = [
  { icon: '🌙', text: 'あなたの睡眠タイプに合った改善ステップ' },
  { icon: '⏱️', text: '1日5分からできる快眠習慣の作り方' },
  { icon: '🧠', text: '睡眠の質を下げる原因を根本から解消' },
  { icon: '📈', text: '睡眠偏差値を着実に上げる実践メソッド' },
];

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const submitted = localStorage.getItem('diagnosis_line_added');
    if (!submitted) { router.replace('/line'); return; }
    const raw = localStorage.getItem('diagnosis_answers');
    if (!raw) { router.replace('/quiz'); return; }
    const parsed = JSON.parse(raw);
    const answers: string[][] = Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])
      ? parsed
      : (parsed as string[]).map((v) => [v]);
    setResult(calculateResult(answers));

    if (!localStorage.getItem('diagnosis_submitted')) {
      localStorage.setItem('diagnosis_submitted', '1');
      const sessionId = localStorage.getItem('sleep_session_id') ?? undefined;
      fetch('/api/diagnosis/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineId: '',
          answers,
          sessionId,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {});
    }
  }, [router]);

  if (!result) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F4F8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#7C83F6', fontSize: '14px' }}>読み込み中...</p>
      </div>
    );
  }

  const deviationScore = calcDeviation(result.totalScore);
  const zone = ZONE_STYLE[result.zone] ?? { bg: '#EEF0FF', color: '#7C83F6', dot: '#7C83F6', urgency: '本気で睡眠を改善したい方へ', ctaTitle: '睡眠を根本から改善する' };
  const font = 'system-ui, -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F8FF', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: font }}>
      <div style={{ width: '100%', maxWidth: '430px', display: 'flex', flexDirection: 'column' }}>

        {/* ヘッダー */}
        <header style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 0 #E8EDFF' }}>
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ color: '#7C83F6', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>← ホーム</Link>
            <span style={{ color: '#14244A', fontWeight: 700, fontSize: '14px' }}>あなたの診断結果</span>
            <span style={{ width: '40px' }} />
          </div>
        </header>

        {/* ヒーロー結果カード(MBTI風タイプ訴求) */}
        <div style={{ margin: '16px 16px 0', borderRadius: '24px', background: 'linear-gradient(135deg, #1A2547 0%, #2B3D6E 100%)', padding: '24px 22px 20px', boxShadow: '0 8px 28px rgba(20,36,74,0.30)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(110,214,211,0.10)' }} />
          <div style={{ position: 'absolute', bottom: '-25px', left: '-20px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(124,131,246,0.10)' }} />

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: 600, marginBottom: '4px', letterSpacing: '0.08em' }}>YOUR SLEEP TYPE</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 900, lineHeight: 1.15, letterSpacing: '0.02em' }}>{result.mainType.name}</h2>
            <DeviationGauge value={deviationScore} />
          </div>
          <p style={{ color: '#F9D423', fontSize: '13px', fontWeight: 700, lineHeight: 1.5, marginBottom: '12px' }}>
            「{result.mainType.catchphrase}」
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', color: 'white', padding: '6px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, border: `1px solid ${zone.dot}` }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: zone.dot }} />
            {result.zone}
          </div>
        </div>

        <main style={{ padding: '12px 16px 48px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* 偏差値の解釈 */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 12px rgba(60,50,120,0.06)' }}>
            <p style={{ color: '#7C83F6', fontSize: '11px', fontWeight: 600, marginBottom: '10px' }}>あなたの睡眠偏差値 {deviationScore} の意味</p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #EEF0FF, #E8FAF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: zone.color }}>{deviationScore}</span>
              </div>
              <p style={{ color: '#14244A', fontSize: '13px', lineHeight: 1.7, fontWeight: 600 }}>
                {deviationScore >= 65 ? '睡眠の質が非常に高い状態です。この良い習慣を維持しながら、さらなる最適化を目指しましょう。' :
                 deviationScore >= 55 ? '平均よりやや良い状態ですが、まだ改善の余地があります。正しいアプローチで偏差値60以上を目指せます。' :
                 deviationScore >= 45 ? '平均的な睡眠の質です。多くの方が感じている「なんとなく疲れが取れない」状態です。' :
                 deviationScore >= 35 ? '睡眠の質が低下しています。このまま放置すると、日中のパフォーマンスや健康に影響が出る可能性があります。' :
                 '睡眠の質が著しく低下しています。早急な改善が必要です。専門的なサポートを活用することをおすすめします。'}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F4F8FF', borderRadius: '12px', padding: '10px 14px' }}>
              {[['25以下', '要改善'], ['40', '低め'], ['50', '平均'], ['60', '良好'], ['75以上', '優秀']].map(([score, label]) => (
                <div key={score} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', color: '#B0B8D8', marginBottom: '2px' }}>{label}</p>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#7C83F6' }}>{score}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ひとこと解説 */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 12px rgba(60,50,120,0.06)' }}>
            <p style={{ color: '#7C83F6', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>タイプ解説</p>
            <p style={{ color: '#14244A', fontSize: '14px', fontWeight: 600, lineHeight: 1.65 }}>{result.mainType.description}</p>
            {result.subType && (
              <div style={{ marginTop: '12px', padding: '12px', background: '#F4F8FF', borderRadius: '14px' }}>
                <p style={{ color: '#7C83F6', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>サブタイプ</p>
                <p style={{ color: '#4D5875', fontSize: '12px', fontWeight: 600 }}>{result.subType.name}</p>
              </div>
            )}
          </div>

          {/* おすすめアドバイス */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 12px rgba(60,50,120,0.06)' }}>
            <p style={{ color: '#14244A', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>あなたへのおすすめアドバイス</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {result.mainType.improvements.slice(0, 3).map((item, i) => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, marginTop: '1px', background: 'linear-gradient(135deg, #EEF0FF, #E8FAF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C83F6', fontSize: '11px', fontWeight: 900 }}>{i + 1}</div>
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

          {/* ========== 神睡眠プログラム CTA ========== */}
          <div style={{
            borderRadius: '28px',
            background: 'linear-gradient(160deg, #0F1F5C 0%, #1A3A6E 50%, #0D2845 100%)',
            padding: '28px 24px 24px',
            boxShadow: '0 8px 40px rgba(15,31,92,0.35)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* 背景装飾 */}
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(110,214,211,0.08)' }} />
            <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(124,131,246,0.08)' }} />

            {/* バッジ */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(249,212,35,0.15)', border: '1px solid rgba(249,212,35,0.4)', borderRadius: '999px', padding: '4px 12px', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px' }}>🔥</span>
              <span style={{ color: '#F9D423', fontSize: '11px', fontWeight: 700 }}>{zone.urgency}</span>
            </div>

            <h3 style={{ color: 'white', fontWeight: 900, fontSize: '20px', lineHeight: 1.3, marginBottom: '8px' }}>
              {zone.ctaTitle}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', lineHeight: 1.7, marginBottom: '20px' }}>
              あなたの睡眠偏差値は <strong style={{ color: '#F9D423' }}>{deviationScore}</strong> でした。<br />
              神睡眠プログラムでは、あなたのタイプに合った順序で睡眠を整える具体的なステップを学べます。
            </p>

            {/* 特典リスト */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {PROGRAM_FEATURES.map((f) => (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{f.icon}</span>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', lineHeight: 1.5 }}>{f.text}</p>
                </div>
              ))}
            </div>

            {/* メインCTAボタン */}
            <a
              href={PROGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('program_click', 24)}
              style={{
                display: 'block', width: '100%', textAlign: 'center',
                background: 'linear-gradient(135deg, #F9D423 0%, #FF8C00 100%)',
                color: '#14244A', fontWeight: 900, fontSize: '17px',
                padding: '20px', borderRadius: '999px',
                boxShadow: '0 6px 28px rgba(249,212,35,0.50)',
                textDecoration: 'none',
                boxSizing: 'border-box',
                letterSpacing: '0.02em',
              }}
            >
              神睡眠プログラムを今すぐ見る →
            </a>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textAlign: 'center', marginTop: '10px' }}>
              無理なく・自分のペースで・今日から始められる
            </p>
          </div>

          <p style={{ color: '#C5CBE8', fontSize: '10px', lineHeight: 1.7, textAlign: 'center', padding: '0 8px' }}>
            ※この診断は睡眠習慣を見直すための参考情報です。医療的な診断や治療を目的としたものではありません。
          </p>

          <Link
            href="/quiz"
            style={{ display: 'block', width: '100%', textAlign: 'center', border: '2px solid #D4D8F5', color: '#7C83F6', fontWeight: 600, fontSize: '14px', padding: '14px', borderRadius: '999px', textDecoration: 'none' }}
          >
            もう一度診断する
          </Link>
        </main>
      </div>
    </div>
  );
}
