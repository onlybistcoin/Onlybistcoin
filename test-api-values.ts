async function test() {
  try {
    const res = await fetch("http://127.0.0.1:3000/api/prices");
    const data = await res.json();
    console.log("THYAO:", data["THYAO"]);
    console.log("BTC-USDT:", data["BTC-USDT"]);
  } catch (e) {
    console.error(e);
  }
}
test();
