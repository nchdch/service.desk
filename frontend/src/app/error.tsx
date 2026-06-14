'use client';

import { Button } from '@/components/ui/Button';

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="vds-state">
      <h2>Что-то пошло не так, попробуйте позже</h2>
      <Button onClick={() => reset()}>Повторить</Button>
    </div>
  );
}
