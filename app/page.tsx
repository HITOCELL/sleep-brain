import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div style={{ minHeight: '100dvh', background: '#B8C4F0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '430px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

        {/* メイン画像：全幅・JPEG（PNG比80%軽量） */}
        <Image
          src="/UILP.jpg"
          alt="睡眠診断テスト"
          width={304}
          height={445}
          priority
          unoptimized
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />

        {/* ボタンエリア */}
        <div style={{
          flex: 1,
          background: 'white',
          padding: '28px 24px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Link
            href="/quiz"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #6ED6D3 0%, #50C8C4 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '17px',
              padding: '18px',
              borderRadius: '999px',
              boxShadow: '0 6px 24px rgba(110,214,211,0.50)',
              textDecoration: 'none',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif',
            }}
          >
            今すぐ診断をはじめる
          </Link>
        </div>

      </div>
    </div>
  );
}
