import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PET UFC Russas | Quadro de Pontos",
  description: "Organize as tarefas do PET UFC Russas, acompanhe as entregas e dispute o ranking de pontos do grupo.",
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
