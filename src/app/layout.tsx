import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "블로그",
  description: "개인 홍보용 블로그",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
