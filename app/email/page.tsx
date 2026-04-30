'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryable, setRetryable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const answers = localStorage.getItem('diagnosis_answers');
    if (!answers) router.replace('/quiz');
  }, [router]);

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function handleSubmit() {
    if (!isValidEmail(email)) {
      setError('正しいメールアドレスを入力してください');
      return;
    }
    setError('');
    setLoading(true);
    setRetryable(false);

    try {
      const answers: string[] = JSON.parse(localStorage.getItem('diagnosis_answers') ?? '[]');
      const res = await fetch('/api/diagnosis/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answers, userAgent: navigator.userAgent }),
      });
      if (!res.ok) throw new Error('save_failed');
      localStorage.setItem('diagnosis_email_submitted', '1');
      localStorage.setItem('diagnosis_email', email);
      router.push('/result');
    } catch {
      setLoading(false);
      setRetryable(true);
      setError('通信環境をご確認のうえ、もう一度お試しください');
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F8FF', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '430px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

        {/* ヘッダー */}
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

          {/* エンベロープアイコン */}
          <div style={{
            width: '96px', height: '96px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #EEF0FF, #E8FAF8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '28px',
            boxShadow: '0 4px 20px rgba(124,131,246,0.18)',
          }}>
            <svg width="44" height="34" viewBox="0 0 44 34" fill="none">
              <rect x="1" y="1" width="42" height="32" rx="5" fill="white" stroke="#7C83F6" strokeWidth="2" />
              <path d="M1 8L22 21L43 8" stroke="#7C83F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 style={{ color: '#14244A', fontSize: '20px', fontWeight: 900, marginBottom: '10px', textAlign: 'center' }}>
            結果を見る前に
          </h1>
          <p style={{ color: '#4D5875', fontSize: '14px', lineHeight: 1.7, textAlign: 'center', marginBottom: '32px' }}>
            診断結果を保存して、<br />あなたに合った睡眠改善アドバイスを<br />お届けします。
          </p>

          {/* メールアドレス入力 */}
          <div style={{ width: '100%', marginBottom: '10px' }}>
            <label style={{ display: 'block', color: '#14244A', fontSize: '12px', fontWeight: 600, marginBottom: '6px', marginLeft: '4px' }}>
              メールアドレス
            </label>
            <input
              type="email"
              inputMode="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              style={{
                width: '100%', padding: '14px 18px',
                borderRadius: '16px',
                border: `2px solid ${error ? '#F87171' : email && isValidEmail(email) ? '#7C83F6' : '#E8EDFF'}`,
                background: 'white',
                color: '#14244A', fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#F87171', fontSize: '12px', marginBottom: '10px', textAlign: 'center', width: '100%' }}>
              {error}
            </p>
          )}

          {/* 送信ボタン */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '16px', borderRadius: '999px',
              fontWeight: 700, fontSize: '15px', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#E8EDFF' : 'linear-gradient(135deg, #6ED6D3, #50C8C4)',
              color: loading ? '#B0B8D8' : 'white',
              boxShadow: loading ? 'none' : '0 6px 22px rgba(110,214,211,0.42)',
              marginTop: '8px',
              marginBottom: '14px',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            {loading ? '送信中...' : '結果を見る'}
          </button>

          {retryable && (
            <button
              onClick={handleSubmit}
              style={{
                width: '100%', padding: '14px', borderRadius: '999px',
                border: '2px solid #7C83F6', color: '#7C83F6',
                fontWeight: 600, fontSize: '14px', background: 'none',
                cursor: 'pointer', marginBottom: '14px', fontFamily: 'inherit',
              }}
            >
              再送信する
            </button>
          )}

          <p style={{ color: '#C5CBE8', fontSize: '10px', lineHeight: 1.8, textAlign: 'center', marginTop: '8px' }}>
            ※登録は1分で完了します<br />
            ※診断結果は参考情報であり、医療的な診断ではありません。
          </p>
        </main>
      </div>
    </div>
  );
}
