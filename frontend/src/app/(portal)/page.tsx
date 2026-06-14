import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getCurrentUser, ROLE_BADGE_TONE, ROLE_LABELS } from '@/lib/auth';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Card title={`Добро пожаловать, ${user.name}`} subtitle={user.email}>
      <dl className="vds-home__list">
        <div className="vds-home__row">
          <dt className="vds-home__label">Роль</dt>
          <dd>
            <Badge tone={ROLE_BADGE_TONE[user.role]}>
              {ROLE_LABELS[user.role]}
            </Badge>
          </dd>
        </div>
        {user.organizationName && (
          <div className="vds-home__row">
            <dt className="vds-home__label">Организация</dt>
            <dd>{user.organizationName}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
