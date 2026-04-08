async function test() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
test();
