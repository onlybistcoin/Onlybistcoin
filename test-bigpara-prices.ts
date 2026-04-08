async function test() {
  try {
    const res = await fetch("https://bigpara.hurriyet.com.tr/api/v1/borsa/hisseyuzeysel", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(data.data.slice(0, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
