import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pontua. | Ranking de membros",
  description: "Registre entregas, acompanhe a validação e veja o ranking mensal do grupo.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
