import puppeteer from 'puppeteer';

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const pageTitle = 'File:Renal_corpuscle.svg';
    const url = `https://commons.wikimedia.org/wiki/${pageTitle}`;

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const imageUrl = await page.evaluate(() => {
        const link = document.querySelector('.fullMedia a.internal') || document.querySelector('.fullMedia a');
        return link ? link.href : null;
    });

    console.log(`Extracted URL: ${imageUrl}`);
    await browser.close();
})();
