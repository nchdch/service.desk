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
