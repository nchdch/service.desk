'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Ticket,
  ClipboardList,
  Server,
  BookOpen,
  BarChart3,
  Users,
  Building2,
  LogOut,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { ROLE_LABELS } from '@/lib/roles';
import type { CurrentUser } from '@/lib/roles';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Ticket;
  comingSoon?: boolean;
}

const WORK_ITEMS: NavItem[] = [
  { href: '/coming-soon', label: 'Заявки', icon: Ticket, comingSoon: true },
  {
    href: '/coming-soon',
    label: 'Мои заявки',
    icon: ClipboardList,
    comingSoon: true,
  },
  {
    href: '/coming-soon',
    label: 'Оборудование',
    icon: Server,
    comingSoon: true,
  },
  {
    href: '/coming-soon',
    label: 'База знаний',
    icon: BookOpen,
    comingSoon: true,
  },
  {
    href: '/coming-soon',
    label: 'Аналитика',
    icon: BarChart3,
    comingSoon: true,
  },
];

const MANAGEMENT_ITEMS: NavItem[] = [
  { href: '/users', label: 'Пользователи', icon: Users },
  { href: '/organizations', label: 'Организации', icon: Building2 },
];

export interface SidebarProps {
  user: CurrentUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="vds-sidebar">
      <div className="vds-sidebar__brand">
        <Image
          className="vds-sidebar__brand-logo"
          src="/logo-mark.png"
          alt=""
          width={24}
          height={24}
        />
        <div className="vds-sidebar__brand-text">
          <span className="vds-sidebar__brand-title">Виртуальный офис</span>
          <span className="vds-sidebar__brand-subtitle">Service Desk</span>
        </div>
      </div>

      <nav className="vds-sidebar__nav">
        <div className="vds-sidebar__group">
          <div className="vds-sidebar__group-label">Работа</div>
          <div className="vds-sidebar__group-items">
            {WORK_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`vds-sidebar__item ${pathname === item.href ? 'vds-sidebar__item--active' : ''}`.trim()}
              >
                <item.icon />
                {item.label}
                {item.comingSoon && (
                  <Badge
                    tone="neutral"
                    size="sm"
                    className="vds-sidebar__item-count"
                  >
                    скоро
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </div>

        {user.role === 'ADMIN' && (
          <div className="vds-sidebar__group">
            <div className="vds-sidebar__group-label">Управление</div>
            <div className="vds-sidebar__group-items">
              {MANAGEMENT_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`vds-sidebar__item ${pathname === item.href ? 'vds-sidebar__item--active' : ''}`.trim()}
                >
                  <item.icon />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="vds-sidebar__user">
        <Avatar name={user.name} size="sm" />
        <div className="vds-sidebar__user-text">
          <div className="vds-sidebar__user-name">{user.name}</div>
          <div className="vds-sidebar__user-role">{ROLE_LABELS[user.role]}</div>
        </div>
        <IconButton label="Выйти" onClick={handleLogout}>
          <LogOut />
        </IconButton>
      </div>
    </aside>
  );
}
