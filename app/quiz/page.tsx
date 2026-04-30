'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { questions } from '@/lib/questions';

export default function QuizPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const question = questions[currentStep];
  const progress = (currentStep + 1) / questions.length;

  function handleSelect(value: string) {
    setSelected(value);
  }

  function handleNext() {
    if (!selected) return;
    const newAnswers = [...answers, selected];
    if (currentStep < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrentStep(currentStep + 1);
      setSelected(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('diagnosis_answers', JSON.stringify(newAnswers));
        localStorage.removeItem('diagnosis_email_submitted');
      }
      router.push('/email');
    }
  }

  function handleBack() {
    if (currentStep === 0) return;
    const prev = answers.slice(0, -1);
    setAnswers(prev);
    setCurrentStep(currentStep - 1);
    setSelected(answers[currentStep - 1] ?? null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* 選択肢の連番 (A→1, B→2, ...) */
  const optionIndex = (value: string) =>
    question.options.findIndex((o) => o.value === value) + 1;

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F8FF', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '430px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

        {/* ヘッダー */}
        <header style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 0 #E8EDFF' }}>
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={handleBack}
              style={{
                color: '#7C83F6', fontSize: '14px', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                opacity: currentStep === 0 ? 0 : 1,
                pointerEvents: currentStep === 0 ? 'none' : 'auto',
              }}
            >
              ← 戻る
            </button>
            <span style={{ color: '#14244A', fontWeight: 700, fontSize: '14px' }}>睡眠診断テスト</span>
            <span style={{ color: '#7C83F6', fontSize: '12px', fontWeight: 600, background: '#EEF0FF', padding: '4px 10px', borderRadius: '999px' }}>
              {currentStep + 1} / {questions.length}
            </span>
          </div>
          {/* プログレスバー */}
          <div style={{ height: '5px', background: '#EEF0FF' }}>
            <div style={{
              height: '5px', borderRadius: '0 3px 3px 0',
              background: 'linear-gradient(90deg, #7C83F6, #6ED6D3)',
              width: `${progress * 100}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px 20px', display: 'flex', flexDirection: 'column' }}>

          {/* 設問番号バッジ */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EEF0FF', padding: '4px 12px', borderRadius: '999px', marginBottom: '14px', width: 'fit-content' }}>
            <span style={{ color: '#7C83F6', fontSize: '12px', fontWeight: 700 }}>Q{currentStep + 1}</span>
            <span style={{ color: '#B0B5E8', fontSize: '10px' }}>/ {questions.length}</span>
          </div>

          {/* 質問文 */}
          <h2 style={{ color: '#14244A', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.6, marginBottom: '24px' }}>
            {question.text}
          </h2>

          {/* 選択肢 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
            {question.options.map((option) => {
              const isSelected = selected === option.value;
              const num = optionIndex(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  style={{
                    width: '100%', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px',
                    borderRadius: '18px',
                    border: `2px solid ${isSelected ? '#7C83F6' : '#EEF0FF'}`,
                    background: isSelected ? '#F7F8FF' : 'white',
                    boxShadow: isSelected ? '0 2px 12px rgba(124,131,246,0.20)' : '0 1px 4px rgba(60,50,120,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* 番号バッジ */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: isSelected ? 'linear-gradient(135deg, #7C83F6, #9EA3F4)' : '#F4F8FF',
                    border: `1.5px solid ${isSelected ? 'transparent' : '#E8EDFF'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isSelected ? 'white' : '#7C83F6',
                    fontSize: '14px', fontWeight: 700,
                    transition: 'all 0.15s',
                  }}>
                    {num}
                  </div>

                  {/* ラベル */}
                  <span style={{
                    fontSize: '14px', fontWeight: 500, lineHeight: 1.45,
                    color: isSelected ? '#14244A' : '#4D5875',
                    flex: 1,
                  }}>
                    {option.label}
                  </span>

                  {/* ラジオインジケーター */}
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isSelected ? '#7C83F6' : '#D4D8F5'}`,
                    background: isSelected ? '#7C83F6' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 次へボタン */}
          <div style={{ marginTop: 'auto' }}>
            <button
              onClick={handleNext}
              disabled={!selected}
              style={{
                width: '100%', padding: '16px', borderRadius: '999px',
                fontWeight: 700, fontSize: '15px', border: 'none',
                cursor: selected ? 'pointer' : 'not-allowed',
                background: selected ? 'linear-gradient(135deg, #6ED6D3, #50C8C4)' : '#E8EDFF',
                color: selected ? 'white' : '#B0B8D8',
                boxShadow: selected ? '0 6px 22px rgba(110,214,211,0.42)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {currentStep < questions.length - 1 ? '次へ' : '結果を受け取る'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
