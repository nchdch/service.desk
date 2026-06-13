# Фундамент (backend): NestJS + Prisma + PostgreSQL + Auth/RBAC — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заложить backend-фундамент портала «Виртуальный офис SD» — NestJS-приложение с PostgreSQL (через Prisma), сущностями `Organization`/`User`/`Role`, JWT-аутентификацией и RBAC, с сидингом тестовых пользователей на все 4 роли и e2e-тестами, покрывающими definition of done из спека.

**Architecture:** Единое NestJS-приложение в `backend/`. `PrismaModule` — глобальный модуль с единственным `PrismaService`, который используют `UsersService`, `OrganizationsService` и `AuthService`. Глобальный `JwtAuthGuard` требует валидный JWT для всех роутов, кроме помеченных `@Public()` (`POST /auth/login`). Глобальный `RolesGuard` проверяет роль пользователя по декоратору `@Roles(...)` для роутов с ограничением (`GET /organizations`, `GET /users` — только `ADMIN`).

**Tech Stack:** NestJS (TS), Prisma + `@prisma/client`, PostgreSQL 16 + Node.js 20 LTS (нативная установка на сервере 10.3.0.88, Ubuntu 24.04), `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`, `bcryptjs`, `class-validator`/`class-transformer`, Jest + Supertest (e2e).

**Спек:** [docs/superpowers/specs/2026-06-13-foundation-design.md](../specs/2026-06-13-foundation-design.md)

---

## Окружение и синхронизация с сервером

Node.js, npm и PostgreSQL установлены **только на сервере 10.3.0.88** (`vrtvs01`, Ubuntu 24.04, пользователь `vrtadmin`). На локальной машине (Windows) Node.js нет — там только редактируются файлы и работает git.

**Доступ к серверу:** `ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88` (ключ уже настроен, без пароля). Для команд с `sudo` нужен пароль пользователя `vrtadmin` — он не хранится в репозитории (см. локальную память Claude/секреты), использовать как `echo <SUDO_PASSWORD> | sudo -S <command>`.

**Модель синхронизации кода:**
- Репозиторий публичный на GitHub (`https://github.com/nchdch/service.desk.git`), текущая ветка `main`.
- Вся работа ведётся в новой ветке `feature/foundation-backend` — и локально (в git worktree), и в клоне на сервере (`~/service.desk`).
- На сервере включена настройка `receive.denyCurrentBranch=updateInstead` — это позволяет пушить из локального репозитория прямо в рабочую копию на сервере, и она сразу обновляется.
- **Локально добавлен git remote `server`**, указывающий на `~/service.desk` на 10.3.0.88 по SSH.

**Шаблон цикла на каждый шаг, где нужно что-то выполнить (build/test/npm/prisma/psql):**
1. Создать/изменить файл локально (Write/Edit).
2. `git add ... && git commit -m "..."` локально.
3. `git push server feature/foundation-backend` — синхронизирует рабочую копию на сервере.
4. `ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "cd ~/service.desk/backend && <команда>"` — выполнить команду на сервере и проверить вывод.

Когда команда на шаге создаёт файлы прямо на сервере (например `npx @nestjs/cli new`, `npx prisma migrate dev` создаёт `migrations/`), порядок обратный: сначала шаг 4 (выполнить на сервере и закоммитить там же), затем `git pull server feature/foundation-backend` локально, чтобы подтянуть созданные файлы для дальнейшего редактирования.

---

## Обзор файловой структуры

```
/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   ├── users/
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.module.ts
│   │   ├── organizations/
│   │   │   ├── organizations.service.ts
│   │   │   ├── organizations.controller.ts
│   │   │   └── organizations.module.ts
│   │   └── auth/
│   │       ├── auth.types.ts
│   │       ├── auth.service.ts
│   │       ├── auth.controller.ts
│   │       ├── auth.module.ts
│   │       ├── dto/login.dto.ts
│   │       ├── strategies/jwt.strategy.ts
│   │       ├── guards/jwt-auth.guard.ts
│   │       ├── guards/roles.guard.ts
│   │       └── decorators/{public,roles,current-user}.decorator.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── test/
│   │   └── auth.e2e-spec.ts
│   ├── .env.example
│   └── .env (не коммитится)
└── (без изменений: docs/, CLAUDE.md, CHANGELOG.md)
```

