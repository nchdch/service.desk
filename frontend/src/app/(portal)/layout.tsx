import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="vds-shell">
      <Sidebar user={user} />
      <div className="vds-shell__content">
        <Topbar />
        <main className="vds-shell__main">{children}</main>
      </div>
    </div>
  );
}
