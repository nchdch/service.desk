'use client';

import { usePathname } from 'next/navigation';

const TITLES: Record<string, string> = {
  '/': 'Главная',
  '/users': 'Пользователи',
  '/organizations': 'Организации',
  '/coming-soon': 'Раздел в разработке',
};

export function Topbar() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? '';

  return (
    <header className="vds-topbar">
      <h1 className="vds-topbar__title">{title}</h1>
    </header>
  );
}