---

### Task 1: Подготовка Node.js на сервере и bootstrap NestJS-приложения

**Files:**
- Create: `backend/` (генерируется Nest CLI на сервере, затем подтягивается локально)
- Delete: `backend/src/app.controller.ts`, `backend/src/app.controller.spec.ts`, `backend/src/app.service.ts`
- Modify: `backend/src/app.module.ts`

- [x] **Step 1: Установить Node.js 20 LTS на сервере**

```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "echo <SUDO_PASSWORD> | sudo -S apt-get update"
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "echo <SUDO_PASSWORD> | sudo -S bash -c \"curl -fsSL https://deb.nodesource.com/setup_20.x | bash -\""
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "echo <SUDO_PASSWORD> | sudo -S apt-get install -y nodejs"
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "node --version && npm --version"
```
Ожидается: `node --version` выводит `v20.x.x`, `npm --version` — `10.x.x`.

- [x] **Step 2: Сгенерировать NestJS-проект на сервере**

```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "cd ~/service.desk && npx @nestjs/cli@latest new backend --package-manager npm --skip-git --language ts"
```
Ожидается: на сервере создаётся `~/service.desk/backend/` с рабочим NestJS-приложением (включая `node_modules/`).

- [x] **Step 3: Закоммитить сгенерированный проект на сервере**

```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "cd ~/service.desk && git add backend && git commit -m 'Bootstrap NestJS backend'"
```
Ожидается: коммит создан (`node_modules/` исключён сгенерированным `backend/.gitignore`).

- [x] **Step 4: Подтянуть сгенерированный проект локально**

```bash
git pull server feature/foundation-backend
```
Ожидается: в локальном worktree появляется `backend/` со всеми файлами, сгенерированными Nest CLI (без `node_modules/`).

- [x] **Step 5: Удалить шаблонный контроллер/сервис**

Удалить файлы: `backend/src/app.controller.ts`, `backend/src/app.controller.spec.ts`, `backend/src/app.service.ts`.

Реальные роуты появятся в модулях `auth`, `users`, `organizations` — корневой "Hello World" не нужен.

- [x] **Step 6: Заменить `backend/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';

@Module({})
export class AppModule {}
```

- [x] **Step 7: Commit и синхронизация с сервером**

```bash
git add backend
git commit -m "Remove default Nest scaffold controller and service"
git push server feature/foundation-backend
```

- [x] **Step 8: Проверить сборку на сервере**

```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "cd ~/service.desk/backend && npm run build"
```
Ожидается: завершается без ошибок, создаётся `~/service.desk/backend/dist/`.

---

### Task 2: PostgreSQL — установка на сервере и переменные окружения

**Files:**
- Create: `backend/.env.example`
- Create: `backend/.env` (на сервере, не коммитится)
- Modify: `backend/.gitignore` (если нужно)

- [x] **Step 1: Установить PostgreSQL 16 на сервере**

```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "echo <SUDO_PASSWORD> | sudo -S apt-get update"
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "echo <SUDO_PASSWORD> | sudo -S apt-get install -y postgresql postgresql-contrib"
```
Ожидается: устанавливается PostgreSQL 16 (версия по умолчанию в репозиториях Ubuntu 24.04).

- [x] **Step 2: Проверить, что служба запущена**

```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "systemctl is-active postgresql"
```
Ожидается: `active`.

- [x] **Step 3: Создать пользователя и базу для проекта**

```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "echo <SUDO_PASSWORD> | sudo -S -u postgres psql -c \"CREATE USER virtualoffsd WITH PASSWORD 'virtualoffsd';\""
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "echo <SUDO_PASSWORD> | sudo -S -u postgres psql -c \"CREATE DATABASE virtualoffsd OWNER virtualoffsd;\""
```
Ожидается: `CREATE ROLE` и `CREATE DATABASE`.

