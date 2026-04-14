async function test() {
  const res = await fetch('http://localhost:3000/api/prices');
  const data = await res.json();
  console.log("XU100:", data["XU100"]);
  console.log("USDT-TRY:", data["USDT-TRY"]);
  console.log("BTC-USDT:", data["BTC-USDT"]);
  console.log("GAG=X:", data["GAG=X"]);
}
test();
