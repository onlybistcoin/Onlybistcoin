
async function testGoogleFinance(symbol: string) {
  const url = `https://www.google.com/finance/quote/${symbol}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (res.ok) {
      const text = await res.text();
      const match = text.match(/data-last-price="([^"]+)"/);
      if (match) {
        console.log(`${symbol}: ${match[1]}`);
      } else {
        const match2 = text.match(/class="YMlS1d"[^>]*>([^<]+)</);
        if (match2) {
          console.log(`${symbol} (pattern 2): ${match2[1]}`);
        } else {
          console.log(`${symbol}: Not found`);
        }
      }
    }
  } catch (err: any) {
    console.error(`${symbol} failed:`, err.message);
  }
}

async function runTests() {
  await testGoogleFinance("THYAO:IST");
  await testGoogleFinance("BZ=F:NYM");
  await testGoogleFinance("BRENT:COMMODITY");
}
runTests();