- [x] **Step 4: Проверить подключение от имени пользователя проекта**

```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "PGPASSWORD=virtualoffsd psql -U virtualoffsd -h localhost -d virtualoffsd -c 'SELECT 1;'"
```
Ожидается: вывод содержит строку с `1`.

- [x] **Step 5: Создать `backend/.env.example`**

```
DATABASE_URL="postgresql://virtualoffsd:virtualoffsd@localhost:5432/virtualoffsd?schema=public"
JWT_SECRET="change-me"
JWT_EXPIRES_IN="8h"
PORT=3000
SEED_USER_PASSWORD="ChangeMe123!"
```

- [x] **Step 6: Создать рабочий `backend/.env` на сервере**

```bash
git add backend/.env.example
git commit -m "Add local environment configuration template"
git push server feature/foundation-backend
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "cd ~/service.desk/backend && cp .env.example .env"
```

Для разработки значения из `.env.example` достаточны (это не продовые секреты).

- [x] **Step 7: Проверить `.gitignore`**

Открой `backend/.gitignore` (сгенерирован Nest CLI) и убедись, что в нём есть строка `.env`. Если отсутствует — добавь её, закоммить и синхронизируй (`git add backend/.gitignore && git commit -m "Ensure .env is gitignored" && git push server feature/foundation-backend`). `.env.example` не должен попадать под исключение (стандартный шаблон Nest исключает только конкретные `.env*` файлы, не `.env.example`).

---

### Task 3: Prisma — схема данных и первая миграция

**Files:**
- Modify: `backend/package.json`
- Create: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/`

- [x] **Step 1: Установить Prisma**

```bash
cd backend
npm install prisma --save-dev
npm install @prisma/client
```
**Важно (выявлено по ходу выполнения):** на сервере `npm install prisma` ставит актуальную major-версию (на момент выполнения — Prisma 7.x), которая убрала поддержку `url = env("DATABASE_URL")` в `datasource` блоке схемы (требует `prisma.config.ts`) и изменила вывод `prisma init`. Схема Task 3 (см. Step 3) написана для классической модели (Prisma 5/6). Поэтому фактически установлена последняя версия Prisma 6.x: `npm install prisma@6.19.3 --save-dev` и `npm install @prisma/client@6.19.3`. Это сохраняет схему как в Step 3 без изменений и совместимо с тем, что будут использовать последующие задачи (PrismaService и т.д.). Примечание: пакет `@prisma/engines` версии 6.19.3 тянет `@prisma/engines-version` из линейки 7.x (бинарники движка) — это не противоречит пинингу CLI/клиента на 6.19.3: формат схемы/миграций остаётся классическим (6.x), а движки 7.x с ним совместимы (`prisma migrate status`, `npm run build` и работа с БД проверены и работают корректно).

- [x] **Step 2: Инициализировать Prisma**

```bash
npx prisma init --datasource-provider postgresql
```
Ожидается: создаётся `prisma/schema.prisma`. Так как `backend/.env` уже существует с нашим `DATABASE_URL`, Prisma не станет его перезаписывать (может вывести предупреждение — это нормально).

С Prisma 7 `init` также создаёт `prisma.config.ts` и добавляет `/generated/prisma` в `.gitignore` — после перехода на Prisma 6.19.3 (см. Step 1) эти артефакты были удалены/откатены, так как они не нужны для классической модели схемы.

- [x] **Step 3: Заменить содержимое `backend/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  CLIENT
  ENGINEER
  MANAGER
  ADMIN
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users User[]
}

model User {
  id             String        @id @default(uuid())
  email          String        @unique
  passwordHash   String
  name           String
  role           Role
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id])
  isActive       Boolean       @default(true)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}
