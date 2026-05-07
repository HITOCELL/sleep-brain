import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div style={{ minHeight: '100dvh', background: '#0A1A4A', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '430px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

        {/* メイン画像：全幅 */}
        <Image
          src="/hero.jpg"
          alt="30秒でわかる睡眠診断テスト"
          width={430}
          height={600}
          priority
          unoptimized
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />

        {/* ボタンエリア */}
        <div style={{
          flex: 1,
          background: '#0A1A4A',
          padding: '28px 24px 52px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <Link
            href="/quiz"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #F9D423 0%, #FF8C00 100%)',
              color: '#14244A',
              fontWeight: 900,
              fontSize: '20px',
              padding: '22px',
              borderRadius: '999px',
              boxShadow: '0 8px 32px rgba(249,212,35,0.55)',
              textDecoration: 'none',
              letterSpacing: '0.04em',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif',
            }}
          >
            今すぐ無料で診断する →
          </Link>
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '11px',
            marginTop: '14px',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            所要時間 約30秒・完全無料
          </p>
        </div>

      </div>
    </div>
  );
}
