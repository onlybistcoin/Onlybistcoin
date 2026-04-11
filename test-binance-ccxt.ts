import ccxt from 'ccxt';
async function test() {
  const binance = new ccxt.binance();
  const tickers = await binance.fetchTickers();
  console.log(Object.keys(tickers).slice(0, 10));
  console.log(tickers['BTC/USDT']);
}
test();
