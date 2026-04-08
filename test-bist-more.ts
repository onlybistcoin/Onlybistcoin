import * as cheerio from "cheerio";

async function fetchGoogleFinancePrice(symbol: string) {
  const url = `https://www.google.com/finance/quote/${symbol}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (res.ok) {
      const text = await res.text();
      const $ = cheerio.load(text);
      const price = $('div[data-last-price]').attr('data-last-price');
      if (price) return parseFloat(price.replace(/,/g, ''));
      
      const price2 = $('.YMlS1d').text();
      if (price2) return parseFloat(price2.replace(/,/g, ''));
      
      console.log("Could not find price in HTML for", symbol);
    } else {
      console.log("Res not ok for", symbol, res.status);
    }
  } catch (err) {
    console.error(`[GoogleFinance] Failed for ${symbol}:`, err);
  }
  return null;
}

async function test() {
  const symbols = ["GARAN:IST", "AKBNK:IST", "EREGL:IST", "KCHOL:IST"];
  for (const sym of symbols) {
    const price = await fetchGoogleFinancePrice(sym);
    console.log(`${sym} price:`, price);
  }
}

test();
