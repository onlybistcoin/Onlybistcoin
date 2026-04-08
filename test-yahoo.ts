async function test() {
  try {
    const symbols = ["THYAO.IS", "TRY=X", "GC=F", "SI=F", "XU100.IS"];
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const data = await res.json();
    console.log("Status:", res.status);
    if (data.quoteResponse && data.quoteResponse.result) {
      data.quoteResponse.result.forEach((q: any) => {
        console.log(`${q.symbol}: ${q.regularMarketPrice} (Change: ${q.regularMarketChangePercent}%)`);
      });
    } else {
      console.log(data);
    }
  } catch (e) {
    console.error(e);
  }
}
test();
