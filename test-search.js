import http from 'http';
import https from 'https';

const symbols = ['KORDS.IS'];

const commonHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://finance.yahoo.com',
  'Referer': 'https://finance.yahoo.com/',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

async function testSpark() {
  for (const sym of symbols) {
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${sym}&range=1d&interval=5m`;
    try {
      const res = await fetch(url, { headers: commonHeaders });
      const data = await res.json();
      const item = data.spark?.result?.[0];
      const price = item?.response?.[0]?.meta?.regularMarketPrice;
      console.log(`Spark for ${sym}: ${price ? price : 'FAILED'}`);
      if (!price) console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Error for ${sym}:`, e.message);
    }
  }
}

testSpark();
