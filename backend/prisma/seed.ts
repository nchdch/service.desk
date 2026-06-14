import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  const password = process.env.SEED_USER_PASSWORD;
  if (!password) {
    throw new Error('SEED_USER_PASSWORD is not set');
  }
  const passwordHash = await bcrypt.hash(password, 10);

  const organization = await prisma.organization.upsert({
    where: { id: DEMO_ORGANIZATION_ID },
    update: {},
    create: {
      id: DEMO_ORGANIZATION_ID,
      name: 'ООО Ромашка',
    },
  });

  const users: Array<{
    email: string;
    name: string;
    role: Role;
    organizationId?: string;
  }> = [
    { email: 'admin@virtualoff.local', name: 'Админ Админов', role: Role.ADMIN },
    { email: 'manager@virtualoff.local', name: 'Мария Руководитель', role: Role.MANAGER },
    { email: 'engineer@virtualoff.local', name: 'Иван Инженер', role: Role.ENGINEER },
    {
      email: 'client@virtualoff.local',
      name: 'Клиент Клиентов',
      role: Role.CLIENT,
      organizationId: organization.id,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
