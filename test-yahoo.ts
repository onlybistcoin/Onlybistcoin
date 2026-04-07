
async function testYahoo() {
  const symbols = "THYAO.IS,GARAN.IS,GC=F,TRY=X";
  const url = `https://query1.finance.yahoo.com/v8/finance/quoteSummary/${encodeURIComponent("THYAO.IS")}?modules=price`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/'
      }
    });
    
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await res.text();
      console.log(`Error body: ${text}`);
    }
  } catch (err: any) {
    console.error("Fetch failed:", err.message);
  }
}

testYahoo();
