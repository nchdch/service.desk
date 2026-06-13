# Подпроект 0: Фундамент — дизайн

**Дата:** 2026-06-13
**Статус:** утверждён, готов к написанию плана реализации

## Контекст

Первый из подпроектов реализации корпоративного портала «Виртуальный офис SD» (см. [docs/TZ.md](../../TZ.md)). Декомпозиция проекта на подпроекты: 0. Фундамент → 1. Service Desk → 2. CMDB → 3. База знаний → 4. AI-ассистент.

Цель фундамента — заложить backend-основу (NestJS + PostgreSQL + Prisma), на которой будут строиться все остальные модули: авторизация, роли, базовая модель пользователей и организаций-клиентов.

**Вне объёма фундамента:**
- Frontend и портирование готовой дизайн-системы (`design/`) — это часть подпроекта 1 (Service Desk), где уже есть готовый UI-кит «Рабочее место инженера».
- Docker Compose для деплоя на сервер (10.3.0.88) — отдельный вопрос, не блокирует разработку.
- Бизнес-сущности Ticket, Asset и т.д. — появятся в соответствующих подпроектах.

## Технический подход

NestJS + **Prisma** (ORM) + **Passport-JWT** (аутентификация) + bcrypt (хеширование паролей) + кастомный RBAC (декоратор `@Roles()` + guard).

Prisma выбрана за schema-first подход (единый читаемый `schema.prisma`), автогенерируемый типобезопасный клиент и встроенные миграции — это также облегчит будущей AI-аналитике (ТЗ §3.4, сценарий 4) понимание структуры данных.

## Структура репозитория

Backend выносится в отдельную папку как сиблинг будущего `frontend/` (появится в подпроекте 1). Монорепо-тулинг (npm workspaces/Turborepo) пока не вводится — преждевременно для одного пакета.

```
/
├── backend/
│   ├── src/
│   │   ├── main.ts, app.module.ts
│   │   ├── auth/          — контроллер, сервис, JWT/local-стратегии, guards, decorators
│   │   ├── users/          — сервис + DTO
│   │   ├── organizations/  — сервис + DTO
│   │   ├── prisma/          — PrismaModule/PrismaService
│   │   └── common/           — enum Role и общие типы
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── test/                — e2e-тесты (auth flow, RBAC)
│   ├── .env.example
│   └── package.json
├── docker-compose.yml        — только PostgreSQL для локальной разработки
├── docs/
├── CLAUDE.md
└── CHANGELOG.md
```

Менеджер пакетов — npm.

## Модель данных

Минимальный набор сущностей: `Organization`, `User`, enum `Role`.

```prisma
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

**Бизнес-правило (валидируется на уровне сервиса, не constraint-ом БД):** `organizationId` обязателен для `role = CLIENT` (клиент — представитель компании-клиента, привязка к `Organization` обеспечивает изоляцию данных). Для `ENGINEER`/`MANAGER`/`ADMIN` (внутренние сотрудники компании-исполнителя) `organizationId = null`.

**Сидинг** (`prisma/seed.ts`): создаёт одну демо-организацию и по одному пользователю на каждую из 4 ролей (admin/manager/engineer без организации, client — привязан к демо-организации). Все 4 тестовых пользователя получают один и тот же пароль из переменной окружения `SEED_USER_PASSWORD` — этого достаточно для проверки RBAC, отдельные пароли на роль не нужны.

## Auth и RBAC

**Эндпоинты:**
- `POST /auth/login` — `{ email, password }` → `{ accessToken, user: { id, email, name, role, organizationId } }`. Пароль проверяется через bcrypt.
- `GET /auth/me` — для любого авторизованного пользователя, возвращает данные из токена.
- `GET /organizations` и `GET /users` — доступны только роли `ADMIN` (список всех организаций/пользователей соответственно).

**Механизм:**
- JWT access-токен без refresh-токена (рефреш — усложнение, нужное при появлении фронтенда с сессиями; решается в подпроекте 1 при необходимости). Срок жизни токена — из `.env` (например, 8 часов).
- Глобальный `JwtAuthGuard` + декоратор `@Public()` помечает `/auth/login` как единственный открытый эндпоинт.
- `@Roles(Role.ADMIN, ...)` + `RolesGuard` — проверка роли пользователя из payload токена.
- Ошибки: `401` — неверные креды/токен, `403` — роль не подходит (стандартные исключения NestJS).

**Тесты (e2e):**
- Логин: успех для каждой из 4 ролей, ошибка при неверном пароле.
- `/auth/me`: корректные данные с валидным токеном, `401` без токена/с невалидным.
- RBAC: `/organizations` и `/users` → `200` для admin, `403` для client/engineer/manager.

## Окружение разработки

- `docker-compose.yml` в корне репозитория — один сервис `postgres:16-alpine`, volume для персистентности, порт 5432.
- `backend/.env.example` — `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `SEED_USER_PASSWORD`.
- Локальный запуск: `docker compose up -d` → `cd backend && npm install` → `npx prisma migrate dev` → `npx prisma db seed` → `npm run start:dev`.

## Критерии готовности (definition of done)

1. PostgreSQL поднимается через `docker compose up -d`, миграции применяются без ошибок, сидинг создаёт организацию и 4 пользователей (по одному на роль).
2. `POST /auth/login` для каждого из 4 пользователей возвращает `200` и токен.
3. `GET /auth/me` с этим токеном возвращает корректные `email`/`role`/`organizationId`.
4. `GET /organizations` и `GET /users`: `200` для admin, `403` для остальных трёх ролей.
5. `npm run test:e2e` зелёный (покрывает пп. 2–4).
