import * as cheerio from "cheerio";

async function testCanliDovizIndices() {
  const url = "https://canlidoviz.com/borsa/endeksler";
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
      
      $('tr').each((i, el) => {
        const symbol = $(el).find('td:nth-child(1) a').text().trim();
        const price = $(el).find('td:nth-child(2)').text().trim();
        console.log(`Index Row ${i}: Symbol=${symbol}, Price=${price}`);
      });
    }
  } catch (e) {
    console.error(e);
  }
}
testCanliDovizIndices();