```

- [x] **Step 4: Применить миграцию**

```bash
npx prisma migrate dev --name init
```
Ожидается: создаётся `prisma/migrations/<timestamp>_init/migration.sql`, миграция применяется, в конце — "Your database is now in sync with your schema."

**Важно (выявлено по ходу выполнения):** `prisma migrate dev` завершился ошибкой `P3014` — пользователь БД `virtualoffsd` не имеет права `CREATEDB`, необходимого Prisma для создания shadow database, а доступа к суперпользователю `postgres` без sudo нет. Так как sudo для этой задачи запрещён, миграция была создана и применена без shadow database:
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel=./prisma/schema.prisma --script > prisma/migrations/<timestamp>_init/migration.sql
npx prisma migrate deploy
npx prisma generate
```
Результат идентичен тому, что создал бы `migrate dev` (та же SQL, та же запись в `_prisma_migrations`), но без необходимости создавать shadow database. Если в будущем понадобится `prisma migrate dev` в полном объёме (для diff'ов на лету), нужно будет выдать `virtualoffsd` право `CREATEDB` через суперпользователя `postgres`.

- [x] **Step 5: Проверить статус миграций**

```bash
npx prisma migrate status
```
Ожидается: "Database schema is up to date!"

- [x] **Step 6: Commit**

```bash
cd ..
git add backend/prisma backend/package.json backend/package-lock.json
git commit -m "Add Prisma schema with Organization and User models"
```

---

### Task 4: PrismaModule / PrismaService

**Files:**
- Create: `backend/src/prisma/prisma.service.ts`
- Create: `backend/src/prisma/prisma.module.ts`
- Modify: `backend/src/app.module.ts`

- [x] **Step 1: Установить `@nestjs/config`**

```bash
cd backend
npm install @nestjs/config
```

- [x] **Step 2: Создать `backend/src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [x] **Step 3: Создать `backend/src/prisma/prisma.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [x] **Step 4: Заменить `backend/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
})
export class AppModule {}
```

- [x] **Step 5: Проверить запуск**

```bash
npm run start:dev
```
Ожидается: в консоли "Nest application successfully started", без ошибок подключения к БД (PrismaService подключается на старте — требует БД из Task 2). Останови сервер (Ctrl+C).

- [x] **Step 6: Commit**

```bash
cd ..
git add backend
git commit -m "Add global PrismaModule"
```

---

### Task 5: Сидинг тестовых данных

**Files:**
- Create: `backend/prisma/seed.ts`
- Modify: `backend/package.json`

- [x] **Step 1: Установить зависимости**

```bash
cd backend
npm install bcryptjs
npm install -D @types/bcryptjs ts-node
```

- [x] **Step 2: Добавить секцию `prisma.seed` в `backend/package.json`**

Добавь на верхнем уровне `package.json` (рядом с `"scripts"`):
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

- [x] **Step 3: Создать `backend/prisma/seed.ts`**

```typescript
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
```

- [x] **Step 4: Запустить сидинг**

```bash
npx prisma db seed
```
Ожидается: "Running seed command `ts-node prisma/seed.ts` ..." и в конце "The seed command has been executed."

- [x] **Step 5: Проверить данные в БД**

```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "PGPASSWORD=virtualoffsd psql -U virtualoffsd -h localhost -d virtualoffsd -c 'SELECT email, role, \"organizationId\" FROM \"User\" ORDER BY role;'"
```
Ожидается: 4 строки — `admin`/`manager`/`engineer` с пустым `organizationId`, `client` с UUID `00000000-0000-0000-0000-000000000001`.

- [x] **Step 6: Commit**

```bash
cd ..
git add backend/prisma backend/package.json backend/package-lock.json
git commit -m "Add seed script for test users and demo organization"
```

---

### Task 6: UsersModule (сервис)

**Files:**
- Create: `backend/src/users/users.service.ts`
- Create: `backend/src/users/users.module.ts`
- Modify: `backend/src/app.module.ts`

- [x] **Step 1: Создать `backend/src/users/users.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findAllSafe() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
```

- [x] **Step 2: Создать `backend/src/users/users.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [x] **Step 3: Обновить `backend/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, UsersModule],
})
export class AppModule {}
```

- [x] **Step 4: Проверить сборку**

```bash
cd backend
npm run build
```

- [x] **Step 5: Commit**

```bash
cd ..
git add backend
git commit -m "Add UsersModule with email lookup and safe listing"
```

---

### Task 7: OrganizationsModule (сервис)

**Files:**
- Create: `backend/src/organizations/organizations.service.ts`
- Create: `backend/src/organizations/organizations.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Создать `backend/src/organizations/organizations.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.organization.findMany();
  }
}
```

