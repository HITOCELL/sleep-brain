'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/track';

const UTAGE_URL = 'https://osamusenseiline.hitocell.com/line/open/SeIcdYij9q5N?mtid=KdPOWzR4nIDK';
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID ?? '';

export default function LinePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'initial' | 'waiting' | 'returned'>('initial');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const answers = localStorage.getItem('diagnosis_answers');
    if (!answers) { router.replace('/quiz'); return; }

    function showReturnButton() {
      if (!localStorage.getItem('line_return_pending')) return;
      localStorage.removeItem('line_return_pending');
      track('line_complete', 23);
      localStorage.setItem('diagnosis_line_added', '1');

      const raw = localStorage.getItem('diagnosis_answers');
      if (LIFF_ID && raw) {
        // LIFFフロー：encodedAnswersでGASからuserIdを逆引きしてpush
        try {
          const ans: string[] = JSON.parse(raw);
          const encoded = btoa(ans.join(','));
          fetch('/api/line/push-claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encodedAnswers: encoded }),
          }).catch(() => {});
        } catch { /* ignore */ }
      } else if (!LIFF_ID && raw) {
        // LIFFなし→旧フロー：URLカードを表示
        try {
          const ans: string[] = JSON.parse(raw);
          const encoded = btoa(ans.join(','));
          setShareUrl(`https://sleep-brain.vercel.app/r?d=${encoded}`);
        } catch { /* ignore */ }
      }
      setPhase('returned');
    }

    window.addEventListener('pageshow', showReturnButton);
    const onVisible = () => {
      if (!document.hidden) {
        document.removeEventListener('visibilitychange', onVisible);
        setTimeout(showReturnButton, 300);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    showReturnButton();

    if (!localStorage.getItem('line_return_pending')) {
      track('line_view', 21);
    }

    return () => {
      window.removeEventListener('pageshow', showReturnButton);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router]);

  function handleLineClick() {
    track('line_click', 22);
    setPhase('waiting');
    localStorage.setItem('line_return_pending', '1');

    if (LIFF_ID) {
      // LIFFフロー：診断データをURLに乗せてLIFFページへ
      const raw = localStorage.getItem('diagnosis_answers');
      if (raw) {
        try {
          const ans: string[] = JSON.parse(raw);
          const encoded = btoa(ans.join(','));
          // liff.stateはエンドポイントURL(/liff)に連結されるので ?d=... のみにする
          const liffState = encodeURIComponent(`?d=${encodeURIComponent(encoded)}`);
          window.location.href = `https://liff.line.me/${LIFF_ID}?liff.state=${liffState}`;
          return;
        } catch { /* fallthrough */ }
      }
    }
    // フォールバック：直接UTAGE URLへ
    window.location.href = UTAGE_URL;
  }

  function handleGoResult() {
    router.push('/result');
  }

  function handleManualSend() {
    if (!shareUrl) return;
    const msg = `🌙 あなたの睡眠診断結果\n${shareUrl}`;
    window.location.href = `https://line.me/R/oaMessage/@673udzkj/?text=${encodeURIComponent(msg)}`;
  }

  function handleCopyUrl() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#F4F8FF', display: 'flex',
      flexDirection: 'column', alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '430px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

        <header style={{ background: 'white', boxShadow: '0 1px 0 #E8EDFF' }}>
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => router.back()} style={{ color: '#7C83F6', fontSize: '14px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              ← 戻る
            </button>
            <span style={{ color: '#14244A', fontWeight: 700, fontSize: '14px' }}>睡眠診断テスト</span>
            <span style={{ width: '40px' }} />
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 40px' }}>

          <div style={{ marginBottom: '20px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/osamu-sensei.png" alt="おさむ先生"
              style={{ width: '140px', height: '140px', objectFit: 'contain' }} />
          </div>

          {/* initial / waiting */}
          {(phase === 'initial' || phase === 'waiting') && (
            <>
              <h1 style={{ color: '#14244A', fontSize: '20px', fontWeight: 900, marginBottom: '10px', textAlign: 'center' }}>
                診断結果を受け取る
              </h1>
              <p style={{ color: '#4D5875', fontSize: '14px', lineHeight: 1.7, textAlign: 'center', marginBottom: '32px' }}>
                LINE公式アカウントを追加すると<br />
                あなたの<strong>睡眠偏差値と診断結果</strong>を<br />
                {LIFF_ID ? '自動でLINEに送信します。' : 'すぐに確認できます。'}
              </p>

              <div style={{ width: '100%', background: 'white', borderRadius: '20px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(60,50,120,0.06)' }}>
                {[
                  '睡眠偏差値・タイプ診断を即公開',
                  '今日からできる改善アドバイス',
                  '睡眠に関する最新情報をお届け',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < 2 ? '12px' : 0 }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #06C755, #00A040)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>✓</span>
                    </div>
                    <span style={{ color: '#14244A', fontSize: '13px', fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>

              {phase === 'initial' && (
                <button onClick={handleLineClick} style={{
                  width: '100%', padding: '18px', borderRadius: '999px',
                  fontWeight: 700, fontSize: '16px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #06C755, #00A040)',
                  color: 'white', boxShadow: '0 6px 22px rgba(6,199,85,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  marginBottom: '12px',
                }}>
                  <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                    <path d="M24 4C13 4 4 11.8 4 21.4c0 6.3 4.2 11.8 10.5 14.9l-1.4 5.2c-.2.6.4 1.1.9.8l6.4-3.9c1.1.1 2.3.2 3.6.2 11 0 20-7.8 20-17.2S35 4 24 4z" fill="white"/>
                  </svg>
                  LINEで結果を受け取る
                </button>
              )}

              {phase === 'waiting' && (
                <div style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#F0FFF4', border: '1.5px solid #86EFAC', textAlign: 'center' }}>
                  <p style={{ color: '#166534', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    LINEページを開いています…
                  </p>
                  <p style={{ color: '#4A7C59', fontSize: '12px' }}>
                    {LIFF_ID ? '友達追加すると自動で診断結果が届きます' : '追加後にこのページへ戻ってください'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* returned */}
          {phase === 'returned' && (
            <>
              {LIFF_ID ? (
                <div style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#EEF0FF', border: '1.5px solid #C7CAF9', marginBottom: '20px', textAlign: 'center' }}>
                  <p style={{ color: '#4A50C8', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                    LINEアプリでの操作が完了しましたか？
                  </p>
                  <p style={{ color: '#6B72E0', fontSize: '12px', lineHeight: 1.6 }}>
                    友達追加が完了すると<br />LINEのトークに診断結果が自動で届きます
                  </p>
                </div>
              ) : (
                <div style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#F0FFF4', border: '1.5px solid #86EFAC', marginBottom: '20px', textAlign: 'center' }}>
                  <p style={{ color: '#166534', fontSize: '13px', fontWeight: 700 }}>
                    ✓ LINE追加が完了しました！
                  </p>
                </div>
              )}

              <button onClick={handleGoResult} style={{
                width: '100%', padding: '18px', borderRadius: '999px',
                fontWeight: 700, fontSize: '16px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #7C83F6, #6ED6D3)',
                color: 'white', boxShadow: '0 6px 22px rgba(124,131,246,0.40)',
                marginBottom: '16px',
              }}>
                🔍 あなたの診断結果を確認する
              </button>

              {LIFF_ID && (
                <button onClick={handleLineClick} style={{
                  width: '100%', padding: '14px', borderRadius: '999px',
                  fontWeight: 700, fontSize: '14px', border: '1.5px solid #06C755', cursor: 'pointer',
                  background: 'white', color: '#06C755',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  marginBottom: '8px',
                }}>
                  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                    <path d="M24 4C13 4 4 11.8 4 21.4c0 6.3 4.2 11.8 10.5 14.9l-1.4 5.2c-.2.6.4 1.1.9.8l6.4-3.9c1.1.1 2.3.2 3.6.2 11 0 20-7.8 20-17.2S35 4 24 4z" fill="#06C755"/>
                  </svg>
                  まだ追加していない場合はもう一度開く
                </button>
              )}

              {/* LIFFなし→旧フォールバック：URLカード表示 */}
              {!LIFF_ID && shareUrl && (
                <div style={{ width: '100%', background: 'white', borderRadius: '20px', padding: '18px', boxShadow: '0 2px 12px rgba(60,50,120,0.06)' }}>
                  <p style={{ color: '#14244A', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    🌙 あなた専用の診断結果リンク
                  </p>
                  <p style={{ color: '#7C83F6', fontSize: '11px', marginBottom: '12px', lineHeight: 1.5 }}>
                    「LINEに送る」で公式アカウントのトークに<br />診断結果を保存できます
                  </p>
                  <p style={{ fontSize: '10px', color: '#4D5875', wordBreak: 'break-all', background: '#F4F8FF', borderRadius: '10px', padding: '8px 10px', marginBottom: '12px', lineHeight: 1.6 }}>
                    {shareUrl}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleCopyUrl} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: copied ? '#D1FAE5' : '#EEF0FF', color: copied ? '#059669' : '#7C83F6', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                      {copied ? '✓ コピー済み' : 'URLをコピー'}
                    </button>
                    <button onClick={handleManualSend} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #06C755, #00A040)', color: 'white', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                      LINEに送る
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <p style={{ color: '#C5CBE8', fontSize: '10px', lineHeight: 1.8, textAlign: 'center', marginTop: '24px' }}>
            ※登録は無料です<br />
            ※診断結果は参考情報であり、医療的な診断ではありません。
          </p>
        </main>
      </div>
    </div>
  );
}
