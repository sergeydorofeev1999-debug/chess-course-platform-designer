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
    <html lang="ru" data-direction="a">
      <body className="min-h-full antialiased">
        <NavbarWrapper />
        <DirectionLayout>
          <main>{children}</main>
        </DirectionLayout>
      </body>
    </html>
  );
}
