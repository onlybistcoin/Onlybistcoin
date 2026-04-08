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
      
      console.log("Could not find price in HTML. Length:", text.length);
    } else {
      console.log("Res not ok:", res.status);
    }
  } catch (err) {
    console.error(`[GoogleFinance] Failed for ${symbol}:`, err);
  }
  return null;
}

async function test() {
  const price = await fetchGoogleFinancePrice("THYAO:IST");
  console.log("THYAO price:", price);
}

test();
