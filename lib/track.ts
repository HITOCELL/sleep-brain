export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'sleep_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

export function track(event: string, step?: number) {
  if (typeof window === 'undefined') return;
  const sessionId = getOrCreateSessionId();
  if (!sessionId) return;
  fetch('/api/diagnosis/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      step: step !== undefined ? step : null,
      sessionId,
      userAgent: navigator.userAgent,
    }),
  }).catch(() => {});
}
