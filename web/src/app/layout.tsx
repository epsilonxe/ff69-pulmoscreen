import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PulmoScreen — ระบบคัดกรองความเสี่ยงมะเร็งปอด",
  description:
    "PulmoScreen: ต้นแบบซอฟต์แวร์คัดกรองความเสี่ยงมะเร็งปอดด้วยแบบจำลองเครื่องจักรเรียนรู้สูงสุด (FF69)",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={notoThai.className}>{children}</body>
    </html>
  );
}
