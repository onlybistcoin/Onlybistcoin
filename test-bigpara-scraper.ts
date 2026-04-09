import * as cheerio from "cheerio";

async function testScraper() {
  const url = "https://bigpara.hurriyet.com.tr/borsa/hisse-fiyatlari/";
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
        const cells = $(el).find('td');
        if (cells.length >= 3) {
          const symbol = $(cells[0]).text().trim().split(' ')[0];
          const priceStr = $(cells[1]).text().trim();
          if (i < 10) console.log(`Row ${i}: Symbol=${symbol}, PriceStr=${priceStr}`);
          if (symbol && symbol.length >= 2 && symbol.length <= 6) {
             count++;
          }
        }
      });
      console.log("Total symbols found via TR:", count);

      count = 0;
      $('.tBody ul').each((i, el) => {
        const symbol = $(el).find('.li_sembol a').text().trim();
        const priceStr = $(el).find('.li_son').text().trim();
        if (i < 10) console.log(`UL Row ${i}: Symbol=${symbol}, PriceStr=${priceStr}`);
        if (symbol) count++;
      });
      console.log("Total symbols found via UL:", count);
    } else {
      console.log("Response not OK:", res.status);
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

testScraper();
