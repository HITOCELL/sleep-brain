'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { questions } from '@/lib/questions';
import { track, getOrCreateSessionId } from '@/lib/track';

export default function QuizPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[][]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const newId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem('sleep_session_id', newId);
    localStorage.removeItem('diagnosis_submitted');
    localStorage.removeItem('diagnosis_line_added');
    track('quiz_start', 0);
  }, []);

  const question = questions[currentStep];
  const progress = (currentStep + 1) / questions.length;
  const isMulti = question.multi === true;

  function handleSelect(value: string) {
    if (isMulti) {
      setSelected((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    } else {
      setSelected([value]);
    }
  }

  function saveProgress(currentAnswers: string[][]) {
    const sessionId = getOrCreateSessionId();
    fetch('/api/diagnosis/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: currentAnswers, sessionId, userAgent: navigator.userAgent }),
    }).catch(() => {});
  }

  function handleNext() {
    if (selected.length === 0) return;
    const newAnswers = [...answers, selected];
    saveProgress(newAnswers);
    if (currentStep < questions.length - 1) {
      track('quiz_step', currentStep + 1);
      setAnswers(newAnswers);
      setCurrentStep(currentStep + 1);
      setSelected([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      track('quiz_complete', questions.length);
      if (typeof window !== 'undefined') {
        localStorage.setItem('diagnosis_answers', JSON.stringify(newAnswers));
        localStorage.removeItem('diagnosis_line_added');
      }
      router.push('/line');
    }
  }

  function handleBack() {
    if (currentStep === 0) return;
    const prev = answers.slice(0, -1);
    setAnswers(prev);
    setCurrentStep(currentStep - 1);
    setSelected(answers[currentStep - 1] ?? []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const optionIndex = (value: string) =>
    question.options.findIndex((o) => o.value === value) + 1;

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F8FF', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '430px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EEF0FF', padding: '4px 12px', borderRadius: '999px', width: 'fit-content' }}>
              <span style={{ color: '#7C83F6', fontSize: '12px', fontWeight: 700 }}>Q{currentStep + 1}</span>
              <span style={{ color: '#B0B5E8', fontSize: '10px' }}>/ {questions.length}</span>
            </div>
            {isMulti && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #FFF7DB, #FDEAB8)', color: '#B45309', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                ✓ 複数選択OK
              </div>
            )}
          </div>

          <h2 style={{ color: '#14244A', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.6, marginBottom: '20px' }}>
            {question.text}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
            {question.options.map((option) => {
              const isSelected = selected.includes(option.value);
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

                  <span style={{
                    fontSize: '14px', fontWeight: 500, lineHeight: 1.45,
                    color: isSelected ? '#14244A' : '#4D5875',
                    flex: 1,
                  }}>
                    {option.label}
                  </span>

                  {isMulti ? (
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                      border: `2px solid ${isSelected ? '#7C83F6' : '#D4D8F5'}`,
                      background: isSelected ? '#7C83F6' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isSelected ? '#7C83F6' : '#D4D8F5'}`,
                      background: isSelected ? '#7C83F6' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto' }}>
            {isMulti && selected.length > 0 && (
              <p style={{ color: '#7C83F6', fontSize: '12px', textAlign: 'center', marginBottom: '8px', fontWeight: 600 }}>
                {selected.length}個選択中
              </p>
            )}
            <button
              onClick={handleNext}
              disabled={selected.length === 0}
              style={{
                width: '100%', padding: '16px', borderRadius: '999px',
                fontWeight: 700, fontSize: '15px', border: 'none',
                cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
                background: selected.length === 0 ? '#E8EDFF' : 'linear-gradient(135deg, #6ED6D3, #50C8C4)',
                color: selected.length === 0 ? '#B0B8D8' : 'white',
                boxShadow: selected.length === 0 ? 'none' : '0 6px 22px rgba(110,214,211,0.42)',
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
