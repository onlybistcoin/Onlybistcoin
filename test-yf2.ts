import YahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const yahooFinance = new YahooFinance();
    const result = await yahooFinance.quote('THYAO.IS');
    console.log(result.regularMarketPrice);
  } catch (e) {
    console.error(e);
  }
}
test();
