import { test, expect, type Page } from '@playwright/test';

const PASSWORD = process.env.SEED_USER_PASSWORD;

if (!PASSWORD) {
  throw new Error(
    'SEED_USER_PASSWORD env var is required to run e2e tests (см. backend/.env)',
  );
}

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill(PASSWORD as string);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL('/');
}

async function logout(page: Page) {
  await page.getByRole('button', { name: 'Выйти' }).click();
  await page.waitForURL('/login');
}

test('неверный пароль показывает ошибку на /login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('client@virtualoff.local');
  await page.getByLabel('Пароль').fill('wrong-password');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page.getByText('Неверный email или пароль')).toBeVisible();
});

for (const email of [
  'client@virtualoff.local',
  'engineer@virtualoff.local',
  'manager@virtualoff.local',
]) {
  test(`${email}: видит «Работа», не видит «Управление»`, async ({
    page,
  }) => {
    await login(page, email);

    await expect(
      page.getByRole('heading', { name: 'Главная' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Оборудование' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Пользователи' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Организации' }),
    ).toHaveCount(0);

    await logout(page);
  });
}

test('admin@virtualoff.local: видит «Управление» и реальные данные на /users и /organizations', async ({
  page,
}) => {
  await login(page, 'admin@virtualoff.local');

  await expect(
    page.getByRole('link', { name: 'Пользователи' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Организации' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Пользователи' }).click();
  await page.waitForURL('/users');
  await expect(page.getByText('ООО Ромашка').first()).toBeVisible();

  await page.getByRole('link', { name: 'Организации' }).click();
  await page.waitForURL('/organizations');
  await expect(page.getByText('ООО Ромашка').first()).toBeVisible();

  await logout(page);
});
