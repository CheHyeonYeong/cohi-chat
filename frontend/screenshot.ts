import { chromium } from '@playwright/test';
import path from 'path';

const BASE = 'http://localhost:5173';
const OUT = './screenshots';

const pages = [
    { name: 'home', url: '/' },
    { name: 'login', url: '/login' },
    { name: 'signup', url: '/signup' },
];

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const fs = await import('fs');
    if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

    for (const { name, url } of pages) {
        await page.goto(BASE + url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        const file = path.join(OUT, `${name}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`saved: ${file}`);
    }

    await browser.close();
})();
