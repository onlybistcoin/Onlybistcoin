async function test() {
  try {
    const res = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=THYAO.IS,GARAN.IS", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
test();
