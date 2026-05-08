'use client';

import { useState, useEffect, useRef, Suspense } from 'react';

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID ?? '';
const UTAGE_URL = 'https://osamusenseiline.hitocell.com/line/open/SeIcdYij9q5N?mtid=KdPOWzR4nIDK';
const LINE_ADD_URL = 'https://line.me/R/ti/p/@673udzkj';

type Phase = 'loading' | 'ready' | 'following' | 'sending' | 'done' | 'error';

function LiffInner() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [lineUserId, setLineUserId] = useState('');
  const [encodedAnswers, setEncodedAnswers] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const isSendingRef = useRef(false);
  const visHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (visHandlerRef.current) document.removeEventListener('visibilitychange', visHandlerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!LIFF_ID) { setPhase('error'); setErrorMsg('LIFF_ID未設定'); return; }

    import('@line/liff').then(async ({ default: liff }) => {
      try {
        await liff.init({ liffId: LIFF_ID });

        const d = new URLSearchParams(window.location.search).get('d') ?? '';
        if (!d) { setPhase('error'); setErrorMsg('診断データが見つかりません。\nもう一度診断を行ってください。'); return; }
        setEncodedAnswers(d);

        if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }

        const profile = await liff.getProfile();
        const uid = profile.userId;
        setLineUserId(uid);

        // GASに登録（診断データとuserIdを紐付け）
        fetch('/api/line/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineUserId: uid, encodedAnswers: d }),
        }).catch(() => {});

        // 既存友達の場合: 即pushを試みる
        setPhase('sending');
        const ok = await tryPush(uid, d);
        if (!ok) {
          // 未友達 → 友達追加ボタンを表示
          setPhase('ready');
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setPhase('error');
        setErrorMsg('LINE認証エラー: ' + msg);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // push試行。成功: true / 失敗(未友達含む): false
  async function tryPush(uid: string, answers: string): Promise<boolean> {
    if (isSendingRef.current) return false;
    isSendingRef.current = true;
    try {
      const res = await fetch('/api/line/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineUserId: uid, encodedAnswers: answers }),
      });
      const data = await res.json();
      if (data.ok) {
        setPhase('done');
        return true;
      }
      // 致命的エラー（トークン不正など）
      if (data.reason === 'missing_token' || (data.reason === 'provider_mismatch') ||
          ((data.errorMessage ?? '').includes('Authentication'))) {
        setPhase('error');
        setErrorMsg('LINE設定エラー: ' + (data.errorMessage ?? data.reason));
        return false;
      }
      // not_following / line_error → 未友達とみなす
      return false;
    } catch {
      return false;
    } finally {
      isSendingRef.current = false;
    }
  }

  function handleAddFriend() {
    setPhase('following');
    isSendingRef.current = false;

    const uid = lineUserId;
    const answers = encodedAnswers;

    // visibilitychange: LIFFに戻った瞬間にpushを試みる
    if (visHandlerRef.current) document.removeEventListener('visibilitychange', visHandlerRef.current);
    const handler = async () => {
      if (!document.hidden) {
        document.removeEventListener('visibilitychange', handler);
        visHandlerRef.current = null;
        setPhase('sending');
        const ok = await tryPush(uid, answers);
        if (!ok) {
          // 友達追加未完了 → もう一度ボタンを表示
          setPhase('following');
          // 再度visibilitychangeを設定
          handleAddFriend();
        }
      }
    };
    visHandlerRef.current = handler;
    document.addEventListener('visibilitychange', handler);

    // setTimeout系: JSが止まっても再開後に発火する
    [3000, 8000, 15000].forEach(ms => {
      setTimeout(async () => {
        if (phase === 'done' || isSendingRef.current) return;
        await tryPush(uid, answers);
      }, ms);
    });

    import('@line/liff').then(({ default: liff }) => {
      liff.openWindow({ url: LINE_ADD_URL, external: false });
      fetch(UTAGE_URL, { mode: 'no-cors' }).catch(() => {});
    });
  }

  async function handleManualSend() {
    isSendingRef.current = false;
    setPhase('sending');
    const ok = await tryPush(lineUserId, encodedAnswers);
    if (!ok && phase !== 'error') {
      setPhase('error');
      setErrorMsg('送信失敗。友達追加が完了しているか確認してください。');
    }
  }

  const wrap: React.CSSProperties = {
    minHeight: '100dvh', background: '#F4F8FF', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif',
    padding: '32px 24px',
  };
  const card: React.CSSProperties = {
    width: '100%', maxWidth: '360px', background: 'white', borderRadius: '24px',
    padding: '32px 24px', boxShadow: '0 4px 24px rgba(60,50,120,0.10)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
  };
  const greenBtn: React.CSSProperties = {
    width: '100%', padding: '16px', borderRadius: '999px', fontWeight: 700, fontSize: '16px',
    border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #06C755, #00A040)',
    color: 'white', boxShadow: '0 6px 22px rgba(6,199,85,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  };
  const subBtn: React.CSSProperties = {
    marginTop: '12px', background: 'none', border: 'none',
    color: '#7C83F6', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline',
  };
  const lineIcon = (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
      <path d="M24 4C13 4 4 11.8 4 21.4c0 6.3 4.2 11.8 10.5 14.9l-1.4 5.2c-.2.6.4 1.1.9.8l6.4-3.9c1.1.1 2.3.2 3.6.2 11 0 20-7.8 20-17.2S35 4 24 4z" fill="white"/>
    </svg>
  );

  if (phase === 'loading' || phase === 'sending') return (
    <div style={wrap}><div style={card}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>{phase === 'sending' ? '📨' : '🌙'}</div>
      <p style={{ color: '#7C83F6', fontSize: '14px' }}>{phase === 'sending' ? 'LINEに送信中...' : '読み込み中...'}</p>
    </div></div>
  );

  if (phase === 'error') return (
    <div style={wrap}><div style={card}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
      <p style={{ color: '#EF4444', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '20px' }}>{errorMsg}</p>
      {lineUserId && encodedAnswers && (
        <button onClick={handleManualSend} style={greenBtn}>{lineIcon} 再度送信する</button>
      )}
      {encodedAnswers && (
        <button onClick={() => { window.location.href = `https://sleep-brain.vercel.app/r?d=${encodedAnswers}`; }}
          style={{ ...subBtn, marginTop: '16px', fontSize: '14px' }}>
          ブラウザで診断結果を確認する →
        </button>
      )}
    </div></div>
  );

  if (phase === 'ready') return (
    <div style={wrap}><div style={card}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>😴</div>
      <h1 style={{ color: '#14244A', fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>診断結果を受け取る</h1>
      <p style={{ color: '#4D5875', fontSize: '13px', lineHeight: 1.7, marginBottom: '24px' }}>
        公式LINEを友達追加すると<br /><strong>あなたの診断結果がLINEに自動で届きます</strong>
      </p>
      <button onClick={handleAddFriend} style={greenBtn}>{lineIcon} 公式LINEを友達追加する</button>
    </div></div>
  );

  if (phase === 'following') return (
    <div style={wrap}><div style={card}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📲</div>
      <h2 style={{ color: '#14244A', fontSize: '17px', fontWeight: 900, marginBottom: '12px' }}>
        友達追加を完了してください
      </h2>
      <p style={{ color: '#4D5875', fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
        追加完了後にこの画面に戻ると<br /><strong>自動でLINEにメッセージが届きます</strong>
      </p>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#06C755',
            animation: `pulse 1.2s ease-in-out ${i*0.3}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes pulse{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
      <button onClick={handleAddFriend} style={greenBtn}>{lineIcon} もう一度友達追加ページを開く</button>
      <button onClick={handleManualSend} style={subBtn}>追加済みだが届かない場合はこちら</button>
    </div></div>
  );

  return (
    <div style={wrap}><div style={card}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
      <h2 style={{ color: '#14244A', fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>送信完了！</h2>
      <p style={{ color: '#4D5875', fontSize: '13px', lineHeight: 1.7, marginBottom: '20px' }}>
        LINEのトークに<br /><strong>あなたの睡眠診断結果</strong>が届いています🌙
      </p>
      <div style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#F0FFF4', border: '1.5px solid #86EFAC', marginBottom: '20px' }}>
        <p style={{ color: '#166534', fontSize: '12px', fontWeight: 600 }}>✓ LINEのトークを確認してください</p>
      </div>
      {encodedAnswers && (
        <button onClick={() => { window.location.href = `https://sleep-brain.vercel.app/r?d=${encodedAnswers}`; }}
          style={{ width: '100%', padding: '14px', borderRadius: '999px', fontWeight: 700, fontSize: '15px',
            border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7C83F6, #6ED6D3)',
            color: 'white', boxShadow: '0 4px 16px rgba(124,131,246,0.35)' }}>
          🔍 診断結果をブラウザで確認する
        </button>
      )}
    </div></div>
  );
}

export default function LiffPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', background: '#F4F8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#7C83F6', fontSize: '14px' }}>読み込み中...</p>
      </div>
    }>
      <LiffInner />
    </Suspense>
  );
}
