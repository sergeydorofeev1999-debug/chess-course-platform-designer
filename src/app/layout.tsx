import type { Metadata } from "next";
import NavbarWrapper from "@/components/NavbarWrapper";
import DirectionLayout from "@/components/DirectionLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Progress Academy",
  description: "Онлайн-платформа для шахматных курсов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co;"
        />
      </head>
      <body className="min-h-full antialiased">
        <NavbarWrapper />
        <DirectionLayout>
          <main>{children}</main>
        </DirectionLayout>
      </body>
    </html>
  );
}
