import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Espaço SOW — Caderno do Projeto',
  description: 'Ambientes, imagens e pranchas técnicas do projeto Espaço SOW.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
