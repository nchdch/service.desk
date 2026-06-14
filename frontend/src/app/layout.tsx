import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import '@/styles/styles.css';

export const metadata: Metadata = {
  title: 'Виртуальный офис SD',
  description: 'Корпоративный портал — service desk, CMDB, база знаний',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
