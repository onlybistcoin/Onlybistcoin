import * as cheerio from 'cheerio';

async function fetchGoogleFinancePrice(symbol: string) {
  const url = `https://www.google.com/finance/quote/${symbol}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const text = await res.text();
      const $ = cheerio.load(text);
      const price = $('div[data-last-price]').attr('data-last-price');
      if (price) return parseFloat(price.replace(/,/g, ''));
      
      const price2 = $('.YMlS1d').text();
      if (price2) return parseFloat(price2.replace(/,/g, ''));
    }
  } catch (err) {
    clearTimeout(timeoutId);
  }
  return null;
}

async function test() {
  const symbols = [
    "THYAO", "GARAN", "AKBNK", "EREGL", "KCHOL", "SAHOL", "BIMAS", "TOASO", "ARCLK", "TUPRS", "SISE", "DOHOL",
    "PETKM", "FROTO", "ASELS", "MGROS", "PGSUS", "TAVHL", "YKBNK", "EKGYO", "VESTL", "ODAS", "SMRTG", "CANTE",
    "ISCTR", "HALKB", "VAKBN", "TSKB", "ALARK", "ENKAI", "TKFEN", "GUBRF", "HEKTS", "SASA", "KONTR", "GESAN",
    "YEOTK", "ASTOR", "EUPWR", "CWENE", "ALFAS", "MIATK", "REEDR", "TABGD", "TARKM", "EBEBK", "KAYSE", "BIENY",
    "SDTTR", "ONCSM"
  ];
  const start = Date.now();
  const promises = symbols.map(s => fetchGoogleFinancePrice(`${s}:IST`));
  const results = await Promise.all(promises);
  const end = Date.now();
  console.log(`Fetched ${results.filter(r => r !== null).length}/${symbols.length} in ${end - start}ms`);
}
test();
