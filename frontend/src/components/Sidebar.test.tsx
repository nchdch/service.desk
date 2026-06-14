import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import type { CurrentUser } from '@/lib/auth';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const baseUser: CurrentUser = {
  id: '1',
  email: 'client@virtualoff.local',
  name: 'Иван Клиентов',
  role: 'CLIENT',
  organizationId: null,
  organizationName: null,
};

describe('Sidebar', () => {
  it('shows the "Работа" section for every role', () => {
    render(<Sidebar user={baseUser} />);

    expect(screen.getByText('Заявки')).toBeInTheDocument();
    expect(screen.getByText('Мои заявки')).toBeInTheDocument();
    expect(screen.getByText('Оборудование')).toBeInTheDocument();
    expect(screen.getByText('База знаний')).toBeInTheDocument();
    expect(screen.getByText('Аналитика')).toBeInTheDocument();
  });

  it('hides "Управление" for non-admin roles', () => {
    render(<Sidebar user={baseUser} />);

    expect(screen.queryByText('Пользователи')).not.toBeInTheDocument();
    expect(screen.queryByText('Организации')).not.toBeInTheDocument();
  });

  it('shows "Управление" for ADMIN', () => {
    render(<Sidebar user={{ ...baseUser, role: 'ADMIN' }} />);

    expect(screen.getByText('Пользователи')).toBeInTheDocument();
    expect(screen.getByText('Организации')).toBeInTheDocument();
  });
});
