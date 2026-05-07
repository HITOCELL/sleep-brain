'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ShareResultLoader() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const d = params.get('d');
    if (!d) { router.replace('/'); return; }
    try {
      const answers = atob(d).split(',');
      if (answers.length < 20) throw new Error('invalid');
      localStorage.setItem('diagnosis_answers', JSON.stringify(answers));
      localStorage.setItem('diagnosis_line_added', '1');
      localStorage.setItem('diagnosis_submitted', '1');
      router.replace('/result');
    } catch {
      router.replace('/');
    }
  }, [router, params]);

  return (
    <div style={{
      minHeight: '100dvh', background: '#F4F8FF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ color: '#7C83F6', fontSize: '14px' }}>診断結果を読み込み中...</p>
    </div>
  );
}

export default function ShareResultPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#F4F8FF' }} />}>
      <ShareResultLoader />
    </Suspense>
  );
}
