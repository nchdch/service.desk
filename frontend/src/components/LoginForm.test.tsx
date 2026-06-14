import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

const push = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    vi.restoreAllMocks();
  });

  it('redirects to / on successful login', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    render(<LoginForm />);

    await userEvent.type(
      screen.getByLabelText('Email'),
      'admin@virtualoff.local',
    );
    await userEvent.type(screen.getByLabelText('Пароль'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/');
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('shows an error message on invalid credentials', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Неверный email или пароль' }), {
        status: 401,
      }),
    );

    render(<LoginForm />);

    await userEvent.type(
      screen.getByLabelText('Email'),
      'admin@virtualoff.local',
    );
    await userEvent.type(screen.getByLabelText('Пароль'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(
      await screen.findByText('Неверный email или пароль'),
    ).toBeInTheDocument();
  });
});
