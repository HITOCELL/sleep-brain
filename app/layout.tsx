import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sleep Brain - 無料睡眠診断",
  description: "あなたの睡眠タイプを3分で見える化。Sleep Brain無料睡眠診断で、睡眠課題と改善の方向性を知ろう。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
