
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { YahooFinance } = require('yahoo-finance2');
const yahooFinance = new YahooFinance();

async function testYahoo2() {
  try {
    const result = await yahooFinance.quote('THYAO.IS');
    console.log(JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error("Yahoo Finance 2 failed:", err.message);
  }
}
testYahoo2();
