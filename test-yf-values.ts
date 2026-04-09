import YahooFinance from 'yahoo-finance2';
const yahooFinance = new (YahooFinance as any)();

async function test() {
  const symbols = ["^XU100", "^XU030", "XU100.IS", "XU030.IS"];
  try {
    const quotes = await yahooFinance.quote(symbols);
    console.log(JSON.stringify(quotes, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