- [ ] **Step 2: Создать `backend/src/organizations/organizations.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

@Module({
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
```

- [ ] **Step 3: Обновить `backend/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    OrganizationsModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 4: Проверить сборку**

```bash
cd backend
npm run build
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add backend
git commit -m "Add OrganizationsModule"
```

---

### Task 8: AuthModule — логин, /auth/me, глобальный JWT-guard

**Files:**
- Delete: `backend/test/app.e2e-spec.ts`
- Create: `backend/test/auth.e2e-spec.ts`
- Create: `backend/src/auth/auth.types.ts`
- Create: `backend/src/auth/dto/login.dto.ts`
- Create: `backend/src/auth/auth.service.ts`
- Create: `backend/src/auth/strategies/jwt.strategy.ts`
- Create: `backend/src/auth/decorators/public.decorator.ts`
- Create: `backend/src/auth/decorators/current-user.decorator.ts`
- Create: `backend/src/auth/guards/jwt-auth.guard.ts`
- Create: `backend/src/auth/auth.controller.ts`
- Create: `backend/src/auth/auth.module.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/main.ts`

- [ ] **Step 1: Удалить шаблонный e2e-тест**

Удалить `backend/test/app.e2e-spec.ts` (тестирует удалённый в Task 1 корневой роут).

- [ ] **Step 2: Написать `backend/test/auth.e2e-spec.ts` (пока будет падать)**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let password: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    password = process.env.SEED_USER_PASSWORD ?? '';
    if (!password) {
      throw new Error('SEED_USER_PASSWORD is not set (проверьте backend/.env)');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in each seeded user and returns an access token', async () => {
    for (const email of [
      'admin@virtualoff.local',
      'manager@virtualoff.local',
      'engineer@virtualoff.local',
      'client@virtualoff.local',
    ]) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(email);
    }
  });

  it('rejects login with a wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@virtualoff.local', password: 'wrong-password' })
      .expect(401);
  });

  it('returns the current user on /auth/me with a valid token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'engineer@virtualoff.local', password })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);

    expect(res.body.email).toBe('engineer@virtualoff.local');
    expect(res.body.role).toBe('ENGINEER');
  });

  it('rejects /auth/me without a token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});
```

- [ ] **Step 3: Запустить e2e-тесты и убедиться, что они падают**

```bash
cd backend
npm run test:e2e
```
Ожидается: FAIL — `/auth/login` возвращает 404 (роут пока не существует).

- [ ] **Step 4: Установить зависимости auth**

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt class-validator class-transformer
npm install -D @types/passport-jwt
```

- [ ] **Step 5: Создать `backend/src/auth/auth.types.ts`**

```typescript
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
}
```

- [ ] **Step 6: Создать `backend/src/auth/dto/login.dto.ts`**

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}
```

- [ ] **Step 7: Создать `backend/src/auth/auth.service.ts`**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthenticatedUser, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    };
  }

  login(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
```

- [ ] **Step 8: Создать `backend/src/auth/strategies/jwt.strategy.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser, JwtPayload } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      organizationId: payload.organizationId,
    };
  }
}
```

- [ ] **Step 9: Создать декораторы**

`backend/src/auth/decorators/public.decorator.ts`:
```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

`backend/src/auth/decorators/current-user.decorator.ts`:
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

- [ ] **Step 10: Создать `backend/src/auth/guards/jwt-auth.guard.ts`**

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

