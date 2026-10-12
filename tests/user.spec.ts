import { test, expect } from './testSetup';
import { Page } from '@playwright/test';
import type { Order } from '../src/service/pizzaService';

type MockUser = {
    id: string;
    name: string;
    email: string;
    password: string;
    roles: { role: string }[];
};

async function mockUserApi(page: Page) {
    let loggedInUser: MockUser | undefined;
    const validUsers: Record<string, MockUser> = {
        'a@jwt.com': { id: '1', name: '常用名字', email: 'a@jwt.com', password: 'admin', roles: [{ role: 'admin' }] },
        'f@jwt.com': { id: '2', name: 'pizza franchisee', email: 'f@jwt.com', password: 'franchisee', roles: [{ role: 'franchisee' }] },
    };
    const franchises = [
        {
            id: 1,
            name: 'pizzaPocket',
            admins: [{ id: 2, name: 'pizza franchisee', email: 'f@jwt.com' }],
            stores: [],
        },
    ];
    const orders: Order[] = [];

    await page.route('**/api/auth', async (route) => {
        if (route.request().method() === 'POST') {
            const registerReq = route.request().postDataJSON();
            const user: MockUser = {
                id: String(Object.keys(validUsers).length + 1),
                name: registerReq.name,
                email: registerReq.email,
                password: registerReq.password,
                roles: [{ role: 'diner' }],
            };
            validUsers[user.email] = user;
            loggedInUser = user;
            await route.fulfill({ json: { user, token: 'mock-token' } });
            return;
        }

        if (route.request().method() === 'DELETE') {
            loggedInUser = undefined;
            await route.fulfill({ json: { message: 'logout successful' } });
            return;
        }

        const loginReq = route.request().postDataJSON();
        const user = validUsers[loginReq.email];
        if (!user || user.password !== loginReq.password) {
            await route.fulfill({ status: 404, json: { message: 'unknown user' } });
            return;
        }
        loggedInUser = user;
        expect(route.request().method()).toBe('PUT');
        await route.fulfill({ json: { user, token: 'mock-token' } });
    });

    await page.route('**/api/user/me', async (route) => {
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: loggedInUser });
    });

    await page.route('**/api/order/menu', async (route) => {
        const menuRes = [
            { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
            { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
        ];
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: menuRes });
    });

    await page.route(/\/api\/user\/([^/?]+)$/, async (route) => {
        expect(route.request().method()).toBe('PUT');
        const userId = route.request().url().match(/\/api\/user\/([^/?]+)/)?.[1];
        const user = Object.values(validUsers).find((candidate) => candidate.id === userId);
        const updateReq = route.request().postDataJSON();

        if (!user) {
            await route.fulfill({ status: 404, json: { message: 'unknown user' } });
            return;
        }

        if (updateReq.email !== user.email) {
            delete validUsers[user.email];
            user.email = updateReq.email;
            validUsers[user.email] = user;
        }
        user.name = updateReq.name;
        if (updateReq.password) {
            user.password = updateReq.password;
        }
        for (const franchise of franchises) {
            const admin = franchise.admins.find((candidate) => String(candidate.id) === user.id);
            if (admin) {
                admin.name = user.name;
                admin.email = user.email;
            }
        }
        loggedInUser = user;
        await route.fulfill({ json: { user, token: 'mock-token' } });
    });

    await page.route('**/api/order', async (route) => {
        const orderRes = {
            dinerId: loggedInUser?.id,
            orders,
            page: 1,
        };
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: orderRes });
    });

    await page.route(/\/api\/franchise\/([^/?]+)$/, async (route) => {
        expect(route.request().method()).toBe('GET');
        const userId = route.request().url().match(/\/api\/franchise\/([^/?]+)/)?.[1];
        const franchise = franchises.find((candidate) =>
            candidate.admins.some((admin) => String(admin.id) === userId)
        );
        await route.fulfill({ json: franchise ? [franchise] : [] });
    });
}

test('updateUser name', async ({ page }) => {
    await mockUserApi(page);
    const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
    await page.goto('/');
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Register' }).click();

    await page.getByRole('link', { name: 'pd' }).click();

    await expect(page.getByRole('main')).toContainText('pizza diner');

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.locator('h3')).toContainText('Edit user');
    await page.getByRole('textbox').first().fill('pizza dinerx');
    await page.getByRole('button', { name: 'Update' }).click();

    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

    await expect(page.getByRole('main')).toContainText('pizza dinerx');

    await page.getByRole('link', { name: 'Logout' }).click();
    await page.getByRole('link', { name: 'Login' }).click();

    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();

    await page.getByRole('link', { name: 'pd' }).click();

    await expect(page.getByRole('main')).toContainText('pizza dinerx');
});

test('updateUser email', async ({ page }) => {
    await mockUserApi(page);
    const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
    const updatedEmail = `updated${Math.floor(Math.random() * 10000)}@jwt.com`;
    await page.goto('/');
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Register' }).click();

    await page.getByRole('link', { name: 'pd' }).click();

    await expect(page.getByRole('main')).toContainText(email);

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.locator('h3')).toContainText('Edit user');
    await page.getByRole('textbox').nth(1).fill(updatedEmail);
    await page.getByRole('button', { name: 'Update' }).click();

    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

    await expect(page.getByRole('main')).toContainText(updatedEmail);

    await page.getByRole('link', { name: 'Logout' }).click();
    await page.getByRole('link', { name: 'Login' }).click();

    await page.getByRole('textbox', { name: 'Email address' }).fill(updatedEmail);
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();

    await page.getByRole('link', { name: 'pd' }).click();

    await expect(page.getByRole('main')).toContainText(updatedEmail);
});

test('updateUser password', async({ page }) => {
    await mockUserApi(page);
    const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
    await page.goto('/');
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Register' }).click();

    await page.getByRole('link', { name: 'pd' }).click();

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('#password').click();
    await page.locator('#password').fill('newPass');
    await page.getByRole('button', { name: 'Update' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();

    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);

    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('main')).toContainText('{"code":404,"message":"unknown user"}');
    
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('newPass');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('link', { name: 'pd' })).toBeVisible();
});

test ('updateUser franchisee', async({ page }) => {
    await mockUserApi(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'pf' }).click();
    
    await expect(page.getByText('pizza franchisee', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('textbox').first().click();
    await page.getByRole('textbox').first().fill('pizza franchiseex');
    await page.getByRole('button', { name: 'Update' }).click();

    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
    await expect(page.getByText('pizza franchiseex', { exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Logout' }).click();
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'pf' }).click();

    await expect(page.getByText('pizza franchiseex', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('textbox').first().click();
    await page.getByRole('textbox').first().fill('pizza franchisee');
    await page.getByRole('button', { name: 'Update' }).click();
    
    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
    await expect(page.getByText('pizza franchisee', { exact: true })).toBeVisible();
});

test('updateUser admin', async ({ page }) => {
    await mockUserApi(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: '常' }).click();
    
    await expect(page.getByText('常用名字', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('textbox').first().click();
    await page.getByRole('textbox').first().fill('常用名字x');
    await page.getByRole('button', { name: 'Update' }).click();

    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
    await expect(page.getByText('常用名字x', { exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Logout' }).click();
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: '常' }).click();

    await expect(page.getByText('常用名字x', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('textbox').first().click();
    await page.getByRole('textbox').first().fill('常用名字');
    await page.getByRole('button', { name: 'Update' }).click();
    
    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
    await expect(page.getByText('常用名字', { exact: true })).toBeVisible();
});
