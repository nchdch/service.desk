'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface LoginErrorResponse {
  error: string;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = (await res.json()) as LoginErrorResponse;
      setError(body.error);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <form className="vds-login__form" onSubmit={handleSubmit}>
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="username"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Пароль"
        type="password"
        name="password"
        autoComplete="current-password"
        fullWidth
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="vds-login__error">{error}</p>}
      <Button type="submit" loading={loading} fullWidth>
        Войти
      </Button>
    </form>
  );
}
