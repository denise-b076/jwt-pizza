import { Page } from '@playwright/test';
import { test, expect } from './testSetup';
import { Role, User } from '../src/service/pizzaService';

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = { 
    'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
    'a@jwt.com': { id: '4', name: 'Big Admin', email: 'a@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] },
    'f@jwt.com': { id: '5', name: 'Franchise Man', email: 'f@jwt.com', password: 'f', roles: [{ role: Role.Franchisee }] } 
  };

  const franchises = [
    {
      id: 2,
      name: 'LotaPizza',
      stores: [
        { id: 4, name: 'Lehi' },
        { id: 5, name: 'Springville' },
        { id: 6, name: 'American Fork' },
      ],
    },
    { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
    { id: 4, name: 'topSpot', stores: [] },
  ];  

  const orders = [
    {
      id: 1,
      franchiseId: 2,
      storeId: 5,
      date: '2024-06-05T05:14:40.000Z',
      items: [
        {
          id: 1,
          menuId: 1,
          description: 'Veggie',
          price: 0.05
        }
      ]
    }
  ];

  await page.route('*/**/api/auth', async (route) => {
    if (route.request().method() == 'DELETE') {
      if (loggedInUser == undefined) {
        await route.fulfill({ status: 404, json: { error: 'Not found' } });
        return;        
      }
      loggedInUser = undefined;
      const logoutRes = {
        message: 'logout successful'
      };
      await route.fulfill({ json: logoutRes });
      return;
    }
    const loginReq = route.request().postDataJSON();
    const user = validUsers[loginReq.email];
    if (!user || user.password !== loginReq.password) {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
      return;
    }
    loggedInUser = validUsers[loginReq.email];
    const loginRes = {
      user: loggedInUser,
      token: 'abcdef',
    };
    expect(route.request().method()).toBe('PUT');
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });

  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route(/\/api\/franchise(?:\/[^/?]+)?(?:\?.*)?$/, async (route) => {
    if (route.request().method() == 'POST') {
      const franchiseCreationReq = route.request().postDataJSON();
      const franchiseCreationRes = {
        ...franchiseCreationReq,
        id: '5',
      };
      franchises.push(franchiseCreationRes);
      expect(route.request().method()).toBe('POST');
      await route.fulfill({ json: franchiseCreationRes });
      return;
    }

    else if (route.request().method() == 'DELETE') {
      const franchiseId = Number(new URL(route.request().url()).pathname.split('/').pop());
      const index = franchises.findIndex(
        (franchise) => Number(franchise.id) === franchiseId
      );
      if (index === -1) {
        await route.fulfill({ status: 404, json: { error: 'Not found' } });
        return;
      }
      franchises.splice(index, 1);
      const franchiseDeleteRes = {
        message: 'franchise deleted'
      };
      await route.fulfill({ json: franchiseDeleteRes });
      return;
    }

    const franchiseRes = { franchises };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/order', async (route) => {
    if (route.request().method() == 'GET') {
      const viewUserOrderRes = {
        dinerId: loggedInUser?.id,
        orders: orders,
        page: 1
      };
      await route.fulfill({ json: viewUserOrderRes });
      return;
    }
    const orderReq = route.request().postDataJSON();
    const orderRes = {
      order: { ...orderReq, id: 23, date: '2024-06-05T05:14:40.000Z' },
      jwt: 'eyJpYXQ',
    };
    orders.push(orderRes.order);
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: orderRes });
  });

  await page.goto('/');
}

test('login', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('logout', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.getByRole('link', { name: 'KC' })).not.toBeVisible();
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('button', { name: 'Order now' }).click();

  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  await expect(page.getByText('0.008')).toBeVisible();
});

test('about and history', async({ page }) => {
  await basicInit(page);

  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('main')).toContainText('The secret sauce');
  await page.getByRole('link', { name: 'History' }).click();
  await expect(page.getByRole('heading')).toContainText('Mama Rucci, my my');
});

test('order and view diner dashboard', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('button', { name: 'Order now' }).click();

  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('button', { name: 'Pay now' }).click();

  await page.getByRole('link', { name: 'KC' }).click();
  await expect(page.getByRole('main')).toContainText('Here is your history of all the good times.');
  await expect(page.locator('tbody')).toContainText('23');
});

test('create and delete a franchise', async({ page }) => {
  await basicInit(page);

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'BA' })).toBeVisible();

  await page.getByRole('link', { name: 'Admin' }).click();

  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await page.getByRole('textbox', { name: 'franchise name' }).click();
  await page.getByRole('textbox', { name: 'franchise name' }).fill('TestCool');
  await page.getByRole('textbox', { name: 'franchisee admin email' }).click();
  await page.getByRole('textbox', { name: 'franchisee admin email' }).fill('f@jwt.com');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('table')).toContainText('TestCool');

  await page.locator('tbody:nth-child(5) > .border-neutral-500 > .px-6 > .px-2').click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('cell', { name: 'TestCool' })).not.toBeVisible();
});