
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new (YahooFinance as any)();

async function testYahoo() {
  try {
    const results = await yahooFinance.quote(['^XU100', 'THYAO.IS', 'USDTRY=X']);
    console.log("Yahoo Results:", results.map((r: any) => ({ symbol: r.symbol, price: r.regularMarketPrice })));
  } catch (e) {
    console.error("Yahoo test failed:", e);
  }
}
testYahoo();
