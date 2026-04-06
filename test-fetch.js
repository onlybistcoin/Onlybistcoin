import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  try {
    await page.evaluate(async () => {
      try {
        await fetch('http://example.com/' + 'a'.repeat(100000));
      } catch (e) {
        console.log('Fetch long URL error:', e.name, e.message);
      }
      
      try {
        await fetch('http://example.com/\n');
      } catch (e) {
        console.log('Fetch newline error:', e.name, e.message);
      }
      
      try {
        const longUrl = 'http://example.com/' + 'a'.repeat(100000);
        await fetch(longUrl);
      } catch (e) {
        console.log('Fetch long URL error:', e.name, e.message);
      }
    });
  } catch(e) {
    console.log('Puppeteer error:', e.message);
  }
  await browser.close();
})();
