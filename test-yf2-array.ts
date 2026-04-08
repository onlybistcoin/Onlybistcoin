import YahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const yahooFinance = new YahooFinance();
    const result = await yahooFinance.quote(['THYAO.IS', 'GARAN.IS', 'AKBNK.IS']);
    console.log(result.map(r => `${r.symbol}: ${r.regularMarketPrice}`));
  } catch (e) {
    console.error(e);
  }
}
test();
