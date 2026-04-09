import * as cheerio from "cheerio";

async function testBloomberg() {
  const url = "https://www.bloomberght.com/borsa/hisse-fiyatlari";
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (res.ok) {
      const text = await res.text();
      const $ = cheerio.load(text);
      console.log("Page title:", $("title").text());
      
      let count = 0;
      $('tr').each((i, el) => {
        const symbol = $(el).find('td.name a').text().trim();
        const price = $(el).find('td.last-price').text().trim();
        if (symbol && i < 10) console.log(`Row ${i}: Symbol=${symbol}, Price=${price}`);
        if (symbol) count++;
      });
      console.log("Total symbols found:", count);
    }
  } catch (e) {
    console.error(e);
  }
}
testBloomberg();
