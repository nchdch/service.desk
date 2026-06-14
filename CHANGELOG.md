# Журнал изменений и решений

Здесь фиксируются ключевые решения и изменения по проекту в хронологическом порядке.

## 2026-06-13 — Старт проекта

- Определена область проекта: корпоративный портал для IT-аутсорсинговой компании (service desk + CMDB + база знаний + AI-ассистент + аналитика)
- Архитектурные решения:
  - Технологический стек: Node.js/TypeScript (NestJS + Next.js/React + PostgreSQL)
  - Подход: разработка с нуля (greenfield)
  - Структура портала: единая система с ролями (клиент, инженер, руководитель/диспетчер, админ)
  - AI-ассистент (killer-фича): 4 приоритетных сценария — помощник инженера по заявке, чат-бот для клиентов, авто-классификация/роутинг заявок, AI-аналитика на естественном языке
- Создана базовая документация: `CLAUDE.md` (главный контекст проекта), `docs/TZ.md` (техническое задание v0.1)
- Настроены кастомные сабагенты Claude Code в `.claude/agents/` (code-search, quick-task, developer, architect) для распределения задач по моделям
- Установлен плагин `superpowers` (TDD, debugging, planning skills) — глобально
- Подключён GitHub-репозиторий проекта: https://github.com/nchdch/service.desk (создан, пока пуст)
- Инициализирован локальный git-репозиторий, добавлен remote `origin`, создан `.gitignore`
- Ожидается от пользователя: доступ к серверу для деплоя

## 2026-06-13 — Push в GitHub и разведка сервера

- Первый коммит запушен в GitHub: https://github.com/nchdch/service.desk (ветка `main`)
- Проведена первичная read-only разведка сервера деплоя (хост `vrtvs01`, 10.3.0.88):
  - ОС: Ubuntu 24.04.4 LTS (x86_64)
  - Ресурсы: 2 vCPU, 3.8 GB RAM, диск 19 GB (свободно ~11 GB), swap 3.8 GB
  - Docker, Node.js, PostgreSQL, nginx — не установлены; есть git и python3
  - sudo для пользователя vrtadmin требует пароль
- `docs/TZ.md` обновлён: раздел 5 дополнен фактической конфигурацией сервера, в раздел 7 добавлен открытый вопрос про объём диска

## 2026-06-13 — Backend-фундамент (подпроект 0)

- Создан backend на NestJS + Prisma + PostgreSQL (папка `backend/`)
- Модель данных: `Organization`, `User` (роли CLIENT/ENGINEER/MANAGER/ADMIN)
- Node.js 20 LTS и PostgreSQL 16 установлены нативно на сервере 10.3.0.88 (Ubuntu, через apt/NodeSource — без Docker, недоступен на машине разработки)
- Реализована JWT-аутентификация (`POST /auth/login`, `GET /auth/me`) и RBAC (`GET /organizations`, `GET /users` — только ADMIN)
- Сидинг: демо-организация + 4 тестовых пользователя (по одному на роль)
- e2e-тесты покрывают аутентификацию и RBAC

## 2026-06-14 — Frontend-фундамент (подпроект 1)

- Создан фронтенд на Next.js 15 (App Router) + React 19 + TypeScript (`frontend/`), порт 3001
- Аутентификация — BFF: httpOnly cookie `session` (JWT), Route Handlers `/api/auth/login`/`/api/auth/logout`, `middleware.ts` защищает все маршруты, кроме `/login`
- Перенесена дизайн-система из `design/design-system/` (токены, шрифты Golos Text/JetBrains Mono, лого) в `frontend/src/styles/` и `frontend/public/`
- Портированы UI-компоненты: Button, IconButton, Input, Card, Badge, Avatar, DataTable; новые — Sidebar (ролевая навигация), Topbar, LoginForm, AccessDenied
- Layout: Sidebar с группами «Работа» (все роли, заглушка `/coming-soon`) и «Управление» (только ADMIN: Пользователи, Организации) + Topbar
- Страницы: «Главная» (имя/email, роль, организация), «Пользователи» и «Организации» (ADMIN, `DataTable`, 403 → «Доступ запрещён»)
- Backend: добавлено поле `organizationName` в ответы `GET /users` и `GET /auth/me`
- Тесты: Vitest + React Testing Library (LoginForm, Sidebar, DataTable), Playwright e2e (логин под 4 ролями, навигация, logout)
- Фронтенд развёрнут на сервере 10.3.0.88, порт 3001 (`nohup npm run start`, по аналогии с backend)

## 2026-06-14 — Прод-фронтенд перенесён на порт 80

- На node-бинарь (`/usr/bin/node`) выдан `cap_net_bind_service` (`setcap`), что позволяет процессу Next.js слушать привилегированный порт без root
- Прод-инстанс фронтенда перезапущен на порту 80 (`next start -p 80`) — теперь доступен по `http://10.3.0.88/` без указания порта
- Порт 3001 остаётся конфигурацией для dev/e2e (`npm run dev`, `playwright.config.ts`); прод использует порт 80

## 2026-06-14 — Фикс: вход не работал на проде (Secure-cookie по HTTP)

- Баг: cookie `session` выставлялась с `secure: NODE_ENV === 'production'`, а `next start` всегда переводит `NODE_ENV` в `production` — флаг `Secure` включался даже без TLS. Браузер отказывался сохранять такую cookie для `http://10.3.0.88` (не secure-контекст), из-за чего после входа пользователя возвращало на `/login`
- Исправление: `secure` теперь определяется по фактическому протоколу запроса (`request.nextUrl.protocol === 'https:'`) — корректно работает и по HTTP сейчас, и по HTTPS при подключении TLS в будущем
- Прод пересобран и перезапущен на порту 80
