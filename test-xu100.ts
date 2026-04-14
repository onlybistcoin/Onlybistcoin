import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
async function test() {
  try {
    const res = await yahooFinance.quote(["XU100.IS", "XU030.IS"]);
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
test();
