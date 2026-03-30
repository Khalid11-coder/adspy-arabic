import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "أدسباي العربي — منصة استخبارات الإعلانات المباشرة",
  description: "اكتشف أفضل إعلانات السوق السعودي في الوقت الفعلي. تحليل حملات ميتا وتيك توك وسناب شات.",
  keywords: ["ads spy", "أدسباي", "إعلانات سعودية", "تحليل إعلانات", "Meta ads", "TikTok ads"],
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-tajawal antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