- [ ] **Step 11: Создать `backend/src/auth/auth.controller.ts`**

```typescript
import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
```

- [ ] **Step 12: Создать `backend/src/auth/auth.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, { provide: APP_GUARD, useClass: JwtAuthGuard }],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 13: Обновить `backend/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    OrganizationsModule,
    AuthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 14: Обновить `backend/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 15: Запустить e2e-тесты и убедиться, что они проходят**

```bash
npm run test:e2e
```
Ожидается: PASS, 4 теста зелёные. (Требуется запущенный и засеянный PostgreSQL из Task 2/5.)

- [ ] **Step 16: Commit**

```bash
cd ..
git add backend
git commit -m "Add JWT authentication: login and /auth/me"
```

---

### Task 9: RBAC — Roles guard, /organizations и /users

**Files:**
- Modify: `backend/test/auth.e2e-spec.ts`
- Create: `backend/src/auth/decorators/roles.decorator.ts`
- Create: `backend/src/auth/guards/roles.guard.ts`
- Modify: `backend/src/auth/auth.module.ts`
- Create: `backend/src/users/users.controller.ts`
- Modify: `backend/src/users/users.module.ts`
- Create: `backend/src/organizations/organizations.controller.ts`
- Modify: `backend/src/organizations/organizations.module.ts`

- [ ] **Step 1: Дополнить `backend/test/auth.e2e-spec.ts`**

Добавить новый тест внутрь того же `describe`, после существующих:

```typescript
  it('allows admin but blocks other roles on /organizations and /users', async () => {
    const adminToken = (
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@virtualoff.local', password })
        .expect(201)
    ).body.accessToken;

    const orgsRes = await request(app.getHttpServer())
      .get('/organizations')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(orgsRes.body)).toBe(true);

    const usersRes = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(usersRes.body)).toBe(true);
    expect(usersRes.body[0].passwordHash).toBeUndefined();

    for (const email of [
      'manager@virtualoff.local',
      'engineer@virtualoff.local',
      'client@virtualoff.local',
    ]) {
      const token = (
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password })
          .expect(201)
      ).body.accessToken;

      await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    }
  });
```

- [ ] **Step 2: Запустить e2e-тесты и убедиться, что новый тест падает**

```bash
cd backend
npm run test:e2e
```
Ожидается: FAIL на новом тесте — `/organizations` возвращает 404 (роута пока нет).

- [ ] **Step 3: Создать `backend/src/auth/decorators/roles.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 4: Создать `backend/src/auth/guards/roles.guard.ts`**

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from '../auth.types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return requiredRoles.includes(user.role);
  }
}
```

- [ ] **Step 5: Зарегистрировать `RolesGuard` как глобальный — обновить `backend/src/auth/auth.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 6: Создать `backend/src/users/users.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAllSafe();
  }
}
```

- [ ] **Step 7: Обновить `backend/src/users/users.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 8: Создать `backend/src/organizations/organizations.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }
}
```

- [ ] **Step 9: Обновить `backend/src/organizations/organizations.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
```

- [ ] **Step 10: Запустить e2e-тесты и убедиться, что все проходят**

```bash
npm run test:e2e
```
Ожидается: PASS, все 5 тестов зелёные.

- [ ] **Step 11: Commit**

```bash
cd ..
git add backend
git commit -m "Add role-based access control for /organizations and /users"
```

---

### Task 10: Финальная проверка, README, CHANGELOG

**Files:**
- Create: `backend/README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Создать `backend/README.md`**

