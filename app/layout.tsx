import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SLS — StreamLineStadium | AI Operations Copilot",
  description: "Real-time AI Decision Copilot for FIFA World Cup Stadium Operations. Ingest ground reports, extract structured incidents, and generate ranked action recommendations with reasoning.",
  keywords: ["stadium operations", "stadium management", "AI decision copilot", "FIFA World Cup", "ops dashboard"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col antialiased text-slate-100 bg-slate-950">
        {children}
      </body>
    </html>
  );
}
