import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.evaluate(() => btoa('🚀'));
  } catch(e) {
    console.log(e.message);
  }
  await browser.close();
})();