```markdown
# Backend — Виртуальный офис SD

NestJS + Prisma + PostgreSQL. Backend-фундамент портала: пользователи, организации-клиенты, аутентификация и RBAC.

## Запуск (сервер 10.3.0.88, Ubuntu 24.04)

1. Убедиться, что установлены Node.js 20 LTS и PostgreSQL 16 (через NodeSource/apt — см. `docs/superpowers/plans/2026-06-13-foundation-implementation.md`, задачи 1-2), а в PostgreSQL создана база `virtualoffsd` и пользователь `virtualoffsd`.

2. Скопировать `.env.example` в `.env` (значения по умолчанию подходят для разработки):
   ```bash
   cp .env.example .env
   ```

3. Установить зависимости, применить миграции и сидинг:
   ```bash
   npm install
   npx prisma migrate dev
   npx prisma db seed
   ```

4. Запустить:
   ```bash
   npm run start:dev
   ```

5. Тесты:
   ```bash
   npm run test:e2e
   ```

## Тестовые пользователи (после сидинга)

Пароль для всех — значение `SEED_USER_PASSWORD` из `.env`.

| Email | Роль | Организация |
|---|---|---|
| admin@virtualoff.local | ADMIN | — |
| manager@virtualoff.local | MANAGER | — |
| engineer@virtualoff.local | ENGINEER | — |
| client@virtualoff.local | CLIENT | ООО Ромашка |

## API

- `POST /auth/login` — `{ email, password }` → `{ accessToken, user }`
- `GET /auth/me` — текущий пользователь (требует `Authorization: Bearer <token>`)
- `GET /organizations` — список организаций (только ADMIN)
- `GET /users` — список пользователей (только ADMIN)
```

- [ ] **Step 2: Полная проверка**

```bash
cd backend
npm run build
npm run test:e2e
```
Ожидается: оба шага без ошибок.

- [ ] **Step 3: Ручная smoke-проверка через curl**

Запустить сервер в фоне на сервере:
```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "cd ~/service.desk/backend && (npm run start:dev > /tmp/nest.log 2>&1 &) ; sleep 8"
```

Логин клиента — ожидается ответ с непустым `accessToken`:
```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 'curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"client@virtualoff.local\",\"password\":\"ChangeMe123!\"}"'
```

Скопировать значение `accessToken` из ответа и проверить `/organizations` — ожидается код `403`:
```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 'curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/organizations -H "Authorization: Bearer <accessToken из предыдущего шага>"'
```

Остановить dev-сервер:
```bash
ssh -i ~/.ssh/virtualoffsd_server vrtadmin@10.3.0.88 "pkill -f 'nest start'"
```

- [ ] **Step 4: Обновить `CHANGELOG.md`**

Добавить в конец корневого `CHANGELOG.md` новый раздел (после существующих записей, тот же стиль):

```markdown

## 2026-06-13 — Backend-фундамент (подпроект 0)

- Создан backend на NestJS + Prisma + PostgreSQL (папка `backend/`)
- Модель данных: `Organization`, `User` (роли CLIENT/ENGINEER/MANAGER/ADMIN)
- Node.js 20 LTS и PostgreSQL 16 установлены нативно на сервере 10.3.0.88 (Ubuntu, через apt/NodeSource — без Docker, недоступен на машине разработки)
- Реализована JWT-аутентификация (`POST /auth/login`, `GET /auth/me`) и RBAC (`GET /organizations`, `GET /users` — только ADMIN)
- Сидинг: демо-организация + 4 тестовых пользователя (по одному на роль)
- e2e-тесты покрывают аутентификацию и RBAC
```

- [ ] **Step 5: Commit**

```bash
git add backend/README.md CHANGELOG.md
git commit -m "Add backend README and changelog entry for Foundation"
```

---

## Definition of done (из спека)

1. ✅ PostgreSQL запущен как служба на сервере 10.3.0.88, миграции применяются без ошибок, сидинг создаёт организацию и 4 пользователей (Task 2, 3, 5).
2. ✅ `POST /auth/login` для каждого из 4 пользователей возвращает `200` и токен (Task 8, тест 1).
3. ✅ `GET /auth/me` с токеном возвращает корректные `email`/`role`/`organizationId` (Task 8, тест 3).
4. ✅ `GET /organizations` и `GET /users`: `200` для admin, `403` для остальных (Task 9, тест).
5. ✅ `npm run test:e2e` зелёный (Task 8 и 9).
