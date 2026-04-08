async function test() {
  try {
    const res = await fetch("http://127.0.0.1:3000/api/prices");
    const data = await res.json();
    console.log("BTC-USDT exists:", "BTC-USDT" in data);
    console.log("TRY=X exists:", "TRY=X" in data);
    console.log("GAG=X exists:", "GAG=X" in data);
  } catch (e) {
    console.error(e);
  }
}
test();
