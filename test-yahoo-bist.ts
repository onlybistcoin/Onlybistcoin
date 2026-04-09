import YahooFinance from 'yahoo-finance2';
const yahooFinance = new (YahooFinance as any)();

async function testYahoo() {
  const symbols = ["THYAO.IS", "GARAN.IS", "AKBNK.IS", "XU100.IS"];
  try {
    const results = await yahooFinance.quote(symbols);
    console.log(JSON.stringify(results, null, 2));
  } catch (e) {
    console.error("Yahoo failed:", e);
  }
}

testYahoo();
